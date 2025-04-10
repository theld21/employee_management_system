import Calendar from '@/components/Calendar';
import '@/app/globals.css';

export default function HomePage() {
  return (
    <div className="h-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Time Management Calendar</h2>
      </div>
      <div className="h-[calc(100vh-12rem)]">
        <Calendar />
      </div>
    </div>
  );
} 