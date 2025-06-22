const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const { JWT_SECRET, JWT_EXPIRATION } = require("../config/auth");

// Register a new user
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      username,
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      address,
      position,
      department,
    } = req.body;

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ message: "Tài khoản đã tồn tại" });
    }

    // Create new user
    user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      address,
      position,
      department,
      role: "employee",
    });

    await user.save();

    // Generate JWT token
    const payload = {
      id: user.id,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Tên đăng nhập hoặc mật khẩu không hợp lệ" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: "Tài khoản đã bị vô hiệu hóa" });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    console.log(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu không hợp lệ" });
    }

    // Generate JWT token
    const payload = {
      id: user.id,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Tài khoản không tồn tại" });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

// Update current user profile
exports.updateProfile = async (req, res) => {
  try {
    // Only allow specific fields to be updated to avoid unwanted changes
    const ALLOWED_FIELDS = [
      "firstName",
      "lastName",
      "phoneNumber",
      "address",
      "position",
      "department",
      "gender",
      "dateOfBirth",
      "email",
    ];

    const updates = {};
    ALLOWED_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ message: "No valid fields provided for update" });
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    }).select("-password");

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
