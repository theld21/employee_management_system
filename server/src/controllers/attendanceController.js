const { validationResult } = require("express-validator");
const Attendance = require("../models/Attendance");

/**
 * Hàm hỗ trợ để lấy ngày bắt đầu và kết thúc của một ngày
 * @param {Date} date - Ngày cần xử lý
 * @returns {Object} - Đối tượng chứa startOfDay và endOfDay
 */
const getDayBoundaries = (date = new Date()) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
};

// Check in
exports.checkIn = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const now = new Date();
    const { startOfDay, endOfDay } = getDayBoundaries(now);

    // Check if user already checked in today
    let attendance = await Attendance.findOne({
      user: userId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    if (attendance && attendance.checkIn.time) {
      return res
        .status(400)
        .json({ message: "You have already checked in today" });
    }

    // Create new attendance record or update existing
    if (!attendance) {
      attendance = new Attendance({
        user: userId,
        date: startOfDay, // Sử dụng ngày đầu để đảm bảo nhất quán
        checkIn: {
          time: now,
        },
      });
    } else {
      attendance.checkIn = {
        time: now,
      };
    }

    await attendance.save();

    res.status(201).json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Check out
exports.checkOut = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const now = new Date();
    const { startOfDay, endOfDay } = getDayBoundaries(now);

    // Check if user has checked in today
    const attendance = await Attendance.findOne({
      user: userId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    if (!attendance || !attendance.checkIn.time) {
      return res.status(400).json({ message: "You need to check in first" });
    }

    if (attendance.checkOut && attendance.checkOut.time) {
      return res
        .status(400)
        .json({ message: "You have already checked out today" });
    }

    // Update checkout time
    attendance.checkOut = {
      time: now,
    };

    await attendance.save();

    res.json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get attendance for current user
exports.getUserAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;

    let query = { user: userId };

    if (startDate && endDate) {
      const { startOfDay: start } = getDayBoundaries(new Date(startDate));
      const { endOfDay: end } = getDayBoundaries(new Date(endDate));

      query.date = {
        $gte: start,
        $lte: end,
      };

      console.log(
        `Query attendance between: ${start.toISOString()} and ${end.toISOString()}`
      );
    }

    const attendance = await Attendance.find(query).sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get today's attendance for current user
exports.getTodayAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startOfDay, endOfDay } = getDayBoundaries();

    console.log(
      `Looking for attendance between: ${startOfDay.toISOString()} and ${endOfDay.toISOString()}`
    );

    const attendance = await Attendance.findOne({
      user: userId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    res.json(attendance || { message: "No attendance record for today" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get attendance report for team (for managers)
exports.getTeamAttendance = async (req, res) => {
  try {
    const { startDate, endDate, groupId } = req.query;

    // Verify the user is a manager
    if (!["admin", "manager"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Not authorized to access team attendance" });
    }

    let query = {};

    if (startDate && endDate) {
      const { startOfDay: start } = getDayBoundaries(new Date(startDate));
      const { endOfDay: end } = getDayBoundaries(new Date(endDate));

      query.date = {
        $gte: start,
        $lte: end,
      };
    }

    // If group ID is provided, get attendance for that group's members
    if (groupId) {
      const Group = require("../models/Group");
      const group = await Group.findById(groupId);

      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }

      query.user = { $in: group.members };
    }

    const attendance = await Attendance.find(query)
      .populate("user", "firstName lastName username email")
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper function to get status color
const getStatusColor = (status) => {
  switch (status) {
    case "present":
      return "#4CAF50"; // Green
    case "late":
      return "#FFC107"; // Yellow
    case "absent":
      return "#F44336"; // Red
    case "half-day":
      return "#FF9800"; // Orange
    default:
      return "#9E9E9E"; // Grey
  }
};

module.exports = {
  checkIn: exports.checkIn,
  checkOut: exports.checkOut,
  getUserAttendance: exports.getUserAttendance,
  getTodayAttendance: exports.getTodayAttendance,
  getTeamAttendance: exports.getTeamAttendance,
};
