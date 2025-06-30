const cron = require("node-cron");
const User = require("../models/User");

// Function to add one leave day to all active users
const addMonthlyLeaveDays = async () => {
  try {
    console.log("[CRON] Starting monthly leave days update...");

    // Find all active users and increment their leave days by 1
    const result = await User.updateMany(
      { status: "active" },
      { $inc: { leaveDays: 1 } }
    );

    console.log(
      `[CRON] Successfully updated leave days for ${result.modifiedCount} users`
    );
  } catch (error) {
    console.error("[CRON] Error updating monthly leave days:", error);
  }
};

// Schedule the cron job to run at midnight (00:00) on the first day of every month
const scheduleLeaveDaysCron = () => {
  // '0 0 1 * *' = At 00:00 on day-of-month 1
  cron.schedule("0 0 1 * *", async () => {
    console.log("[CRON] Running monthly leave days update job");
    await addMonthlyLeaveDays();
  });

  console.log("[CRON] Monthly leave days update job scheduled");
};

module.exports = {
  scheduleLeaveDaysCron,
  addMonthlyLeaveDays, // Export for testing purposes
};
