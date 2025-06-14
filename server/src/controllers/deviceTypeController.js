const DeviceType = require("../models/DeviceType");
const { validationResult } = require("express-validator");

// Get all device types (simple list for dropdowns)
exports.getAllDeviceTypes = async (req, res) => {
  try {
    const deviceTypes = await DeviceType.find({ isActive: true })
      .select("_id name code")
      .sort({ name: 1 });
    res.json(deviceTypes);
  } catch (error) {
    console.error("Lỗi lấy loại thiết bị:", error);
    res.status(500).json({ message: "Lỗi lấy loại thiết bị" });
  }
};

// Get all device types with pagination and search
exports.getDeviceTypes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const sortField = req.query.sort || "name";
    const sortDirection = req.query.direction === "desc" ? -1 : 1;

    const query = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ],
    };

    const total = await DeviceType.countDocuments(query);
    const deviceTypes = await DeviceType.find(query)
      .sort({ [sortField]: sortDirection })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      deviceTypes,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Lỗi lấy loại thiết bị:", error);
    res.status(500).json({ message: "Lỗi lấy loại thiết bị" });
  }
};

// Create new device type
exports.createDeviceType = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, code } = req.body;

    // Check if device type with same name or code already exists
    const existingDeviceType = await DeviceType.findOne({
      $or: [{ name }, { code }],
    });

    if (existingDeviceType) {
      return res.status(400).json({
        message: "Loại thiết bị với tên hoặc mã này đã tồn tại",
      });
    }

    const deviceType = new DeviceType({
      name,
      code: code.toUpperCase(),
    });

    await deviceType.save();
    res.status(201).json(deviceType);
  } catch (error) {
    console.error("Lỗi tạo loại thiết bị:", error);
    res.status(500).json({ message: "Lỗi tạo loại thiết bị" });
  }
};

// Update device type
exports.updateDeviceType = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, code, isActive } = req.body;

    const deviceType = await DeviceType.findById(id);
    if (!deviceType) {
      return res.status(404).json({ message: "Loại thiết bị không tồn tại" });
    }

    // Check if new name or code conflicts with existing device types
    if (name !== deviceType.name || code !== deviceType.code) {
      const existingDeviceType = await DeviceType.findOne({
        _id: { $ne: id },
        $or: [{ name }, { code }],
      });

      if (existingDeviceType) {
        return res.status(400).json({
          message: "Loại thiết bị với tên hoặc mã này đã tồn tại",
        });
      }
    }

    deviceType.name = name;
    deviceType.code = code.toUpperCase();
    if (typeof isActive === "boolean") {
      deviceType.isActive = isActive;
    }

    await deviceType.save();
    res.json(deviceType);
  } catch (error) {
    console.error("Lỗi cập nhật loại thiết bị:", error);
    res.status(500).json({ message: "Lỗi cập nhật loại thiết bị" });
  }
};

// Delete device type
exports.deleteDeviceType = async (req, res) => {
  try {
    const { id } = req.params;

    const deviceType = await DeviceType.findById(id);
    if (!deviceType) {
      return res.status(404).json({ message: "Loại thiết bị không tồn tại" });
    }

    await deviceType.deleteOne();
    res.json({ message: "Loại thiết bị đã được xóa thành công" });
  } catch (error) {
    console.error("Lỗi xóa loại thiết bị:", error);
    res.status(500).json({ message: "Lỗi xóa loại thiết bị" });
  }
};
