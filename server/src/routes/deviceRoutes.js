const express = require("express");
const router = express.Router();
const deviceController = require("../controllers/deviceController");
const { auth, authorize } = require("../middlewares/auth");

// Routes
router.get("/all", auth, deviceController.getAllDevicesSimple);
router.get("/user/:userId", auth, deviceController.getDevicesByUser);
router.get("/", auth, deviceController.getAllDevices);
router.get(
  "/assigned",
  auth,
  authorize("admin"),
  deviceController.getAssignedDevices
);
router.get("/:id", auth, deviceController.getDeviceById);
router.get(
  "/:id/owner",
  auth,
  authorize("admin"),
  deviceController.getDeviceOwner
);
router.post("/", auth, authorize("admin"), deviceController.createDevice);
router.put("/:id", auth, authorize("admin"), deviceController.updateDevice);
router.delete("/:id", auth, authorize("admin"), deviceController.deleteDevice);

module.exports = router;
