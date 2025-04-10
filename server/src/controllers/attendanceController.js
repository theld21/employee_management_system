const { validationResult } = require("express-validator");
const moment = require("moment");
const Attendance = require("../models/Attendance");

// Check in
exports.checkIn = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { note } = req.body;
    const userId = req.user.id;
    const now = new Date();
    const today = moment(now).startOf("day").toDate();

    // Check if user already checked in today
    let attendance = await Attendance.findOne({
      user: userId,
      date: {
        $gte: today,
        $lt: moment(today).add(1, "days").toDate(),
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
        date: today,
        checkIn: {
          time: now,
          note: note || "",
        },
      });
    } else {
      attendance.checkIn = {
        time: now,
        note: note || "",
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

    const { note } = req.body;
    const userId = req.user.id;
    const now = new Date();
    const today = moment(now).startOf("day").toDate();

    // Check if user has checked in today
    const attendance = await Attendance.findOne({
      user: userId,
      date: {
        $gte: today,
        $lt: moment(today).add(1, "days").toDate(),
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
      note: note || "",
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
      query.date = {
        $gte: moment(startDate).startOf("day").toDate(),
        $lte: moment(endDate).endOf("day").toDate(),
      };
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
    const today = moment().startOf("day").toDate();

    const attendance = await Attendance.findOne({
      user: userId,
      date: {
        $gte: today,
        $lt: moment(today).add(1, "days").toDate(),
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
    if (!["admin", "level1", "level2"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Not authorized to access team attendance" });
    }

    let query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: moment(startDate).startOf("day").toDate(),
        $lte: moment(endDate).endOf("day").toDate(),
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
