const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
require("dotenv").config();

// Connect to database
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Seed function to create a test user
const seedUser = async () => {
  try {
    // Check if user exists
    const existingUser = await User.findOne({ email: "test@example.com" });

    if (existingUser) {
      console.log("Test user already exists:", existingUser.email);
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password123", salt);

    // Create user
    const user = new User({
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      username: "testuser",
      password: hashedPassword,
      role: "level3",
    });

    await user.save();

    console.log(`Created test user: ${user.email} (${user._id})`);
    process.exit(0);
  } catch (error) {
    console.error("Error creating test user:", error);
    process.exit(1);
  }
};

// Run the seed function
seedUser();
