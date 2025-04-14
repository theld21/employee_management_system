"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import AttendanceCard from '@/components/attendance/AttendanceCard';
import AttendanceHistory from '@/components/attendance/AttendanceHistory';
import api from '@/utils/api';

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

const AttendancePage = () => {
  const { token } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hàm tải dữ liệu điểm danh ngày hôm nay
  const fetchTodayAttendance = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await api.get('/attendance/today');
      setTodayAttendance(response.data);
    } catch (err) {
      setError('Error connecting to the server');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load dữ liệu khi component mount
  useEffect(() => {
    fetchTodayAttendance();
  }, [token]);

  // Xử lý sau khi check-in/check-out
  const handleAttendanceUpdate = (updatedData: TodayAttendance) => {
    // Cập nhật dữ liệu ngay lập tức để UI hiển thị kết quả check-in/check-out
    setTodayAttendance(updatedData);
    
    // Sau đó tải lại dữ liệu từ server sau 1 giây (để đảm bảo dữ liệu nhất quán)
    setTimeout(() => {
      fetchTodayAttendance();
    }, 1000);
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Attendance Management" />
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <AttendanceCard 
            todayAttendance={todayAttendance} 
            loading={loading} 
            error={error} 
            onAttendanceUpdate={handleAttendanceUpdate}
          />
        </div>
        
        <div className="md:col-span-2">
          <AttendanceHistory />
        </div>
      </div>
    </div>
  );
};

export default AttendancePage; 