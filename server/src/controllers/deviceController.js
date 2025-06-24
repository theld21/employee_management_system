const Device = require("../models/Device");
const Contract = require("../models/Contract");
const { validateDevice } = require("../validators/deviceValidator");

// Get all devices without pagination (for dropdowns)
exports.getAllDevicesSimple = async (req, res) => {
  try {
    const { unassignedOnly } = req.query;
    let devices = [];
    if (unassignedOnly === "true") {
      // Lấy hợp đồng mới nhất cho mỗi thiết bị
      const latestContracts = await Contract.aggregate([
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$device",
            latestContract: { $first: "$$ROOT" },
          },
        },
      ]);
      // Lấy danh sách deviceId đã được ASSIGNMENT
      const assignedDeviceIds = latestContracts
        .filter((c) => c.latestContract.type === "ASSIGNMENT")
        .map((c) => c._id.toString());
      // Lấy tất cả thiết bị không nằm trong danh sách đã được ASSIGNMENT
      devices = await Device.find({ _id: { $nin: assignedDeviceIds } })
        .select("_id code typeCode description")
        .sort({ code: 1 });
    } else {
      devices = await Device.find()
        .select("_id code typeCode description")
        .sort({ code: 1 });
    }
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

// API: Get current owner of a device
exports.getDeviceOwner = async (req, res) => {
  try {
    const deviceId = req.params.id;
    // Lấy hợp đồng mới nhất của thiết bị (ưu tiên thời gian tạo mới nhất)
    const latestContract = await Contract.findOne({ device: deviceId })
      .sort({ createdAt: -1 })
      .populate("user");

    if (!latestContract || latestContract.type === "RECOVERY") {
      // Không có hợp đồng hoặc hợp đồng mới nhất là thu hồi => chưa ai sở hữu
      return res.json({ owner: null });
    }
    // Nếu là ASSIGNMENT => user đang sở hữu
    return res.json({ owner: latestContract.user });
  } catch (error) {
    console.error("Lỗi lấy user sở hữu thiết bị:", error);
    res.status(500).json({ message: "Lỗi lấy user sở hữu thiết bị" });
  }
};

// API: Get all devices currently assigned to a user (for recovery)
exports.getAssignedDevices = async (req, res) => {
  try {
    // Lấy hợp đồng mới nhất cho mỗi thiết bị
    const latestContracts = await Contract.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$device",
          latestContract: { $first: "$$ROOT" },
        },
      },
      {
        $match: {
          "latestContract.type": "ASSIGNMENT",
        },
      },
    ]);
    const deviceIds = latestContracts.map((c) => c._id);
    // Lấy device và user đang sở hữu
    const devices = await Device.find({ _id: { $in: deviceIds } });
    // Lấy user cho từng device
    const userIds = latestContracts.map((c) => c.latestContract.user);
    const users = await require("../models/User").find({
      _id: { $in: userIds },
    });
    // Map userId -> user
    const userMap = {};
    users.forEach((u) => {
      userMap[u._id.toString()] = u;
    });
    // Kết hợp device với user
    const result = devices.map((device) => {
      const contract = latestContracts.find(
        (c) => c._id.toString() === device._id.toString()
      );
      const user = contract
        ? userMap[contract.latestContract.user.toString()]
        : null;
      return { ...device.toObject(), owner: user };
    });
    res.json(result);
  } catch (error) {
    console.error("Lỗi lấy thiết bị đang có người sử dụng:", error);
    res.status(500).json({ message: "Lỗi lấy thiết bị đang có người sử dụng" });
  }
};
