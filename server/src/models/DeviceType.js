const mongoose = require("mongoose");

const deviceTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Device type name is required"],
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: [true, "Device type code is required"],
      trim: true,
      unique: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for faster queries
deviceTypeSchema.index({ name: 1, code: 1 });

const DeviceType = mongoose.model("DeviceType", deviceTypeSchema);

module.exports = DeviceType;
