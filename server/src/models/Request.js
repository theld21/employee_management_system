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
    leaveDays: {
      type: Number,
      validate: {
        validator: function (v) {
          if (this.type === "leave-request") {
            return v >= 0.5 && v <= 30 && v % 0.5 === 0;
          }
          return true; // Skip validation for other request types
        },
        message: (props) => {
          if (props.value < 0.5)
            return "Số ngày nghỉ phải lớn hơn hoặc bằng 0.5";
          if (props.value > 30) return "Số ngày nghỉ không được vượt quá 30";
          return "Số ngày nghỉ phải là số nguyên hoặc số thập phân .5";
        },
      },
      default: 0,
      required: function () {
        return this.type === "leave-request";
      },
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
