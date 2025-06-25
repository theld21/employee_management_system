const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["work-time", "leave-request", "wfh-request", "overtime"],
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: Number,
      enum: [1, 2, 3, 4, 5], // 1: pending, 2: confirmed, 3: approved, 4: rejected, 5: cancelled
      default: 1,
    },
    confirmedBy: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      date: Date,
      comment: String,
    },
    approvedBy: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      date: Date,
      comment: String,
    },
    rejectedBy: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      date: Date,
      comment: String,
    },
    cancelledBy: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      date: Date,
      reason: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Request", RequestSchema);
