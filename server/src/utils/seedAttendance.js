const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
require("dotenv").config();

// Connect to database
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define constants
const CHECKIN_DEADLINE_HOUR = 8;
const CHECKIN_DEADLINE_MINUTE = 30;
const CHECKOUT_MINIMUM_HOUR = 17;
const CHECKOUT_MINIMUM_MINUTE = 30;

// Seed function to create random attendance data for a user
const seedAttendanceData = async () => {
  try {
    // Find the first user from the database or replace with a specific email
    const user = await User.findOne();

    if (!user) {
      console.error("No users found in the database");
      process.exit(1);
    }

    console.log(`Using user: ${user.email} (${user._id})`);

    // Get current month's start and end dates
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Clear existing attendance records for this period
    await Attendance.deleteMany({
      user: user._id,
      date: { $gte: startDate, $lte: endDate },
    });

    const weekdaysInMonth = [];
    let currentDate = new Date(startDate);

    // Generate array of weekdays in the month (including past weekdays)
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();

      // 0 is Sunday, 6 is Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        weekdaysInMonth.push(new Date(currentDate));
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Create attendance records for each weekday
    const attendanceRecords = weekdaysInMonth
      .map((date) => {
        // Determine if this is a future date
        const isFutureDate = date > now;

        // For future dates, we don't create attendance
        if (isFutureDate) {
          return null;
        }

        // Random status with weighted probability
        const rand = Math.random();

        let status;
        let checkIn = null;
        let checkOut = null;
        let totalHours = 0;

        // Create different attendance scenarios
        // 60% normal attendance
        if (rand < 0.6) {
          status = "present";

          // Normal check-in between 8:00 and 8:25
          const checkInHour = 8;
          const checkInMinute = Math.floor(Math.random() * 25);

          // Normal check-out between 17:30 and 18:00
          const checkOutHour = 17;
          const checkOutMinute = 30 + Math.floor(Math.random() * 30);

          const checkInTime = new Date(date);
          checkInTime.setHours(checkInHour, checkInMinute, 0, 0);

          const checkOutTime = new Date(date);
          checkOutTime.setHours(checkOutHour, checkOutMinute, 0, 0);

          checkIn = { time: checkInTime };
          checkOut = { time: checkOutTime };
          totalHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
        }
        // 15% late check-in
        else if (rand < 0.75) {
          status = "late";

          // Late check-in between 8:35 and 9:30
          const checkInHour = 8 + Math.floor(Math.random() * 2);
          const checkInMinute =
            checkInHour === 8
              ? 35 + Math.floor(Math.random() * 25)
              : Math.floor(Math.random() * 30);

          // Normal check-out between 17:30 and 18:00
          const checkOutHour = 17;
          const checkOutMinute = 30 + Math.floor(Math.random() * 30);

          const checkInTime = new Date(date);
          checkInTime.setHours(checkInHour, checkInMinute, 0, 0);

          const checkOutTime = new Date(date);
          checkOutTime.setHours(checkOutHour, checkOutMinute, 0, 0);

          checkIn = { time: checkInTime };
          checkOut = { time: checkOutTime };
          totalHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
        }
        // 10% early check-out
        else if (rand < 0.85) {
          status = "half-day";

          // Normal check-in between 8:00 and 8:25
          const checkInHour = 8;
          const checkInMinute = Math.floor(Math.random() * 25);

          // Early check-out around 12:00-17:00
          const checkOutHour = 12 + Math.floor(Math.random() * 5);
          const checkOutMinute = Math.floor(Math.random() * 60);

          const checkInTime = new Date(date);
          checkInTime.setHours(checkInHour, checkInMinute, 0, 0);

          const checkOutTime = new Date(date);
          checkOutTime.setHours(checkOutHour, checkOutMinute, 0, 0);

          checkIn = { time: checkInTime };
          checkOut = { time: checkOutTime };
          totalHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
        }
        // 5% missing check-out
        else if (rand < 0.9) {
          status = "present";

          // Normal check-in between 8:00 and 8:25
          const checkInHour = 8;
          const checkInMinute = Math.floor(Math.random() * 25);

          const checkInTime = new Date(date);
          checkInTime.setHours(checkInHour, checkInMinute, 0, 0);

          checkIn = {
            time: checkInTime,
          };
          totalHours = 8; // Assume 8 hours
        }
        // 5% missing check-in
        else if (rand < 0.95) {
          status = "present";

          // Normal check-out between 17:30 and 18:00
          const checkOutHour = 17;
          const checkOutMinute = 30 + Math.floor(Math.random() * 30);

          const checkOutTime = new Date(date);
          checkOutTime.setHours(checkOutHour, checkOutMinute, 0, 0);

          checkOut = {
            time: checkOutTime,
          };
          totalHours = 8; // Assume 8 hours
        }
        // 5% absent
        else {
          status = "absent";
          totalHours = 0;
        }

        return {
          user: user._id,
          date: date,
          checkIn,
          checkOut,
          totalHours,
          status,
        };
      })
      .filter((record) => record !== null); // Remove null records (future dates)

    // Insert the attendance records
    await Attendance.create(attendanceRecords);

    console.log(
      `Created ${attendanceRecords.length} attendance records for ${user.email}`
    );
    process.exit(0);
  } catch (error) {
    console.error("Error seeding attendance data:", error);
    process.exit(1);
  }
};

// Run the seed function
seedAttendanceData();
