const mongoose = require("mongoose");

const contractSchema = new mongoose.Schema(
  {
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["ASSIGNMENT", "RECOVERY"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "COMPLETED", "REJECTED"],
      default: "PENDING",
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
contractSchema.index({ device: 1 });
contractSchema.index({ user: 1 });
contractSchema.index({ createdAt: -1 });

const Contract = mongoose.model("Contract", contractSchema);

module.exports = Contract;
