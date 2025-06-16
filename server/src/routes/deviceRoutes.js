const express = require("express");
const router = express.Router();
const deviceController = require("../controllers/deviceController");
const { auth, authorize } = require("../middlewares/auth");

// Routes
router.get("/all", auth, deviceController.getAllDevicesSimple);
router.get("/user/:userId", auth, deviceController.getDevicesByUser);
router.get("/", auth, deviceController.getAllDevices);
router.get("/:id", auth, deviceController.getDeviceById);
router.post("/", auth, authorize("admin"), deviceController.createDevice);
router.put("/:id", auth, authorize("admin"), deviceController.updateDevice);
router.delete("/:id", auth, authorize("admin"), deviceController.deleteDevice);

module.exports = router;
