const mongoose = require("mongoose");

const AttendanceRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attendance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attendance",
      required: true,
    },
    requestType: {
      type: String,
      enum: ["check-in", "check-out", "both"],
      required: true,
    },
    currentCheckIn: {
      type: Date,
    },
    currentCheckOut: {
      type: Date,
    },
    requestedCheckIn: {
      type: Date,
    },
    requestedCheckOut: {
      type: Date,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "approved-level2",
        "approved",
        "rejected-level2",
        "rejected-level1",
      ],
      default: "pending",
    },
    approvalLevel2: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      date: Date,
      comment: String,
    },
    approvalLevel1: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      date: Date,
      comment: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AttendanceRequest", AttendanceRequestSchema);
