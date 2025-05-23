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
      },
    },
    checkOut: {
      time: {
        type: Date,
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

// Calculate total hours and status when saving
AttendanceSchema.pre("save", function (next) {
  // Calculate total hours if both check-in and check-out exist
  if (this.checkIn?.time && this.checkOut?.time) {
    const checkInTime = new Date(this.checkIn.time).getTime();
    const checkOutTime = new Date(this.checkOut.time).getTime();
    this.totalHours = (checkOutTime - checkInTime) / (1000 * 60 * 60); // Convert milliseconds to hours
  }

  // Update status based on check-in time, check-out time and total hours
  if (!this.checkIn?.time && !this.checkOut?.time) {
    this.status = "absent";
  } else if (this.checkIn?.time) {
    const checkInDate = new Date(this.checkIn.time);
    const checkInLimit = new Date(checkInDate);
    checkInLimit.setHours(8, 30, 0, 0);

    if (checkInDate > checkInLimit) {
      this.status = "late";
    } else if (this.totalHours && this.totalHours < 4) {
      this.status = "half-day";
    } else {
      this.status = "present";
    }
  }

  next();
});

module.exports = mongoose.model("Attendance", AttendanceSchema);
