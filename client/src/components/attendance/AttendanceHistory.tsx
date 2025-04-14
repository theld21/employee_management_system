"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';

interface Attendance {
  _id: string;
  date: string;
  checkIn?: {
    time: string;
  };
  checkOut?: {
    time: string;
  };
  totalHours: number;
  status: string;
}

const AttendanceHistory = () => {
  const { token } = useAuth();
  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: getDefaultStartDate(),
    endDate: new Date().toISOString().split('T')[0], // Today
  });
  const [historyDays, setHistoryDays] = useState(7);

  function getDefaultStartDate() {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Last 30 days by default
    return date.toISOString().split('T')[0];
  }

  useEffect(() => {
    const fetchAttendanceHistory = async () => {
      if (!token) return;

      setLoading(true);
      try {
        const start = new Date();
        start.setDate(start.getDate() - (historyDays || 7));
        
        const params = new URLSearchParams({
          startDate: start.toISOString(),
          endDate: new Date().toISOString(),
        });
        
        const response = await api.get(`/attendance/my?${params}`);
        setAttendanceHistory(response.data.sort((a: any, b: any) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ));
      } catch (err) {
        console.error('Error fetching attendance history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceHistory();
  }, [token, historyDays]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-gray-800 dark:bg-gray-900/50">
      <h3 className="mb-5 text-xl font-semibold text-gray-900 dark:text-white">Attendance History</h3>
      
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Start Date
          </label>
          <input
            type="date"
            name="startDate"
            value={dateRange.startDate}
            onChange={handleDateChange}
            className="rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-800 outline-none focus:border-primary dark:border-gray-700 dark:text-white"
          />
        </div>
        
        <div>
          <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            End Date
          </label>
          <input
            type="date"
            name="endDate"
            value={dateRange.endDate}
            onChange={handleDateChange}
            className="rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-gray-800 outline-none focus:border-primary dark:border-gray-700 dark:text-white"
          />
        </div>
      </div>
      
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      ) : attendanceHistory.length === 0 ? (
        <div className="rounded-lg bg-gray-100 px-4 py-8 text-center text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          No attendance records found for the selected period.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Check In</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Check Out</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Total Hours</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceHistory.map((record) => (
                <tr 
                  key={record._id} 
                  className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-300">{formatDate(record.date)}</td>
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-300">{formatTime(record.checkIn?.time)}</td>
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-300">{formatTime(record.checkOut?.time)}</td>
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-300">
                    {record.totalHours ? record.totalHours.toFixed(2) : 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <span 
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                        record.status === 'present'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : record.status === 'late'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : record.status === 'absent'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}
                    >
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory; 