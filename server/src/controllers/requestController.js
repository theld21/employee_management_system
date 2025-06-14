const { validationResult } = require("express-validator");
const Request = require("../models/Request");
const User = require("../models/User");
const Group = require("../models/Group");
const RequestStatus = require("../constants/requestStatus");

// Create a new request
exports.createRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, startTime, endTime, reason, status } = req.body;
    const userId = req.user.id;

    // Create request - default status is PENDING (1)
    const request = new Request({
      user: userId,
      type,
      startTime,
      endTime,
      reason,
      status: status
        ? RequestStatus.getStatusCode(status)
        : RequestStatus.PENDING,
    });

    await request.save();

    res.status(201).json(request);
  } catch (error) {
    console.error("Lỗi tạo yêu cầu:", error);
    res.status(500).json({ message: "Lỗi tạo yêu cầu" });
  }
};

// Get all requests for current user
exports.getUserRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, type, page = 1, limit = 10 } = req.query;

    // Convert page and limit to numbers
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const query = { user: userId };
    if (status) {
      // Convert status text to status code if needed
      query.status = isNaN(parseInt(status))
        ? RequestStatus.getStatusCode(status)
        : parseInt(status);
    }
    if (type) {
      query.type = type;
    }

    // Count total documents for pagination info
    const total = await Request.countDocuments(query);

    // Get paginated requests
    const requests = await Request.find(query)
      .populate({
        path: "approvedBy.user",
        select: "firstName lastName",
      })
      .populate({
        path: "rejectedBy.user",
        select: "firstName lastName",
      })
      .populate({
        path: "cancelledBy.user",
        select: "firstName lastName",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Send back pagination info along with results - ensure we're consistently using the same response format
    res.json({
      requests,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Lỗi lấy yêu cầu:", error);
    res.status(500).json({ message: "Lỗi lấy yêu cầu" });
  }
};

// Get pending requests that need approval (for managers)
exports.getPendingRequests = async (req, res) => {
  try {
    const { role, id } = req.user;
    const { page = 1, limit = 10 } = req.query;

    // Convert page and limit to numbers
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // For admins, get all pending requests
    if (role === "admin") {
      const total = await Request.countDocuments({
        status: RequestStatus.PENDING,
      });

      const requests = await Request.find({ status: RequestStatus.PENDING })
        .populate("user", "firstName lastName username email group")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      console.log(
        `[ADMIN PENDING REQUESTS] total: ${total}, page: ${pageNum}, limit: ${limitNum}, totalPages: ${Math.ceil(
          total / limitNum
        )}`
      );

      return res.json({
        requests,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }

    // For managers, get pending requests from their group members
    if (role === "manager") {
      // Find the manager's groups
      const managerGroups = await Group.find({ manager: id });

      if (!managerGroups || managerGroups.length === 0) {
        return res
          .status(404)
          .json({ message: "Không có nhóm nào cho quản lý này" });
      }

      // Get users from these groups
      const userIds = managerGroups.flatMap((group) => group.members);

      const query = {
        user: { $in: userIds },
        status: RequestStatus.PENDING,
      };

      const total = await Request.countDocuments(query);

      const requests = await Request.find(query)
        .populate("user", "firstName lastName username email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      console.log(
        `[MANAGER PENDING REQUESTS] total: ${total}, page: ${pageNum}, limit: ${limitNum}, totalPages: ${Math.ceil(
          total / limitNum
        )}`
      );

      return res.json({
        requests,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }

    return res
      .status(403)
      .json({ message: "Không có quyền truy cập yêu cầu đang chờ" });
  } catch (error) {
    console.error("Lỗi lấy yêu cầu đang chờ:", error);
    res.status(500).json({ message: "Lỗi lấy yêu cầu đang chờ" });
  }
};

// Process request (approve/reject)
exports.processRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { requestId } = req.params;
    const { action, comment } = req.body;
    const userId = req.user.id;

    // Verify the user is a manager or admin
    if (!["admin", "manager"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Không có quyền xử lý yêu cầu này" });
    }

    // Find the request
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Yêu cầu không tồn tại" });
    }

    // Check if the request is already processed
    if (request.status !== RequestStatus.PENDING) {
      return res.status(400).json({ message: "Yêu cầu này đã được xử lý" });
    }

    // If the processor is a manager, check if they manage the user
    if (req.user.role === "manager") {
      const userGroups = await Group.find({
        manager: userId,
        members: request.user,
      });

      if (!userGroups || userGroups.length === 0) {
        return res
          .status(403)
          .json({ message: "Bạn không quản lý người dùng này" });
      }
    }

    // Update request status
    request.status =
      action === "approve" ? RequestStatus.APPROVED : RequestStatus.REJECTED;

    if (action === "approve") {
      request.approvedBy = {
        user: userId,
        date: new Date(),
        comment: comment || "",
      };
    } else {
      request.rejectedBy = {
        user: userId,
        date: new Date(),
        comment: comment || "",
      };
    }

    await request.save();
    res.json(request);
  } catch (error) {
    console.error("Lỗi xử lý yêu cầu:", error);
    res.status(500).json({ message: "Lỗi xử lý yêu cầu" });
  }
};

// Cancel request by the user who created it
exports.cancelRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { requestId } = req.params;
    const { reason = "Yêu cầu đã được hủy bởi người dùng" } = req.body;
    const userId = req.user.id;

    // Find the request
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Yêu cầu không tồn tại" });
    }

    // Check if the request belongs to the user
    if (request.user.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Không có quyền hủy yêu cầu này" });
    }

    // Check if the request is still pending
    if (request.status !== RequestStatus.PENDING) {
      return res
        .status(400)
        .json({ message: "Chỉ yêu cầu đang chờ mới có thể được hủy" });
    }

    // Lấy thông tin người dùng hiện tại để thêm vào response
    const currentUser = await User.findById(userId).select(
      "firstName lastName"
    );
    if (!currentUser) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Update request status to cancelled
    request.status = RequestStatus.CANCELLED;
    request.cancelledBy = {
      user: userId,
      date: new Date(),
      reason: reason,
    };

    await request.save();

    // Tạo một đối tượng response với thông tin đầy đủ
    const responseData = request.toObject();

    // Thêm thông tin người hủy vào response
    responseData.cancelledBy = {
      ...responseData.cancelledBy,
      user: {
        _id: currentUser._id,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
      },
    };

    res.json({
      success: true,
      message: "Yêu cầu đã được hủy thành công",
      data: responseData,
    });
  } catch (error) {
    console.error("Lỗi hủy yêu cầu:", error);
    res.status(500).json({ message: "Lỗi hủy yêu cầu" });
  }
};
