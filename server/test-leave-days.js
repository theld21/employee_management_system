const { addMonthlyLeaveDays } = require("./src/utils/cronJobs");
const mongoose = require("mongoose");
require("dotenv").config();

// Kết nối database và chạy hàm cộng ngày phép
async function testAddLeaveDays() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    await addMonthlyLeaveDays();
    console.log("Successfully added leave days");

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

testAddLeaveDays();
