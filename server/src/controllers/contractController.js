const Contract = require("../models/Contract");
const Device = require("../models/Device");

// Get all contracts with pagination, search, and filtering
exports.getAllContracts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const type = req.query.type || "";
    const status = req.query.status || "";
    const sortField = req.query.sort || "createdAt";
    const sortDirection = req.query.direction === "asc" ? 1 : -1;

    // Build query
    const query = {};

    if (search) {
      query.$or = [{ note: { $regex: search, $options: "i" } }];
    }

    if (type) {
      query.type = type.toUpperCase();
    }

    if (status) {
      query.status = status.toUpperCase();
    }

    const total = await Contract.countDocuments(query);
    const contracts = await Contract.find(query)
      .populate("device")
      .populate("user")
      .sort({ [sortField]: sortDirection })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      contracts,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error("Lỗi lấy hợp đồng:", error);
    res.status(500).json({ message: "Lỗi lấy hợp đồng" });
  }
};

// Get contracts for a specific user
exports.getUserContracts = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || "";

    const query = { user: userId };

    if (status) {
      query.status = status.toUpperCase();
    }

    const total = await Contract.countDocuments(query);
    const contracts = await Contract.find(query)
      .populate("device")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      contracts,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error("Lỗi lấy hợp đồng của người dùng:", error);
    res.status(500).json({ message: "Lỗi lấy hợp đồng" });
  }
};

// Get contract by ID
exports.getContractById = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate("device")
      .populate("user");
    if (!contract) {
      return res.status(404).json({ message: "Hợp đồng không tồn tại" });
    }
    res.json(contract);
  } catch (error) {
    console.error("Lỗi lấy hợp đồng:", error);
    res.status(500).json({ message: "Lỗi lấy hợp đồng" });
  }
};

// Create new contract
exports.createContract = async (req, res) => {
  try {
    const { deviceId, userId, type, note } = req.body;

    // Check if device exists
    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    // Check if user exists - we don't have a User model reference, so we'll assume it exists
    // In a real app, you would validate the user ID here

    // For ASSIGNMENT contracts, check if device is already assigned
    if (type === "ASSIGNMENT") {
      const existingAssignment = await Contract.findOne({
        device: deviceId,
        type: "ASSIGNMENT",
        status: { $in: ["PENDING", "CONFIRMED"] },
      });

      if (existingAssignment) {
        return res.status(400).json({
          message: "Thiết bị đã được gán hoặc đang chờ gán",
        });
      }
    }

    const contract = new Contract({
      device: deviceId,
      user: userId,
      type: type.toUpperCase(),
      note,
    });

    await contract.save();
    const populatedContract = await Contract.findById(contract._id)
      .populate("device")
      .populate("user");
    res.status(201).json(populatedContract);
  } catch (error) {
    console.error("Lỗi tạo hợp đồng:", error);
    res.status(500).json({ message: "Lỗi tạo hợp đồng" });
  }
};

// Update contract
exports.updateContract = async (req, res) => {
  try {
    const { deviceId, userId, type, note } = req.body;

    // Check if contract exists
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: "Hợp đồng không tồn tại" });
    }

    // Check if device exists
    if (deviceId && deviceId !== contract.device.toString()) {
      const device = await Device.findById(deviceId);
      if (!device) {
        return res.status(404).json({ message: "Thiết bị không tồn tại" });
      }
    }

    // Update fields
    if (deviceId) contract.device = deviceId;
    if (userId) contract.user = userId;
    if (type) contract.type = type.toUpperCase();
    if (note !== undefined) contract.note = note;

    await contract.save();
    const populatedContract = await Contract.findById(contract._id)
      .populate("device")
      .populate("user");
    res.json(populatedContract);
  } catch (error) {
    console.error("Lỗi cập nhật hợp đồng:", error);
    res.status(500).json({ message: "Lỗi cập nhật hợp đồng" });
  }
};

// Delete contract
exports.deleteContract = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: "Hợp đồng không tồn tại" });
    }

    await Contract.findByIdAndDelete(req.params.id);
    res.json({ message: "Hợp đồng đã được xóa thành công" });
  } catch (error) {
    console.error("Lỗi xóa hợp đồng:", error);
    res.status(500).json({ message: "Lỗi xóa hợp đồng" });
  }
};

// Confirm contract (for users)
exports.confirmContract = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: "Hợp đồng không tồn tại" });
    }

    // Check if the logged-in user matches the contract's user
    if (contract.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Không có quyền xác nhận hợp đồng này" });
    }

    if (contract.status !== "PENDING") {
      return res
        .status(400)
        .json({ message: "Hợp đồng không ở trạng thái chờ" });
    }

    contract.status = "CONFIRMED";
    await contract.save();

    const populatedContract = await Contract.findById(contract._id)
      .populate("device")
      .populate("user");
    res.json(populatedContract);
  } catch (error) {
    console.error("Lỗi xác nhận hợp đồng:", error);
    res.status(500).json({ message: "Lỗi xác nhận hợp đồng" });
  }
};

// Reject contract (for users)
exports.rejectContract = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: "Hợp đồng không tồn tại" });
    }

    // Check if the logged-in user matches the contract's user
    if (contract.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Không có quyền từ chối hợp đồng này" });
    }

    if (contract.status !== "PENDING") {
      return res
        .status(400)
        .json({ message: "Hợp đồng không ở trạng thái chờ" });
    }

    contract.status = "REJECTED";
    await contract.save();

    const populatedContract = await Contract.findById(contract._id)
      .populate("device")
      .populate("user");
    res.json(populatedContract);
  } catch (error) {
    console.error("Lỗi từ chối hợp đồng:", error);
    res.status(500).json({ message: "Lỗi từ chối hợp đồng" });
  }
};

// Complete contract (for admins)
exports.completeContract = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: "Hợp đồng không tồn tại" });
    }

    if (contract.status !== "CONFIRMED") {
      return res
        .status(400)
        .json({ message: "Hợp đồng không ở trạng thái đã xác nhận" });
    }

    contract.status = "COMPLETED";
    await contract.save();

    const populatedContract = await Contract.findById(contract._id)
      .populate("device")
      .populate("user");
    res.json(populatedContract);
  } catch (error) {
    console.error("Lỗi hoàn thành hợp đồng:", error);
    res.status(500).json({ message: "Lỗi hoàn thành hợp đồng" });
  }
};
