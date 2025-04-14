/**
 * Script to generate fake attendance data for a specific user
 * Run with: node src/scripts/generateAttendanceData.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Attendance = require("../models/Attendance");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Function to generate a random time between two given times
const getRandomTime = (startHour, startMin, endHour, endMin) => {
  const start = startHour * 60 + startMin;
  const end = endHour * 60 + endMin;
  const randomMinutes = Math.floor(Math.random() * (end - start + 1)) + start;
  const hours = Math.floor(randomMinutes / 60);
  const minutes = randomMinutes % 60;
  return { hours, minutes };
};

// Function to create attendance data for a single day
const createAttendanceForDay = async (userId, date) => {
  // Skip weekends (Saturday = 6, Sunday = 0)
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return null;
  }

  // Random attendance patterns
  const attendanceTypes = ["present", "late", "absent", "half-day"];
  const randomType = Math.random();

  // 70% present, 15% late, 10% absent, 5% half-day
  let attendanceType;
  if (randomType < 0.7) {
    attendanceType = "present";
  } else if (randomType < 0.85) {
    attendanceType = "late";
  } else if (randomType < 0.95) {
    attendanceType = "absent";
  } else {
    attendanceType = "half-day";
  }

  const attendance = {
    user: userId,
    date: new Date(date),
    status: attendanceType,
  };

  // Generate check-in/check-out times based on attendance type
  if (attendanceType !== "absent") {
    // For present: check in between 7:45 and 8:15
    // For late: check in between 8:30 and 10:00
    // For half-day: check in between 12:00 and 13:00
    let checkInTime, checkOutTime;

    if (attendanceType === "present") {
      checkInTime = getRandomTime(7, 45, 8, 15);
    } else if (attendanceType === "late") {
      checkInTime = getRandomTime(8, 30, 10, 0);
    } else if (attendanceType === "half-day") {
      checkInTime = getRandomTime(12, 0, 13, 0);
    }

    // Set check-in time
    const checkIn = new Date(date);
    checkIn.setHours(checkInTime.hours, checkInTime.minutes, 0, 0);
    attendance.checkIn = {
      time: checkIn,
    };

    // Set check-out time (present: 17:30-18:30, late: 17:00-18:00, half-day: 16:00-17:00)
    if (attendanceType === "present") {
      checkOutTime = getRandomTime(17, 30, 18, 30);
    } else if (attendanceType === "late") {
      checkOutTime = getRandomTime(17, 0, 18, 0);
    } else if (attendanceType === "half-day") {
      checkOutTime = getRandomTime(16, 0, 17, 0);
    }

    const checkOut = new Date(date);
    checkOut.setHours(checkOutTime.hours, checkOutTime.minutes, 0, 0);
    attendance.checkOut = {
      time: checkOut,
    };

    // Calculate total hours
    const checkInMs = checkIn.getTime();
    const checkOutMs = checkOut.getTime();
    attendance.totalHours = (checkOutMs - checkInMs) / (1000 * 60 * 60);
  }

  try {
    // Check if attendance for this day already exists
    const existing = await Attendance.findOne({
      user: userId,
      date: {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999)),
      },
    });

    if (existing) {
      console.log(
        `Attendance for ${
          date.toISOString().split("T")[0]
        } already exists, updating...`
      );
      return await Attendance.findByIdAndUpdate(existing._id, attendance, {
        new: true,
      });
    } else {
      return await Attendance.create(attendance);
    }
  } catch (error) {
    console.error(
      `Error creating attendance for ${date.toISOString().split("T")[0]}:`,
      error
    );
    return null;
  }
};

// Main function to generate attendance data
const generateAttendanceData = async () => {
  try {
    // Find admin user
    const adminUser = await User.findOne({ username: "admin" });
    if (!adminUser) {
      console.error("Admin user not found");
      return;
    }

    console.log(
      `Generating attendance data for user: ${adminUser.username} (${adminUser._id})`
    );

    // Define date range: March 1, 2025 to current date
    const startDate = new Date(2025, 2, 1); // Month is 0-indexed (2 = March)
    const endDate = new Date();

    // Generate attendance data for each day in the range
    let currentDate = new Date(startDate);
    const results = [];

    while (currentDate <= endDate) {
      const attendance = await createAttendanceForDay(
        adminUser._id,
        new Date(currentDate)
      );
      if (attendance) {
        results.push(attendance);
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`Successfully generated ${results.length} attendance records.`);
    process.exit(0);
  } catch (error) {
    console.error("Error generating attendance data:", error);
    process.exit(1);
  }
};

// Run the function
generateAttendanceData();
