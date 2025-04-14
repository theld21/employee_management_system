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

      // Format the data for FullCalendar
      const formattedEvents = response.data.map((attendance: Attendance) => {
        const date = new Date(attendance.date);
        const formattedDate = date.toISOString().split('T')[0];
        
        // Set color based on status
        let color = '#4CAF50'; // Default green for present
        if (attendance.status === 'absent') {
          color = '#F44336'; // Red for absent
        } else if (attendance.status === 'late') {
          color = '#FF9800'; // Orange for late
        }
        
        return {
          id: attendance._id,
          title: attendance.status,
          date: formattedDate,
          color: color,
          extendedProps: {
            checkIn: attendance.checkIn?.time,
            checkOut: attendance.checkOut?.time,
            totalHours: attendance.totalHours,
            status: attendance.status
          }
        };
      });
      
      setEvents(formattedEvents);
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
    const checkIn = extendedProps.checkIn ? formatTime(extendedProps.checkIn) : 'K';
    const checkOut = extendedProps.checkOut ? formatTime(extendedProps.checkOut) : 'K';
    const hours = extendedProps.totalHours ? `${extendedProps.totalHours.toFixed(1)}h` : 'K';
    
    return (
      <div className="text-xs p-1">
        <div>{checkIn} - {checkOut}</div>
        {extendedProps.totalHours && <div>{hours}</div>}
      </div>
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