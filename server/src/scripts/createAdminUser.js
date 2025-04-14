/**
 * Script to create admin user if it doesn't exist
 * Run with: node src/scripts/createAdminUser.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: "admin" });
    if (existingAdmin) {
      console.log("Admin user already exists with ID:", existingAdmin._id);
      process.exit(0);
      return;
    }

    // Create admin user if it doesn't exist
    const adminUser = await User.create({
      username: "admin",
      email: "admin@example.com",
      password: "admin123",
      firstName: "Admin",
      lastName: "User",
      phoneNumber: "0123456789",
      address: "Admin Office",
      position: "System Administrator",
      department: "IT",
      role: "admin",
    });

    console.log("Admin user created successfully with ID:", adminUser._id);
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
};

// Run the function
createAdminUser();
