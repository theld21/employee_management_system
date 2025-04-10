const { validationResult } = require("express-validator");
const AttendanceRequest = require("../models/AttendanceRequest");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const Group = require("../models/Group");

// Create attendance request
exports.createRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      attendanceId,
      requestType,
      requestedCheckIn,
      requestedCheckOut,
      reason,
    } = req.body;
    const userId = req.user.id;

    // Check if attendance record exists
    const attendance = await Attendance.findOne({
      _id: attendanceId,
      user: userId,
    });

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    // Create attendance request
    const request = new AttendanceRequest({
      user: userId,
      attendance: attendanceId,
      requestType,
      currentCheckIn: attendance.checkIn?.time,
      currentCheckOut: attendance.checkOut?.time,
      requestedCheckIn:
        requestType === "check-in" || requestType === "both"
          ? requestedCheckIn
          : undefined,
      requestedCheckOut:
        requestType === "check-out" || requestType === "both"
          ? requestedCheckOut
          : undefined,
      reason,
      status: "pending",
    });

    await request.save();

    res.status(201).json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all requests for current user
exports.getUserRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const query = { user: userId };
    if (status) {
      query.status = status;
    }

    const requests = await AttendanceRequest.find(query)
      .populate("attendance")
      .populate("approvalLevel2.user", "firstName lastName")
      .populate("approvalLevel1.user", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get pending requests that need approval (for managers)
exports.getPendingRequests = async (req, res) => {
  try {
    const { role, id } = req.user;

    // For level1 managers, get all requests that have been approved by level2
    if (role === "admin" || role === "level1") {
      const requests = await AttendanceRequest.find({
        status: "approved-level2",
      })
        .populate("user", "firstName lastName username email group")
        .populate("attendance")
        .sort({ createdAt: -1 });

      return res.json(requests);
    }

    // For level2 managers, get pending requests from their group members
    if (role === "level2") {
      // Find the manager's group
      const managerGroup = await Group.findOne({ manager: id });

      if (!managerGroup) {
        return res
          .status(404)
          .json({ message: "Group not found for this manager" });
      }

      // Get users from this group
      const userIds = managerGroup.members;

      const requests = await AttendanceRequest.find({
        user: { $in: userIds },
        status: "pending",
      })
        .populate("user", "firstName lastName username email")
        .populate("attendance")
        .sort({ createdAt: -1 });

      return res.json(requests);
    }

    return res
      .status(403)
      .json({ message: "Not authorized to access pending requests" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Approve/reject request at level2
exports.processLevel2Request = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { requestId } = req.params;
    const { action, comment } = req.body;
    const managerId = req.user.id;

    // Verify the user is a level2 manager
    if (req.user.role !== "level2") {
      return res
        .status(403)
        .json({ message: "Not authorized to process this request" });
    }

    // Find the request
    const request = await AttendanceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Verify request is pending
    if (request.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Request has already been processed" });
    }

    // Verify user is in the manager's group
    const requestUser = await User.findById(request.user);
    const managerGroup = await Group.findOne({ manager: managerId });

    if (!managerGroup || !managerGroup.members.includes(requestUser._id)) {
      return res
        .status(403)
        .json({ message: "Not authorized to process this user's request" });
    }

    // Update request status
    request.status =
      action === "approve" ? "approved-level2" : "rejected-level2";
    request.approvalLevel2 = {
      user: managerId,
      date: new Date(),
      comment: comment || "",
    };

    await request.save();

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Approve/reject request at level1
exports.processLevel1Request = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { requestId } = req.params;
    const { action, comment } = req.body;
    const managerId = req.user.id;

    // Verify the user is a level1 manager or admin
    if (!["admin", "level1"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Not authorized to process this request" });
    }

    // Find the request
    const request = await AttendanceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Verify request has been approved by level2
    if (request.status !== "approved-level2") {
      return res
        .status(400)
        .json({ message: "Request must be approved by level2 manager first" });
    }

    // Update request status
    request.status = action === "approve" ? "approved" : "rejected-level1";
    request.approvalLevel1 = {
      user: managerId,
      date: new Date(),
      comment: comment || "",
    };

    await request.save();

    // If approved, update the attendance record
    if (action === "approve") {
      const attendance = await Attendance.findById(request.attendance);

      if (
        request.requestType === "check-in" ||
        request.requestType === "both"
      ) {
        attendance.checkIn.time = request.requestedCheckIn;
      }

      if (
        request.requestType === "check-out" ||
        request.requestType === "both"
      ) {
        attendance.checkOut.time = request.requestedCheckOut;
      }

      await attendance.save();
    }

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
