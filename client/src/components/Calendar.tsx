'use client';

import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { vi } from 'date-fns/locale';
import { useEffect, useState } from 'react';

const locales = {
  'vi': vi,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'checkin' | 'checkout';
}

export default function Calendar() {
  const [mounted, setMounted] = useState(false);
  
  // This ensures the component only renders on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Example events - in a real app, these would come from your backend
  const events: Event[] = [
    {
      id: '1',
      title: 'Check-in',
      start: new Date(2024, 2, 1, 9, 0),
      end: new Date(2024, 2, 1, 9, 0),
      type: 'checkin',
    },
    {
      id: '2',
      title: 'Check-out',
      start: new Date(2024, 2, 1, 17, 0),
      end: new Date(2024, 2, 1, 17, 0),
      type: 'checkout',
    },
  ];

  if (!mounted) {
    return <div className="h-full bg-white rounded-lg flex items-center justify-center">Loading calendar...</div>;
  }

  return (
    <BigCalendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      style={{ height: '100%' }}
      views={['month', 'week', 'day']}
      defaultView="week"
      messages={{
        next: "Tiếp",
        previous: "Trước",
        today: "Hôm nay",
        month: "Tháng",
        week: "Tuần",
        day: "Ngày"
      }}
    />
  );
} 