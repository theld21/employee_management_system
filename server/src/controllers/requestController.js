const { validationResult } = require("express-validator");
const Request = require("../models/Request");
const User = require("../models/User");
const Group = require("../models/Group");

// Create a new request
exports.createRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, startTime, endTime, reason, status = "pending" } = req.body;
    const userId = req.user.id;

    // Create request
    const request = new Request({
      user: userId,
      type,
      startTime,
      endTime,
      reason,
      status,
    });

    await request.save();

    res.status(201).json(request);
  } catch (error) {
    console.error("Error creating request:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all requests for current user
exports.getUserRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, type } = req.query;

    const query = { user: userId };
    if (status) {
      query.status = status;
    }
    if (type) {
      query.type = type;
    }

    const requests = await Request.find(query)
      .populate("approvedBy.user", "firstName lastName")
      .populate("rejectedBy.user", "firstName lastName")
      .populate("cancelledBy.user", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error("Error fetching user requests:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get pending requests that need approval (for managers)
exports.getPendingRequests = async (req, res) => {
  try {
    const { role, id } = req.user;

    // For admins, get all pending requests
    if (role === "admin") {
      const requests = await Request.find({ status: "pending" })
        .populate("user", "firstName lastName username email group")
        .sort({ createdAt: -1 });

      return res.json(requests);
    }

    // For managers, get pending requests from their group members
    if (role === "manager" || role === "level1" || role === "level2") {
      // Find the manager's groups
      const managerGroups = await Group.find({ manager: id });

      if (!managerGroups || managerGroups.length === 0) {
        return res
          .status(404)
          .json({ message: "No groups found for this manager" });
      }

      // Get users from these groups
      const userIds = managerGroups.flatMap((group) => group.members);

      const requests = await Request.find({
        user: { $in: userIds },
        status: "pending",
      })
        .populate("user", "firstName lastName username email")
        .sort({ createdAt: -1 });

      return res.json(requests);
    }

    return res
      .status(403)
      .json({ message: "Not authorized to access pending requests" });
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    res.status(500).json({ message: "Server error" });
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
    if (!["admin", "manager", "level1", "level2"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Not authorized to process this request" });
    }

    // Find the request
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Check if the request is already processed
    if (request.status !== "pending") {
      return res
        .status(400)
        .json({ message: "This request has already been processed" });
    }

    // If the processor is a manager, check if they manage the user
    if (["manager", "level1", "level2"].includes(req.user.role)) {
      const userGroups = await Group.find({
        manager: userId,
        members: request.user,
      });

      if (!userGroups || userGroups.length === 0) {
        return res.status(403).json({ message: "You do not manage this user" });
      }
    }

    // Update request status
    request.status = action === "approve" ? "approved" : "rejected";

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
    console.error("Error processing request:", error);
    res.status(500).json({ message: "Server error" });
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
    const { reason } = req.body;
    const userId = req.user.id;

    // Find the request
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Check if the request belongs to the user
    if (request.user.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this request" });
    }

    // Check if the request is still pending
    if (request.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending requests can be cancelled" });
    }

    // Update request status to cancelled
    request.status = "cancelled";
    request.cancelledBy = {
      user: userId,
      date: new Date(),
      reason: reason,
    };

    await request.save();
    res.json(request);
  } catch (error) {
    console.error("Error cancelling request:", error);
    res.status(500).json({ message: "Server error" });
  }
};
