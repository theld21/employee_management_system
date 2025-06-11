const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    typeCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
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

// Create compound unique index for code and typeCode
deviceSchema.index({ code: 1, typeCode: 1 }, { unique: true });

// Create indexes for better query performance
deviceSchema.index({ typeCode: 1 });
deviceSchema.index({ createdAt: -1 });

const Device = mongoose.model("Device", deviceSchema);

module.exports = Device;
