"use client";
import { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { EventContentArg, EventSourceFuncArg } from '@fullcalendar/core';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';

interface Attendance {
  _id: string;
  createdAt: string;
  checkIn?: {
    time: string;
  };
  checkOut?: {
    time: string;
  };
  status: string;
}

interface TodayAttendance {
  _id: string;
  date: string;
  checkIn?: {
    time: string;
  };
  checkOut?: {
    time: string;
  };
  totalHours?: number;
  status: string;
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

const AttendanceCalendar = () => {
  const { token } = useAuth();
  const calendarRef = useRef<FullCalendar | null>(null);
  
  // Today's attendance state
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkOutLoading, setCheckOutLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  
  // Function to format time
  const formatTime = (timeString?: string): string => {
    if (!timeString) return 'N/A';
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Function to format a date to YYYY-MM-DD string
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Function to fetch today's attendance
  const fetchTodayAttendance = async () => {
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
  };

  // Load today's attendance data when component mounts
  useEffect(() => {
    fetchTodayAttendance();
  }, [token]);
  
  // Calendar event loading function
  const handleEventsFetch = async (
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

      const isLateCheckIn = (timeString?: string): boolean => {
        if (!timeString) return false;
        const checkInTime = new Date(timeString);
        const nineAM = new Date(checkInTime);
        nineAM.setHours(9, 0, 0, 0);
        return checkInTime > nineAM;
      };

      const attendanceData: CalendarAttendanceData[] = [];

      // Format the data for FullCalendar
      response.data.forEach((attendance: Attendance) => {
        const date = new Date(attendance.createdAt);
        const formattedDate = formatDate(date);
        
        // Check if date is today
        const today = formatDate(new Date());
        const isToday = formattedDate === today;
        
        const checkInColor = attendance.checkIn?.time
          ? (isLateCheckIn(attendance.checkIn.time) ? '#F44336' : '#4CAF50')
          : '#9E9E9E';
        
        attendanceData.push({
          id: attendance._id + "_in",
          date: formattedDate,
          color: checkInColor,
          extendedProps: {
            time: attendance.checkIn?.time,
          }
        });
        
        // Only push checkout event if it has checkout time or if it's not today
        if (attendance.checkOut?.time || !isToday) {
          attendanceData.push({
            id: attendance._id + "_out",
            date: formattedDate,
            color: attendance.checkOut?.time ? '#4CAF50' : '#F44336',
            extendedProps: {
              time: attendance.checkOut?.time,
            }
          });
        }
      });
      
      successCallback(attendanceData);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      failureCallback(error instanceof Error ? error : new Error(String(error)));
    }
  };
  
  // Custom render for events
  const renderEventContent = (eventInfo: EventContentArg) => {
    const { extendedProps } = eventInfo.event;
    const time = extendedProps.time ? formatTime(extendedProps.time) : 'K';
    
    return (
      <span className="text-xs p-1">
        {time}
      </span>
    );
  };

  // Handle Check-In
  const handleCheckIn = async () => {
    setCheckInLoading(true);
    setActionError(null);
    
    try {
      const response = await api.post("/attendance/check-in");
      setTodayAttendance(response.data);
      
      // Refresh calendar data
      if (calendarRef.current) {
        calendarRef.current.getApi().refetchEvents();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setActionError(error.response?.data?.message || "Failed to check in");
      console.error(err);
    } finally {
      setCheckInLoading(false);
    }
  };

  // Handle Check-Out
  const handleCheckOut = async () => {
    setCheckOutLoading(true);
    setActionError(null);
    
    try {
      const response = await api.post("/attendance/check-out");
      setTodayAttendance(response.data);
      
      // Refresh calendar data
      if (calendarRef.current) {
        calendarRef.current.getApi().refetchEvents();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setActionError(error.response?.data?.message || "Failed to check out");
      console.error(err);
    } finally {
      setCheckOutLoading(false);
    }
  };

  const hasCheckedIn = todayAttendance && todayAttendance.checkIn && todayAttendance.checkIn.time;
  const hasCheckedOut = todayAttendance && todayAttendance.checkOut && todayAttendance.checkOut.time;

  return (
    <div className="space-y-6">      
      {/* Calendar with attendance actions */}
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-gray-800 dark:bg-gray-900/50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Attendance Calendar</h3>
          
          {loading ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          ) : error ? (
            <div className="text-sm text-red-500 dark:text-red-400">
              {error}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {hasCheckedIn && (
                <div className="text-sm px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Check-in: {formatTime(todayAttendance?.checkIn?.time)}
                  </span>
                </div>
              )}
              
              {hasCheckedOut && (
                <div className="text-sm px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Check-out: {formatTime(todayAttendance?.checkOut?.time)}
                  </span>
                </div>
              )}
              
              {!hasCheckedIn && (
                <button
                  onClick={handleCheckIn}
                  disabled={checkInLoading}
                  className="rounded-md bg-green-600 hover:bg-green-700 px-4 py-2 text-sm font-medium text-white"
                >
                  {checkInLoading ? "Checking in..." : "Check In"}
                </button>
              )}
              
              {hasCheckedIn && !hasCheckedOut && (
                <button
                  onClick={handleCheckOut}
                  disabled={checkOutLoading}
                  className="rounded-md bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-medium text-white"
                >
                  {checkOutLoading ? "Checking out..." : "Check Out"}
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
          />
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;