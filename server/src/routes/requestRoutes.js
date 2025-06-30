const express = require("express");
const { check } = require("express-validator");
const requestController = require("../controllers/requestController");
const { auth, authorize } = require("../middlewares/auth");

const router = express.Router();

// Get current user's leave days
router.get("/current-leave-days", auth, requestController.getCurrentLeaveDays);

// Calculate leave days for a date range
router.post(
  "/calculate-leave-days",
  auth,
  [
    check("startTime", "Start time is required").exists(),
    check("endTime", "End time is required").exists(),
  ],
  requestController.calculateLeaveDaysForRange
);

// Calculate leave days for a date range
router.post("/calculate-days", auth, requestController.calculateDays);

// Create request
router.post(
  "/",
  auth,
  [
    check("type", "Request type is required").isIn([
      "work-time",
      "leave-request",
      "wfh-request",
      "overtime",
    ]),
    check("startTime", "Start time is required").exists(),
    check("endTime", "End time is required").exists(),
    check("reason", "Reason is required").notEmpty(),
  ],
  requestController.createRequest
);

// Alternative create request endpoint to avoid conflicts
router.post(
  "/create",
  auth,
  [
    check("type", "Request type is required").isIn([
      "work-time",
      "leave-request",
      "wfh-request",
      "overtime",
    ]),
    check("startTime", "Start time is required").exists(),
    check("endTime", "End time is required").exists(),
    check("reason", "Reason is required").notEmpty(),
  ],
  requestController.createRequest
);

// Get current user's requests
router.get("/my", auth, requestController.getUserRequests);

// Get requests for managers based on their handleRequestType
router.get("/pending", auth, requestController.getRequestsForManager);

// Process request (approve/reject)
router.put(
  "/:requestId",
  auth,
  [
    check("action", "Action is required").isIn([
      "confirm",
      "approve",
      "reject",
    ]),
    check("comment").optional(),
  ],
  requestController.processRequest
);

// Cancel request (by user who created it)
router.put(
  "/cancel/:requestId",
  auth,
  [check("reason").optional()],
  requestController.cancelRequest
);

module.exports = router;
