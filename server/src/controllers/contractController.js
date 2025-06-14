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
      query.$or = [
        { note: { $regex: search, $options: "i" } },
      ];
    }

    if (type) {
      query.type = type.toUpperCase();
    }

    if (status) {
      query.status = status.toUpperCase();
    }

    const total = await Contract.countDocuments(query);
    const contracts = await Contract.find(query)
      .populate('device')
      .populate('user')
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
    console.error("Error fetching contracts:", error);
    res.status(500).json({ message: "Error fetching contracts" });
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
      .populate('device')
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
    console.error("Error fetching user contracts:", error);
    res.status(500).json({ message: "Error fetching contracts" });
  }
};

// Get contract by ID
exports.getContractById = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('device')
      .populate('user');
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }
    res.json(contract);
  } catch (error) {
    console.error("Error fetching contract:", error);
    res.status(500).json({ message: "Error fetching contract" });
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
        status: { $in: ["PENDING", "CONFIRMED"] }
      });

      if (existingAssignment) {
        return res.status(400).json({ 
          message: "Device is already assigned or pending assignment" 
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
      .populate('device')
      .populate('user');
    res.status(201).json(populatedContract);
  } catch (error) {
    console.error("Error creating contract:", error);
    res.status(500).json({ message: "Error creating contract" });
  }
};

// Update contract
exports.updateContract = async (req, res) => {
  try {
    const { deviceId, userId, type, note } = req.body;

    // Check if contract exists
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Check if device exists
    if (deviceId && deviceId !== contract.device.toString()) {
      const device = await Device.findById(deviceId);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
    }

    // Update fields
    if (deviceId) contract.device = deviceId;
    if (userId) contract.user = userId;
    if (type) contract.type = type.toUpperCase();
    if (note !== undefined) contract.note = note;

    await contract.save();
    const populatedContract = await Contract.findById(contract._id)
      .populate('device')
      .populate('user');
    res.json(populatedContract);
  } catch (error) {
    console.error("Error updating contract:", error);
    res.status(500).json({ message: "Error updating contract" });
  }
};

// Delete contract
exports.deleteContract = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    await Contract.findByIdAndDelete(req.params.id);
    res.json({ message: "Contract deleted successfully" });
  } catch (error) {
    console.error("Error deleting contract:", error);
    res.status(500).json({ message: "Error deleting contract" });
  }
};

// Confirm contract (for users)
exports.confirmContract = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Check if the logged-in user matches the contract's user
    if (contract.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to confirm this contract" });
    }

    if (contract.status !== "PENDING") {
      return res.status(400).json({ message: "Contract is not in pending status" });
    }

    contract.status = "CONFIRMED";
    await contract.save();
    
    const populatedContract = await Contract.findById(contract._id)
      .populate('device')
      .populate('user');
    res.json(populatedContract);
  } catch (error) {
    console.error("Error confirming contract:", error);
    res.status(500).json({ message: "Error confirming contract" });
  }
};

// Reject contract (for users)
exports.rejectContract = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Check if the logged-in user matches the contract's user
    if (contract.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to reject this contract" });
    }

    if (contract.status !== "PENDING") {
      return res.status(400).json({ message: "Contract is not in pending status" });
    }

    contract.status = "REJECTED";
    await contract.save();
    
    const populatedContract = await Contract.findById(contract._id)
      .populate('device')
      .populate('user');
    res.json(populatedContract);
  } catch (error) {
    console.error("Error rejecting contract:", error);
    res.status(500).json({ message: "Error rejecting contract" });
  }
};

// Complete contract (for admins)
exports.completeContract = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (contract.status !== "CONFIRMED") {
      return res.status(400).json({ message: "Contract is not in confirmed status" });
    }

    contract.status = "COMPLETED";
    await contract.save();
    
    const populatedContract = await Contract.findById(contract._id)
      .populate('device')
      .populate('user');
    res.json(populatedContract);
  } catch (error) {
    console.error("Error completing contract:", error);
    res.status(500).json({ message: "Error completing contract" });
  }
};
