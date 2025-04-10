'use client';

import { useState } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';

export default function CheckInPage() {
  const [lastAction, setLastAction] = useState<'checkin' | 'checkout' | null>(null);
  const [time, setTime] = useState<string>('');

  const handleAction = (action: 'checkin' | 'checkout') => {
    const now = new Date();
    setLastAction(action);
    setTime(now.toLocaleTimeString('vi-VN'));
    // In a real app, you would send this to your backend
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Check-in/Check-out</h2>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center">
            <ClockIcon className="h-6 w-6 text-gray-400" />
            <span className="ml-2 text-lg font-medium">Current Time</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {new Date().toLocaleTimeString('vi-VN')}
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-lg">
          <div className="mb-4">
            <h3 className="text-lg font-medium">Last Action</h3>
            {lastAction && time && (
              <p className="mt-2 text-sm text-gray-600">
                {lastAction === 'checkin' ? 'Checked in' : 'Checked out'} at {time}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          onClick={() => handleAction('checkin')}
          className="rounded-lg bg-green-600 px-4 py-3 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Check In
        </button>
        <button
          onClick={() => handleAction('checkout')} className="rounded-lg bg-red-600 px-4 py-3 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Check Out
        </button>
      </div>
    </div>
  );
} 