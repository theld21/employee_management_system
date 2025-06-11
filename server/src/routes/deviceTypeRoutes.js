const express = require("express");
const router = express.Router();
const deviceTypeController = require("../controllers/deviceTypeController");
const { check } = require("express-validator");
const { auth } = require("../middlewares/auth");

// Validation middleware
const validateDeviceType = [
  check("name").notEmpty().withMessage("Name is required").trim(),
  check("code").notEmpty().withMessage("Code is required").trim().toUpperCase(),
];

// Get all device types
router.get("/", auth, deviceTypeController.getDeviceTypes);

// Create new device type
router.post(
  "/",
  auth,
  validateDeviceType,
  deviceTypeController.createDeviceType
);

// Update device type
router.put(
  "/:id",
  auth,
  validateDeviceType,
  deviceTypeController.updateDeviceType
);

// Delete device type
router.delete("/:id", auth, deviceTypeController.deleteDeviceType);

module.exports = router;
