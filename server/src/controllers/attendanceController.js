const { validationResult } = require("express-validator");
const Attendance = require("../models/Attendance");
const Request = require("../models/Request");

/**
 * Hàm hỗ trợ để lấy ngày bắt đầu và kết thúc của một ngày từ checkIn time
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

    // Check if user already checked in today using checkIn field
    const attendance = await Attendance.findOne({
      user: userId,
      checkIn: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    if (attendance) {
      return res.status(400).json({ message: "Bạn đã điểm danh hôm nay" });
    }

    // Create new attendance record
    const newAttendance = new Attendance({
      user: userId,
      checkIn: now,
    });

    await newAttendance.save();
    res.status(201).json(newAttendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi máy chủ" });
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

    // Find today's attendance record using checkIn field
    const attendance = await Attendance.findOne({
      user: userId,
      checkIn: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    if (!attendance) {
      return res.status(400).json({ message: "Bạn cần điểm danh trước" });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: "Bạn đã kết thúc hôm nay" });
    }

    // Update checkout time
    attendance.checkOut = now;
    await attendance.save();
    res.json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

// Get attendance for current user
exports.getUserAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;

    let attendanceQuery = { user: userId };
    let requestQuery = {
      user: userId,
      type: "leave-request",
      status: 3,
    };

    if (startDate && endDate) {
      const { startOfDay: start } = getDayBoundaries(new Date(startDate));
      const { endOfDay: end } = getDayBoundaries(new Date(endDate));

      // Query using checkIn field instead of date
      attendanceQuery.checkIn = {
        $gte: start,
        $lte: end,
      };

      // For requests, check if startTime or endTime falls within the date range
      requestQuery.$or = [
        {
          startTime: {
            $gte: start,
            $lte: end,
          },
        },
        {
          endTime: {
            $gte: start,
            $lte: end,
          },
        },
        {
          $and: [{ startTime: { $lte: start } }, { endTime: { $gte: end } }],
        },
      ];
    }

    const [attendance, requests] = await Promise.all([
      Attendance.find(attendanceQuery).sort({ checkIn: -1 }),
      Request.find(requestQuery)
        .populate("user", "name email")
        .sort({ startTime: -1 }),
    ]);

    res.json({
      attendance,
      requests,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// Get today's attendance for current user
exports.getTodayAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startOfDay, endOfDay } = getDayBoundaries();

    // Query using checkIn field instead of date
    const attendance = await Attendance.findOne({
      user: userId,
      checkIn: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    res.json(attendance || { message: "Không có lịch chấm công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi máy chủ" });
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
        .json({ message: "Không có quyền truy cập lịch chấm công" });
    }

    let query = {};

    if (startDate && endDate) {
      const { startOfDay: start } = getDayBoundaries(new Date(startDate));
      const { endOfDay: end } = getDayBoundaries(new Date(endDate));

      // Query using checkIn field instead of date
      query.checkIn = {
        $gte: start,
        $lte: end,
      };
    }

    // If group ID is provided, get attendance for that group's members
    if (groupId) {
      const Group = require("../models/Group");
      const group = await Group.findById(groupId);

      if (!group) {
        return res.status(404).json({ message: "Nhóm không tồn tại" });
      }

      query.user = { $in: group.members };
    }

    const attendance = await Attendance.find(query)
      .populate("user", "firstName lastName username email")
      .sort({ checkIn: -1 });

    res.json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

exports.getAttendanceReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        message: "Tháng và năm là bắt buộc",
      });
    }

    // Tạo khoảng thời gian cho tháng
    const startDate = new Date(year, month - 1, 1); // month is 0-indexed
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month

    // Lấy danh sách tất cả user
    const User = require("../models/User");
    const users = await User.find({ role: { $ne: "admin" } })
      .select("name email employeeId")
      .sort({ name: 1 });

    // Lấy tất cả attendance trong tháng sử dụng checkIn
    const attendances = await Attendance.find({
      checkIn: { $gte: startDate, $lte: endDate },
    }).populate("user", "name email employeeId");

    // Lấy tất cả leave requests đã approved trong tháng
    const requests = await Request.find({
      type: "leave-request",
      status: 3, // approved
      $or: [
        {
          startTime: { $gte: startDate, $lte: endDate },
        },
        {
          endTime: { $gte: startDate, $lte: endDate },
        },
        {
          $and: [
            { startTime: { $lte: startDate } },
            { endTime: { $gte: endDate } },
          ],
        },
      ],
    }).populate("user", "name email employeeId");

    // Tạo map attendance theo user và ngày (sử dụng checkIn)
    const attendanceMap = new Map();
    attendances.forEach((att) => {
      const userId = att.user._id.toString();
      // Lấy ngày từ checkIn time
      const dateKey = att.checkIn.toISOString().split("T")[0];
      if (!attendanceMap.has(userId)) {
        attendanceMap.set(userId, new Map());
      }
      attendanceMap.get(userId).set(dateKey, att);
    });

    // Tạo map leave requests theo user và ngày
    const leaveMap = new Map();
    requests.forEach((req) => {
      const userId = req.user._id.toString();
      const startDate = new Date(req.startTime);
      const endDate = new Date(req.endTime);

      if (!leaveMap.has(userId)) {
        leaveMap.set(userId, new Map());
      }

      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const dateKey = d.toISOString().split("T")[0];
        if (
          d >= new Date(year, month - 1, 1) &&
          d <= new Date(year, month, 0)
        ) {
          // Tính leave type cho ngày này
          const leaveStart = new Date(
            Math.max(d.getTime(), startDate.getTime())
          );
          const leaveEnd = new Date(
            Math.min(new Date(d).setHours(23, 59, 59, 999), endDate.getTime())
          );
          const noonStart = new Date(d);
          noonStart.setHours(12, 0, 0, 0);
          const noonEnd = new Date(d);
          noonEnd.setHours(13, 0, 0, 0);
          const isFullDay = leaveStart < noonEnd && leaveEnd > noonStart;

          const currentLeave = leaveMap.get(userId).get(dateKey);
          if (!currentLeave || currentLeave < (isFullDay ? 1 : 0.5)) {
            leaveMap.get(userId).set(dateKey, isFullDay ? 1 : 0.5);
          }
        }
      }
    });

    // Tính toán dữ liệu cho từng user
    const reportData = users.map((user) => {
      const userId = user._id.toString();
      const userAttendances = attendanceMap.get(userId) || new Map();
      const userLeaves = leaveMap.get(userId) || new Map();

      const dailyData = [];
      let totalDays = 0;

      // Lặp qua từng ngày trong tháng
      for (
        let d = new Date(year, month - 1, 1);
        d <= new Date(year, month, 0);
        d.setDate(d.getDate() + 1)
      ) {
        const dateKey = d.toISOString().split("T")[0];
        const isWorkDay = d.getDay() >= 1 && d.getDay() <= 5; // Mon-Fri

        if (!isWorkDay) {
          dailyData.push({
            date: dateKey,
            day: d.getDate(),
            work: 0,
            leave: 0,
            note: "Cuối tuần",
          });
          continue;
        }

        const attendance = userAttendances.get(dateKey);
        const leaveValue = userLeaves.get(dateKey) || 0;

        let workDays = 0;
        let note = "";

        if (leaveValue > 0) {
          workDays = leaveValue; // Leave counts as work days
          note = leaveValue === 1 ? "Nghỉ 1P" : "Nghỉ 1/2P";
          totalDays += leaveValue;
        } else if (attendance && attendance.checkIn && attendance.checkOut) {
          workDays = 1;
          note = "Đi làm";
          totalDays += 1;
        } else if (attendance && attendance.checkIn) {
          workDays = 0.5;
          note = "Thiếu checkout";
          totalDays += 0.5;
        } else {
          workDays = 0;
          note = "Vắng";
        }

        dailyData.push({
          date: dateKey,
          day: d.getDate(),
          work: workDays,
          leave: leaveValue,
          note: note,
        });
      }

      return {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          employeeId: user.employeeId,
        },
        dailyData,
        totalDays,
      };
    });

    res.json({
      month: parseInt(month),
      year: parseInt(year),
      startDate,
      endDate,
      data: reportData,
    });
  } catch (error) {
    console.error("Error getting attendance report:", error);
    res.status(500).json({
      message: "Lỗi máy chủ",
      error: error.message,
    });
  }
};

module.exports = {
  checkIn: exports.checkIn,
  checkOut: exports.checkOut,
  getUserAttendance: exports.getUserAttendance,
  getTodayAttendance: exports.getTodayAttendance,
  getTeamAttendance: exports.getTeamAttendance,
  getAttendanceReport: exports.getAttendanceReport,
};
