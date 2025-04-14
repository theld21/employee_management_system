"use client";
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';

interface AttendanceCardProps {
  todayAttendance: any;
  loading: boolean;
  error: string | null;
  onAttendanceUpdate: (data: any) => void;
}

const AttendanceCard: React.FC<AttendanceCardProps> = ({
  todayAttendance,
  loading,
  error,
  onAttendanceUpdate,
}) => {
  const { token } = useAuth();
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkOutLoading, setCheckOutLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleCheckIn = async () => {
    setCheckInLoading(true);
    setActionError(null);
    
    try {
      const response = await api.post('/attendance/check-in');
      
      if (onAttendanceUpdate) {
        onAttendanceUpdate(response.data);
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to check in');
      console.error(err);
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckOutLoading(true);
    setActionError(null);
    
    try {
      const response = await api.post('/attendance/check-out');
      
      if (onAttendanceUpdate) {
        onAttendanceUpdate(response.data);
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to check out');
      console.error(err);
    } finally {
      setCheckOutLoading(false);
    }
  };

  const hasCheckedIn = todayAttendance && todayAttendance.checkIn && todayAttendance.checkIn.time;
  const hasCheckedOut = todayAttendance && todayAttendance.checkOut && todayAttendance.checkOut.time;

  return (
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
                {hasCheckedIn ? formatTime(todayAttendance.checkIn.time) : 'Not checked in'}
              </p>
            </div>
            <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
              <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">Check-out Time</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {hasCheckedOut ? formatTime(todayAttendance.checkOut.time) : 'Not checked out'}
              </p>
            </div>
          </div>
          
          {(hasCheckedIn && hasCheckedOut) ? (
            <div className="mb-4 rounded-lg bg-green-100 p-4 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <p className="font-medium">Attendance complete for today!</p>
              <p className="text-sm">Total hours: {todayAttendance.totalHours?.toFixed(2) || 'Calculating...'}</p>
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
                  disabled={checkInLoading || hasCheckedIn}
                  className={`flex-1 rounded-lg py-3 px-6 text-center font-medium text-white disabled:opacity-70 ${
                    hasCheckedIn 
                      ? 'bg-gray-500 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {checkInLoading ? 'Checking in...' : hasCheckedIn ? 'Checked In' : 'Check In'}
                </button>
                
                <button
                  onClick={handleCheckOut}
                  disabled={checkOutLoading || !hasCheckedIn || hasCheckedOut}
                  className={`flex-1 rounded-lg py-3 px-6 text-center font-medium text-white disabled:opacity-70 ${
                    !hasCheckedIn || hasCheckedOut
                      ? 'bg-gray-500 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {checkOutLoading ? 'Checking out...' : hasCheckedOut ? 'Checked Out' : 'Check Out'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceCard; 