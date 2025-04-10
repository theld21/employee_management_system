const express = require("express");
const { check } = require("express-validator");
const attendanceRequestController = require("../controllers/attendanceRequestController");
const { auth, authorize } = require("../middlewares/auth");

const router = express.Router();

// Create attendance request
router.post(
  "/",
  auth,
  [
    check("attendanceId", "Attendance record ID is required").isMongoId(),
    check("requestType", "Request type is required").isIn([
      "check-in",
      "check-out",
      "both",
    ]),
    check("requestedCheckIn", "Requested check-in time must be a valid date")
      .optional()
      .isISO8601(),
    check("requestedCheckOut", "Requested check-out time must be a valid date")
      .optional()
      .isISO8601(),
    check("reason", "Reason is required").notEmpty(),
  ],
  attendanceRequestController.createRequest
);

// Get current user's requests
router.get("/my", auth, attendanceRequestController.getUserRequests);

// Get pending requests (for managers)
router.get(
  "/pending",
  auth,
  authorize("admin", "level1", "level2"),
  attendanceRequestController.getPendingRequests
);

// Process request at level2
router.put(
  "/level2/:requestId",
  auth,
  authorize("level2"),
  [
    check("action", "Action is required").isIn(["approve", "reject"]),
    check("comment").optional(),
  ],
  attendanceRequestController.processLevel2Request
);

// Process request at level1
router.put(
  "/level1/:requestId",
  auth,
  authorize("admin", "level1"),
  [
    check("action", "Action is required").isIn(["approve", "reject"]),
    check("comment").optional(),
  ],
  attendanceRequestController.processLevel1Request
);

module.exports = router;
