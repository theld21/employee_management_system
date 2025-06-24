const Device = require("../models/Device");
const Contract = require("../models/Contract");
const { validateDevice } = require("../validators/deviceValidator");

// Get all devices without pagination (for dropdowns)
exports.getAllDevicesSimple = async (req, res) => {
  try {
    const { unassignedOnly } = req.query;
    const query = {};

    if (unassignedOnly === "true") {
      // Find devices that are not assigned to any user
      query.user = { $exists: false };
    }

    const devices = await Device.find(query)
      .select("_id code typeCode description")
      .sort({ code: 1 });
    res.json(devices);
  } catch (error) {
    console.error("Lỗi lấy thiết bị:", error);
    res.status(500).json({ message: "Lỗi lấy thiết bị" });
  }
};

// Get all devices with pagination, search, and filtering
exports.getAllDevices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const typeCode = req.query.typeCode || "";
    const sortField = req.query.sort || "createdAt";
    const sortDirection = req.query.direction === "asc" ? 1 : -1;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { note: { $regex: search, $options: "i" } },
      ];
    }

    if (typeCode) {
      query.typeCode = typeCode.toUpperCase();
    }

    const total = await Device.countDocuments(query);
    const devices = await Device.find(query)
      .sort({ [sortField]: sortDirection })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      devices,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error("Lỗi lấy thiết bị:", error);
    res.status(500).json({ message: "Lỗi lấy thiết bị" });
  }
};

// Get device by ID
exports.getDeviceById = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: "Thiết bị không tồn tại" });
    }
    res.json(device);
  } catch (error) {
    console.error("Lỗi lấy thiết bị:", error);
    res.status(500).json({ message: "Lỗi lấy thiết bị" });
  }
};

// Create new device
exports.createDevice = async (req, res) => {
  try {
    const validation = validateDevice(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        message: "Lỗi xác thực",
        errors: validation.errors,
      });
    }

    const { code, typeCode, description, note } = validation.data;

    // Check if device with same code and typeCode already exists
    const existingDevice = await Device.findOne({ code, typeCode });
    if (existingDevice) {
      return res.status(400).json({
        message: "Một thiết bị với mã này đã tồn tại cho loại này",
      });
    }

    const device = new Device({
      code,
      typeCode,
      description,
      note,
    });

    await device.save();
    res.status(201).json(device);
  } catch (error) {
    console.error("Lỗi tạo thiết bị:", error);
    if (error.code === 11000) {
      // Kiểm tra xem lỗi có phải do trùng code không
      const duplicateKey = Object.keys(error.keyPattern)[0];
      if (duplicateKey === "code") {
        return res.status(400).json({
          message: "Mã thiết bị này đã tồn tại trong hệ thống",
        });
      }
    }
    res.status(500).json({ message: "Lỗi khi tạo thiết bị" });
  }
};

// Update device
exports.updateDevice = async (req, res) => {
  try {
    const validation = validateDevice(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        message: "Lỗi xác thực",
        errors: validation.errors,
      });
    }

    const { code, typeCode, description, note } = validation.data;

    // Check if device exists
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: "Thiết bị không tồn tại" });
    }

    // Check if another device with same code and typeCode already exists
    const existingDevice = await Device.findOne({
      code,
      typeCode,
      _id: { $ne: req.params.id },
    });
    if (existingDevice) {
      return res.status(400).json({
        message: "Một thiết bị với mã này đã tồn tại cho loại này",
      });
    }

    device.code = code;
    device.typeCode = typeCode;
    device.description = description;
    device.note = note;

    await device.save();
    res.json(device);
  } catch (error) {
    console.error("Lỗi cập nhật thiết bị:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Một thiết bị với mã này đã tồn tại cho loại này",
      });
    }
    res.status(500).json({ message: "Lỗi cập nhật thiết bị" });
  }
};

// Delete device
exports.deleteDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: "Thiết bị không tồn tại" });
    }

    // Check if any contracts are using this device
    const contractsUsingDevice = await Contract.find({ device: req.params.id });
    if (contractsUsingDevice.length > 0) {
      return res.status(400).json({
        message: `Không thể xóa thiết bị này vì có ${contractsUsingDevice.length} biên bản đang sử dụng. Vui lòng xóa hoặc chuyển đổi các biên bản trước khi xóa thiết bị.`,
      });
    }

    await Device.findByIdAndDelete(req.params.id);
    res.json({ message: "Thiết bị đã được xóa thành công" });
  } catch (error) {
    console.error("Lỗi xóa thiết bị:", error);
    res.status(500).json({ message: "Lỗi xóa thiết bị" });
  }
};

// Get devices by user ID
exports.getDevicesByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const devices = await Device.find({ user: userId })
      .select("_id code typeCode description")
      .sort({ code: 1 });
    res.json(devices);
  } catch (error) {
    console.error("Lỗi lấy thiết bị của người dùng:", error);
    res.status(500).json({ message: "Lỗi lấy thiết bị" });
  }
};
