const express = require("express");
const { check } = require("express-validator");
const requestController = require("../controllers/requestController");
const { auth, authorize } = require("../middlewares/auth");

const router = express.Router();

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

// Get pending requests (for managers)
router.get(
  "/pending",
  auth,
  authorize("admin", "manager", "level1", "level2"),
  requestController.getPendingRequests
);

// Process request (approve/reject)
router.put(
  "/:requestId",
  auth,
  authorize("admin", "manager", "level1", "level2"),
  [
    check("action", "Action is required").isIn(["approve", "reject"]),
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
