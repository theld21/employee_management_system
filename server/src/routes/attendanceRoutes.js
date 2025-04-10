const express = require("express");
const { check } = require("express-validator");
const attendanceController = require("../controllers/attendanceController");
const { auth, authorize } = require("../middlewares/auth");

const router = express.Router();

// Check in
router.post(
  "/check-in",
  auth,
  [check("note").optional()],
  attendanceController.checkIn
);

// Check out
router.post(
  "/check-out",
  auth,
  [check("note").optional()],
  attendanceController.checkOut
);

// Get current user's attendance
router.get("/my", auth, attendanceController.getUserAttendance);

// Get today's attendance for current user
router.get("/today", auth, attendanceController.getTodayAttendance);

// Get team attendance (for managers)
router.get(
  "/team",
  auth,
  authorize("admin", "level1", "level2"),
  attendanceController.getTeamAttendance
);

module.exports = router;
