"use client";
import { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { DatesSetArg, EventInput, EventContentArg } from '@fullcalendar/core';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';

interface AttendanceEvent {
  title: string;
  date: string;
  color: string;
  id: string;
  extendedProps: {
    checkIn?: string;
    checkOut?: string;
    totalHours?: number;
    status: string;
  };
}

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

const AttendanceCalendar = () => {
  const { token } = useAuth();
  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const calendarRef = useRef<FullCalendar | null>(null);
  const initialDataLoadedRef = useRef(false);
  const fetchingRef = useRef(false);
  
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
  
  // Function to fetch attendance data based on visible date range
  const fetchAttendanceData = async (start: Date, end: Date): Promise<void> => {
    // Prevent concurrent fetches
    if (fetchingRef.current) return;
    
    try {
      if (!token) return;
      
      fetchingRef.current = true;
      console.log('Fetching attendance data for:', start, 'to', end);

      const params = new URLSearchParams({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });
      
      const response = await api.get(`/attendance/my?${params}`);
      
      if (!response.data) {
        throw new Error('Failed to fetch attendance data');
      }

      const isLateCheckIn = (timeString?: string): boolean => {
        if (!timeString) return false;
        const checkInTime = new Date(timeString);
        const nineAM = new Date(checkInTime);
        nineAM.setHours(9, 0, 0, 0);
        return checkInTime > nineAM;
      };

      const attendanceData: any[] = [];

      // Format the data for FullCalendar
      response.data.forEach((attendance: Attendance) => {
        const date = new Date(attendance.createdAt);
        const formattedDate = date.toISOString().split('T')[0];
        
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
        
        attendanceData.push({
          id: attendance._id + "_out",
          date: formattedDate,
          color: attendance.checkOut?.time ? '#4CAF50' : '#F44336',
          extendedProps: {
            time: attendance.checkOut?.time,
          }
        });
      });
      
      setEvents(attendanceData);
      initialDataLoadedRef.current = true;
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      fetchingRef.current = false;
    }
  };
  
  // Handle date change in calendar
  const handleDatesSet = (arg: DatesSetArg) => {
    const { start, end } = arg;
    fetchAttendanceData(start, end);
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
        const calendarApi = calendarRef.current.getApi();
        const view = calendarApi.view;
        fetchAttendanceData(
          new Date(view.currentStart),
          new Date(view.currentEnd)
        );
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
        const calendarApi = calendarRef.current.getApi();
        const view = calendarApi.view;
        fetchAttendanceData(
          new Date(view.currentStart),
          new Date(view.currentEnd)
        );
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
      {/* Check-in/Check-out Card */}
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-gray-800 dark:bg-gray-900/50">
        <h3 className="mb-5 text-xl font-semibold text-gray-900 dark:text-white">Today's Attendance</h3>
        
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="mb-5 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        ) : (
          <div>
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">Check-in Time</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {hasCheckedIn ? formatTime(todayAttendance?.checkIn?.time) : "Not checked in"}
                </p>
              </div>
              <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">Check-out Time</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {hasCheckedOut ? formatTime(todayAttendance?.checkOut?.time) : "Not checked out"}
                </p>
              </div>
            </div>
            
            {Boolean(hasCheckedIn && hasCheckedOut) ? (
              <div className="mb-4 rounded-lg bg-green-100 p-4 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <p className="font-medium">Attendance complete for today!</p>
                <p className="text-sm">Total hours: {todayAttendance?.totalHours?.toFixed(2) || "Calculating..."}</p>
              </div>
            ) : (
              <>              
                {actionError && (
                  <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    {actionError}
                  </div>
                )}
                
                <div className="flex gap-4">
                  <button
                    onClick={handleCheckIn}
                    disabled={Boolean(checkInLoading || hasCheckedIn)}
                    className={`flex-1 rounded-lg py-3 px-6 text-center font-medium text-white disabled:opacity-70 ${
                      hasCheckedIn 
                        ? "bg-gray-500 cursor-not-allowed" 
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {checkInLoading ? "Checking in..." : hasCheckedIn ? "Checked In" : "Check In"}
                  </button>
                  
                  <button
                    onClick={handleCheckOut}
                    disabled={Boolean(checkOutLoading || !hasCheckedIn || hasCheckedOut)}
                    className={`flex-1 rounded-lg py-3 px-6 text-center font-medium text-white disabled:opacity-70 ${
                      !hasCheckedIn || hasCheckedOut
                        ? "bg-gray-500 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {checkOutLoading ? "Checking out..." : hasCheckedOut ? "Checked Out" : "Check Out"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Calendar */}
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-gray-800 dark:bg-gray-900/50">
        <div className="attendance-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin]}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth'
            }}
            events={events as EventInput[]}
            datesSet={handleDatesSet}
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