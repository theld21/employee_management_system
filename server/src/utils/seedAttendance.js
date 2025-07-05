const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
require("dotenv").config();

// Constants from workDays.ts
const WORK_START_HOUR = 8;
const WORK_START_MINUTE = 30;
const WORK_END_HOUR = 17;
const WORK_END_MINUTE = 30;
const LUNCH_START_HOUR = 12;
const LUNCH_START_MINUTE = 0;
const LUNCH_END_HOUR = 13;
const LUNCH_END_MINUTE = 0;
const WORK_HOURS_REQUIRED = 8;

// Connect to database
async function connectDB() {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/fullstack-app";
    await mongoose.connect(mongoURI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

// Function to check if a date is a workday (Monday-Friday)
function isWorkDay(date) {
  const day = date.getDay();
  // 0 is Sunday, 6 is Saturday
  return day >= 1 && day <= 5;
}

// Generate random time between min and max
function randomTime(minHour, minMinute, maxHour, maxMinute) {
  const minTotal = minHour * 60 + minMinute;
  const maxTotal = maxHour * 60 + maxMinute;
  const randomTotal =
    Math.floor(Math.random() * (maxTotal - minTotal + 1)) + minTotal;

  const hour = Math.floor(randomTotal / 60);
  const minute = randomTotal % 60;

  return { hour, minute };
}

function createVietnamDate(year, month, day, hour = 0, minute = 0) {
  // Tạo đối tượng Date ở UTC
  const date = new Date(Date.UTC(year, month, day, hour, minute));
  // Cộng thêm 7 tiếng để thành giờ Việt Nam
  date.setUTCHours(date.getUTCHours() - 7);
  return date;
}

// Seed attendance data for all non-admin users
async function seedAttendanceData() {
  try {
    await connectDB();

    // Find all users that are not admins
    const users = await User.find({ role: { $ne: "admin" } });

    if (users.length === 0) {
      console.error("No non-admin users found in the database");
      process.exit(1);
    }

    console.log(`Found ${users.length} non-admin users`);

    // Set start date to March 1, 2025
    const startDate = new Date(2025, 0, 1); // Month is 0-indexed (2 = March)
    const today = new Date(); // Current date

    // Delete existing attendance records in this period
    const deleteResult = await Attendance.deleteMany({
      checkIn: { $gte: startDate, $lte: today },
    });
    console.log(
      `Deleted ${deleteResult.deletedCount} existing attendance records`
    );

    let totalRecords = 0;

    // Process each user
    for (const user of users) {
      console.log(`Processing user: ${user.email} (${user._id})`);

      // Generate attendance records for each day from start date to today
      let currentDate = new Date(startDate);

      while (currentDate <= today) {
        // Skip weekends
        if (isWorkDay(currentDate)) {
          // Determine attendance scenario with weighted probability
          const scenario = Math.random();

          // 80% normal attendance
          if (scenario < 0.95) {
            // Normal check-in (8:00-8:40)
            const { hour: inHour, minute: inMinute } = randomTime(8, 0, 8, 30);

            const checkInTime = createVietnamDate(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              currentDate.getDate(),
              inHour,
              inMinute
            );

            // Normal check-out (17:30-18:30)
            const { hour: outHour, minute: outMinute } = randomTime(
              17,
              30,
              18,
              30
            );

            const checkOutTime = createVietnamDate(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              currentDate.getDate(),
              outHour,
              outMinute
            );

            await Attendance.create({
              user: user._id,
              checkIn: checkInTime,
              checkOut: checkOutTime,
            });

            totalRecords++;
          }
          // 5% late check-in
          else if (scenario < 0.85) {
            // Late check-in (9:00-10:30)
            const { hour: inHour, minute: inMinute } = randomTime(8, 40, 9, 30);

            const checkInTime = createVietnamDate(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              currentDate.getDate(),
              inHour,
              inMinute
            );

            // Normal check-out (17:30-18:30)
            const { hour: outHour, minute: outMinute } = randomTime(
              17,
              30,
              18,
              30
            );

            const checkOutTime = createVietnamDate(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              currentDate.getDate(),
              outHour,
              outMinute
            );

            await Attendance.create({
              user: user._id,
              checkIn: checkInTime,
              checkOut: checkOutTime,
            });

            totalRecords++;
          }
          // 5% early check-out
          else if (scenario < 0.9) {
            // Normal check-in (8:00-8:40)
            const { hour: inHour, minute: inMinute } = randomTime(8, 0, 8, 40);

            const checkInTime = createVietnamDate(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              currentDate.getDate(),
              inHour,
              inMinute
            );

            // Early check-out (15:00-17:00)
            const { hour: outHour, minute: outMinute } = randomTime(
              15,
              0,
              17,
              0
            );

            const checkOutTime = createVietnamDate(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              currentDate.getDate(),
              outHour,
              outMinute
            );

            await Attendance.create({
              user: user._id,
              checkIn: checkInTime,
              checkOut: checkOutTime,
            });

            totalRecords++;
          }
          // 5% missing check-out
          else if (scenario < 0.95) {
            // Normal check-in (8:00-8:40)
            const { hour: inHour, minute: inMinute } = randomTime(8, 0, 8, 40);

            const checkInTime = createVietnamDate(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              currentDate.getDate(),
              inHour,
              inMinute
            );

            await Attendance.create({
              user: user._id,
              checkIn: checkInTime,
              // No checkOut
            });

            totalRecords++;
          }
          // 5% absent (no record)
          // Do nothing for absent days
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    console.log(
      `Created ${totalRecords} attendance records for ${users.length} users`
    );

    mongoose.connection.close();
    console.log("Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding attendance data:", error);
    process.exit(1);
  }
}

// Run the seed function
seedAttendanceData();
