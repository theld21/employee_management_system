"use client";
import { useState, useRef, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { EventContentArg, EventSourceFuncArg } from '@fullcalendar/core';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';
import { 
  isWorkDay, 
  getCheckInColor, 
  getCheckOutColor,
  WORK_START_HOUR,
  WORK_START_MINUTE,
  WORK_END_HOUR,
  WORK_END_MINUTE,
  LUNCH_START_HOUR,
  LUNCH_START_MINUTE,
  LUNCH_END_HOUR,
  LUNCH_END_MINUTE,
  WORK_HOURS_REQUIRED
} from '@/constants/workDays';

interface Attendance {
  _id: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
}

interface TodayAttendance {
  _id: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
}

interface CalendarAttendanceData {
  id: string;
  date: string;
  color: string;
  title?: string;
  extendedProps: {
    time?: string;
  };
}

const formatTimeFromHourMinute = (hour: number, minute: number): string => {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const AttendanceCalendar = () => {
  const { token } = useAuth();
  const calendarRef = useRef<FullCalendar | null>(null);
  
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkOutLoading, setCheckOutLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  
  const formatTime = useCallback((timeString?: string): string => {
    if (!timeString) return 'N/A';
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);
  
  const formatDate = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const handleEventsFetch = useCallback(async (
    info: EventSourceFuncArg,
    successCallback: (events: CalendarAttendanceData[]) => void,
    failureCallback: (error: Error) => void
  ) => {
    try {
      if (!token) {
        failureCallback(new Error('No authorization token'));
        return;
      }
      
      const params = new URLSearchParams({
        startDate: info.startStr,
        endDate: info.endStr,
      });
      
      const response = await api.get(`/attendance/my?${params}`);
      
      if (!response.data) {
        failureCallback(new Error('Failed to fetch attendance data'));
        return;
      }

      const attendanceData: CalendarAttendanceData[] = [];
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const today = formatDate(todayDate);

      // Create a map for quick lookup
      const attendanceMap = new Map<string, Attendance>();
      response.data.forEach((attendance: Attendance) => {
        const date = new Date(attendance.date);
        attendanceMap.set(formatDate(date), attendance);
      });

      // Generate events
      for (let d = new Date(info.startStr); d <= new Date(info.endStr); d.setDate(d.getDate() + 1)) {
        const formattedDate = formatDate(d);
        if (!isWorkDay(d) || d > todayDate) continue;

        const attendance = attendanceMap.get(formattedDate);
        if (attendance) {
        const isToday = formattedDate === today;
        attendanceData.push({
          id: attendance._id + "_in",
          date: formattedDate,
            color: getCheckInColor(attendance.checkIn),
            extendedProps: { time: attendance.checkIn }
        });
        
          if (attendance.checkOut || !isToday) {
          attendanceData.push({
            id: attendance._id + "_out",
            date: formattedDate,
              color: getCheckOutColor(attendance.checkIn, attendance.checkOut),
              extendedProps: { time: attendance.checkOut }
          });
        }
        } else {
          attendanceData.push(
            {
              id: formattedDate + '_in',
              date: formattedDate,
              color: '#F44336',
              extendedProps: { time: undefined }
            },
            {
              id: formattedDate + '_out',
              date: formattedDate,
              color: '#F44336',
              extendedProps: { time: undefined }
            }
          );
        }
      }
      
      successCallback(attendanceData);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      failureCallback(error instanceof Error ? error : new Error(String(error)));
    }
  }, [token, formatDate]);
  
  const renderEventContent = useCallback((eventInfo: EventContentArg) => {
    const { extendedProps } = eventInfo.event;
    const time = extendedProps.time ? formatTime(extendedProps.time) : 'K';
    return <span className="text-xs p-1">{time}</span>;
  }, [formatTime]);

  const fetchTodayAttendance = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await api.get("/attendance/today");
      setTodayAttendance(response.data);
    } catch (err) {
      setError("Error connecting to the server");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTodayAttendance();
  }, [fetchTodayAttendance]);

  const handleCheckIn = async () => {
    setCheckInLoading(true);
    setActionError(null);
    try {
      const response = await api.post("/attendance/check-in");
      setTodayAttendance(response.data);
      if (calendarRef.current) {
        calendarRef.current.getApi().refetchEvents();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setActionError(error.response?.data?.message || "Failed to check in");
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckOutLoading(true);
    setActionError(null);
    try {
      const response = await api.post("/attendance/check-out");
      setTodayAttendance(response.data);
      if (calendarRef.current) {
        calendarRef.current.getApi().refetchEvents();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setActionError(error.response?.data?.message || "Failed to check out");
    } finally {
      setCheckOutLoading(false);
    }
  };

  const hasCheckedIn = todayAttendance && todayAttendance.checkIn;
  const hasCheckedOut = todayAttendance && todayAttendance.checkOut;

  return (
    <div className="space-y-6">      
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-gray-800 dark:bg-gray-900/50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Lịch chấm công</h3>
          
          {loading ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          ) : error ? (
            <div className="text-sm text-red-500 dark:text-red-400">{error}</div>
          ) : (
            <div className="flex items-center gap-4">
              {hasCheckedIn && (
                <div className="text-sm px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Check-in: {formatTime(todayAttendance?.checkIn)}
                  </span>
                </div>
              )}
              
              {hasCheckedOut && (
                <div className="text-sm px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Check-out: {formatTime(todayAttendance?.checkOut)}
                  </span>
                </div>
              )}
              
              {!hasCheckedIn && (
                <button
                  onClick={handleCheckIn}
                  disabled={checkInLoading}
                  className="rounded-md bg-green-600 hover:bg-green-700 px-4 py-2 text-sm font-medium text-white"
                >
                  {checkInLoading ? "Đang điểm danh..." : "Điểm danh"}
                </button>
              )}
              
              {hasCheckedIn && !hasCheckedOut && (
                <button
                  onClick={handleCheckOut}
                  disabled={checkOutLoading}
                  className="rounded-md bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-medium text-white"
                >
                  {checkOutLoading ? "Đang kết thúc..." : "Kết thúc"}
                </button>
              )}
              
              {actionError && (
                <div className="text-sm text-red-500 dark:text-red-400">
                  {actionError}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="attendance-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            initialDate={new Date()}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: ''
            }}
            events={handleEventsFetch}
            height="auto"
            eventContent={renderEventContent}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false
            }}
            firstDay={1}
          />
        </div>
      </div>

      {/* Work Schedule Rules */}
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-gray-800 dark:bg-gray-900/50">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Nội quy giờ làm việc
        </h3>
        <div className="gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">
              Thời gian làm việc: {formatTimeFromHourMinute(WORK_START_HOUR, WORK_START_MINUTE)} - {formatTimeFromHourMinute(WORK_END_HOUR, WORK_END_MINUTE)}
            </h4>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">
              Thời gian nghỉ trưa: {formatTimeFromHourMinute(LUNCH_START_HOUR, LUNCH_START_MINUTE)} - {formatTimeFromHourMinute(LUNCH_END_HOUR, LUNCH_END_MINUTE)}
            </h4>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">
                Số giờ làm việc yêu cầu: <span className="font-medium">{WORK_HOURS_REQUIRED} giờ/ngày</span>
            </h4>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;