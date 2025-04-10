const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    checkIn: {
      time: {
        type: Date,
        required: true,
      },
      note: {
        type: String,
        trim: true,
      },
    },
    checkOut: {
      time: {
        type: Date,
      },
      note: {
        type: String,
        trim: true,
      },
    },
    totalHours: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["present", "late", "absent", "half-day"],
      default: "present",
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index for user and date to ensure uniqueness
AttendanceSchema.index({ user: 1, date: 1 }, { unique: true });

// Calculate total hours when checking out
AttendanceSchema.pre("save", function (next) {
  if (
    this.checkIn &&
    this.checkIn.time &&
    this.checkOut &&
    this.checkOut.time
  ) {
    const checkInTime = new Date(this.checkIn.time).getTime();
    const checkOutTime = new Date(this.checkOut.time).getTime();
    this.totalHours = (checkOutTime - checkInTime) / (1000 * 60 * 60); // Convert milliseconds to hours
  }
  next();
});

module.exports = mongoose.model("Attendance", AttendanceSchema);
