const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Get all accounts
exports.getAllAccounts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    // Convert page and limit to numbers
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build search query
    let query = {};
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query = {
        $or: [
          { username: searchRegex },
          { email: searchRegex },
          { firstName: searchRegex },
          { lastName: searchRegex },
        ],
      };
    }

    // Count total documents for pagination info
    const total = await User.countDocuments(query);

    // Get paginated accounts with group populated
    const accounts = await User.find(query, "-password")
      .populate("group", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    console.log(
      `[PAGINATION INFO] total: ${total}, page: ${pageNum}, limit: ${limitNum}, totalPages: ${Math.ceil(
        total / limitNum
      )}, search: ${search}`
    );

    // Send back pagination info along with results
    res.json({
      accounts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi lấy tài khoản", error: error.message });
  }
};

// Create new account
exports.createAccount = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      employeeId,
      gender,
      dateOfBirth,
      phoneNumber,
      address,
      position,
      role,
      group,
      startDate,
    } = req.body;

    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({
        message: "Thiếu trường bắt buộc",
        error: "Username, email, password, firstName, và lastName là bắt buộc",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { employeeId }],
    });
    if (existingUser) {
      return res.status(400).json({ message: "Tài khoản đã tồn tại" });
    }

    // Create user object with basic fields
    const userData = {
      username,
      email,
      password,
      firstName,
      lastName,
      employeeId,
      gender,
      dateOfBirth,
      phoneNumber,
      address,
      position,
      role: role || "user",
      status: "active",
      startDate,
    };

    // Only add group if it's a valid non-empty value
    if (group && group.trim()) {
      userData.group = group;
    }

    // Create new user
    const user = new User(userData);
    await user.save();

    // Return user without password and with group populated
    const userResponse = await User.findById(user._id, "-password").populate(
      "group",
      "name"
    );

    res.status(201).json(userResponse);
  } catch (error) {
    console.error("Lỗi tạo tài khoản:", error);
    res.status(500).json({
      message: "Lỗi tạo tài khoản",
      error: error.message || "Lỗi máy chủ",
    });
  }
};

// Update account
exports.updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      username,
      email,
      firstName,
      lastName,
      employeeId,
      gender,
      dateOfBirth,
      phoneNumber,
      address,
      position,
      role,
      status,
      group,
      startDate,
      leaveDays,
    } = req.body;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Tài khoản không tồn tại" });
    }

    // Check if employeeId is being changed and if it's already taken
    if (employeeId && employeeId !== user.employeeId) {
      const existingUser = await User.findOne({ employeeId });
      if (existingUser) {
        return res.status(400).json({ message: "Mã nhân viên đã tồn tại" });
      }
    }

    // Update user fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (employeeId) user.employeeId = employeeId;
    if (gender) user.gender = gender;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (address) user.address = address;
    if (position) user.position = position;
    if (role) user.role = role;
    if (status) user.status = status;
    if (group !== undefined && group !== null && group !== "")
      user.group = group;
    if (startDate) user.startDate = startDate;

    // Chỉ update leaveDays khi được truyền vào và là số hợp lệ
    if (leaveDays !== undefined && leaveDays !== null) {
      // Convert to number with 1 decimal place
      const formattedLeaveDays = Number(Number(leaveDays).toFixed(1));

      // Validate số ngày phép
      if (isNaN(formattedLeaveDays) || formattedLeaveDays < 0) {
        return res.status(400).json({
          message: "Số ngày phép không hợp lệ",
          error: "Leave days must be a non-negative number",
        });
      }

      user.leaveDays = formattedLeaveDays;
    }

    await user.save();

    // Return updated user without password and with group populated
    const userResponse = await User.findById(id, "-password").populate(
      "group",
      "name"
    );

    res.json(userResponse);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi cập nhật tài khoản", error: error.message });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Tài khoản không tồn tại" });
    }

    await User.findByIdAndDelete(id);
    res.json({ message: "Tài khoản đã được xóa thành công" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi xóa tài khoản", error: error.message });
  }
};

// Update leave days manually
exports.updateLeaveDays = async (req, res) => {
  try {
    const { id } = req.params;
    const { leaveDays } = req.body;

    if (typeof leaveDays !== "number") {
      return res.status(400).json({ message: "Số ngày phép phải là một số" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Tài khoản không tồn tại" });
    }

    user.leaveDays = leaveDays;
    await user.save();

    res.json({ message: "Cập nhật số ngày phép thành công", user });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi cập nhật số ngày phép",
      error: error.message,
    });
  }
};

// Get user's leave days
exports.getLeaveDays = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id, "leaveDays firstName lastName");
    if (!user) {
      return res.status(404).json({ message: "Tài khoản không tồn tại" });
    }

    res.json({
      leaveDays: user.leaveDays,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy thông tin ngày phép",
      error: error.message,
    });
  }
};
