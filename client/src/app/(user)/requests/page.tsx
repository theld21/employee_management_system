"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import AttendanceRequestForm from '@/components/requests/AttendanceRequestForm';
import RequestList from '@/components/requests/RequestList';
import api from '@/utils/api';

interface AttendanceRecord {
  _id: string;
  date: string;
  checkIn?: {
    time: string;
    note?: string;
  };
  checkOut?: {
    time: string;
    note?: string;
  };
  totalHours?: number;
  status: string;
}

const RequestsPage = () => {
  const { user, token } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestsUpdated, setRequestsUpdated] = useState(false);
  
  useEffect(() => {
    const fetchAttendanceRecords = async () => {
      if (!token) return;
      
      setLoading(true);
      try {
        // Get attendance records for the last 30 days
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        const params = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        });
        
        const response = await api.get(`/attendance/my?${params}`);
        setAttendanceRecords(response.data);
      } catch (err) {
        setError('Error fetching attendance records');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttendanceRecords();
  }, [token]);
  
  const handleRequestCreated = () => {
    setRequestsUpdated(!requestsUpdated);
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Please login to access this page</p>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Attendance Correction Requests" />
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-gray-800 dark:bg-gray-900/50">
            <h3 className="mb-5 text-xl font-semibold text-gray-900 dark:text-white">Create New Request</h3>
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : (
              <AttendanceRequestForm 
                attendanceRecords={attendanceRecords} 
                onRequestSubmitted={handleRequestCreated} 
              />
            )}
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <RequestList requestsUpdated={requestsUpdated} />
        </div>
      </div>
    </div>
  );
};

export default RequestsPage; 