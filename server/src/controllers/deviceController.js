const Device = require("../models/Device");
const { validateDevice } = require("../validators/deviceValidator");

// Get all devices without pagination (for dropdowns)
exports.getAllDevicesSimple = async (req, res) => {
  try {
    const devices = await Device.find()
      .select("_id code typeCode description")
      .sort({ code: 1 });
    res.json(devices);
  } catch (error) {
    console.error("Error fetching devices:", error);
    res.status(500).json({ message: "Error fetching devices" });
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
    console.error("Error fetching devices:", error);
    res.status(500).json({ message: "Error fetching devices" });
  }
};

// Get device by ID
exports.getDeviceById = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }
    res.json(device);
  } catch (error) {
    console.error("Error fetching device:", error);
    res.status(500).json({ message: "Error fetching device" });
  }
};

// Create new device
exports.createDevice = async (req, res) => {
  try {
    const validation = validateDevice(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const { code, typeCode, description, note } = validation.data;

    // Check if device with same code and typeCode already exists
    const existingDevice = await Device.findOne({ code, typeCode });
    if (existingDevice) {
      return res.status(400).json({
        message: "A device with this code already exists for this type",
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
    console.error("Error creating device:", error);
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
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const { code, typeCode, description, note } = validation.data;

    // Check if device exists
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    // Check if another device with same code and typeCode already exists
    const existingDevice = await Device.findOne({
      code,
      typeCode,
      _id: { $ne: req.params.id },
    });
    if (existingDevice) {
      return res.status(400).json({
        message: "A device with this code already exists for this type",
      });
    }

    device.code = code;
    device.typeCode = typeCode;
    device.description = description;
    device.note = note;

    await device.save();
    res.json(device);
  } catch (error) {
    console.error("Error updating device:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        message: "A device with this code already exists for this type",
      });
    }
    res.status(500).json({ message: "Error updating device" });
  }
};

// Delete device
exports.deleteDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    await Device.findByIdAndDelete(req.params.id);
    res.json({ message: "Device deleted successfully" });
  } catch (error) {
    console.error("Error deleting device:", error);
    res.status(500).json({ message: "Error deleting device" });
  }
};
