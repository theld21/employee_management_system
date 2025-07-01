const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index for user and checkIn date (day level) to ensure uniqueness per day
attendanceSchema.index(
  {
    user: 1,
    checkIn: 1,
  },
  {
    unique: true,
    partialFilterExpression: { checkIn: { $exists: true } },
  }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
