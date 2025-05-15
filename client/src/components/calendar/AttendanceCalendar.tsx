"use client";
import { useState, useRef } from 'react';
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

const AttendanceCalendar = () => {
  const { token } = useAuth();
  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const calendarRef = useRef<FullCalendar | null>(null);
  const initialDataLoadedRef = useRef(false);
  const fetchingRef = useRef(false);
  
  // Function to format time
  const formatTime = (timeString?: string): string => {
    if (!timeString) return 'N/A';
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
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

  return (
    <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-gray-800 dark:bg-gray-900/50">
      <div className="attendance-calendar">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
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
      <div className="mt-4 flex gap-4 text-sm justify-center">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
          <span>Present</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
          <span>Late</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
          <span>Absent</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;