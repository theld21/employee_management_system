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

    // Get paginated accounts
    const accounts = await User.find(query, "-password")
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
      .json({ message: "Error fetching accounts", error: error.message });
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
      department,
      role,
    } = req.body;

    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({
        message: "Missing required fields",
        error:
          "Username, email, password, firstName, and lastName are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { employeeId }],
    });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const user = new User({
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
      department,
      role: role || "user",
      status: "active",
    });

    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error("Server error creating account:", error);
    res.status(500).json({
      message: "Error creating account",
      error: error.message || "Internal server error",
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
      department,
      role,
      status,
    } = req.body;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if employeeId is being changed and if it's already taken
    if (employeeId && employeeId !== user.employeeId) {
      const existingUser = await User.findOne({ employeeId });
      if (existingUser) {
        return res.status(400).json({ message: "Employee ID already exists" });
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
    if (department) user.department = department;
    if (role) user.role = role;
    if (status) user.status = status;

    await user.save();

    // Return updated user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(userResponse);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating account", error: error.message });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(id);
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting account", error: error.message });
  }
};
