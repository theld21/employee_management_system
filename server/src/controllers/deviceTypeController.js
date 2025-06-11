const DeviceType = require("../models/DeviceType");
const { validationResult } = require("express-validator");

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
    console.error("Error fetching device types:", error);
    res.status(500).json({ message: "Error fetching device types" });
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
        message: "Device type with this name or code already exists",
      });
    }

    const deviceType = new DeviceType({
      name,
      code: code.toUpperCase(),
    });

    await deviceType.save();
    res.status(201).json(deviceType);
  } catch (error) {
    console.error("Error creating device type:", error);
    res.status(500).json({ message: "Error creating device type" });
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
      return res.status(404).json({ message: "Device type not found" });
    }

    // Check if new name or code conflicts with existing device types
    if (name !== deviceType.name || code !== deviceType.code) {
      const existingDeviceType = await DeviceType.findOne({
        _id: { $ne: id },
        $or: [{ name }, { code }],
      });

      if (existingDeviceType) {
        return res.status(400).json({
          message: "Device type with this name or code already exists",
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
    console.error("Error updating device type:", error);
    res.status(500).json({ message: "Error updating device type" });
  }
};

// Delete device type
exports.deleteDeviceType = async (req, res) => {
  try {
    const { id } = req.params;

    const deviceType = await DeviceType.findById(id);
    if (!deviceType) {
      return res.status(404).json({ message: "Device type not found" });
    }

    await deviceType.deleteOne();
    res.json({ message: "Device type deleted successfully" });
  } catch (error) {
    console.error("Error deleting device type:", error);
    res.status(500).json({ message: "Error deleting device type" });
  }
};
