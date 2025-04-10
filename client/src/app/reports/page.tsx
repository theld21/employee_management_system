'use client';

import { useState } from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  // Example data - in a real app, this would come from your backend
  const reportData = {
    totalDays: 22,
    presentDays: 20,
    lateDays: 2,
    averageCheckIn: '9:05',
    averageCheckOut: '17:30',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Báo cáo chấm công</h2>
        
        <div className="flex space-x-4">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {months.map((month, index) => (
              <option key={index} value={index}>
                {month}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {[2023, 2024].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <div className="flex items-center">
            <ChartBarIcon className="h-6 w-6 text-blue-500" />
            <span className="ml-2 text-lg font-medium">Tổng số ngày làm việc</span>
          </div>
          <div className="mt-4 text-3xl font-bold text-gray-900">{reportData.totalDays}</div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-lg">
          <div className="flex items-center">
            <ChartBarIcon className="h-6 w-6 text-green-500" />
            <span className="ml-2 text-lg font-medium">Số ngày có mặt</span>
          </div>
          <div className="mt-4 text-3xl font-bold text-gray-900">{reportData.presentDays}</div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-lg">
          <div className="flex items-center">
            <ChartBarIcon className="h-6 w-6 text-red-500" />
            <span className="ml-2 text-lg font-medium">Số ngày đi muộn</span>
          </div>
          <div className="mt-4 text-3xl font-bold text-gray-900">{reportData.lateDays}</div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-lg">
          <div className="flex items-center">
            <ChartBarIcon className="h-6 w-6 text-purple-500" />
            <span className="ml-2 text-lg font-medium">Giờ check-in trung bình</span>
          </div>
          <div className="mt-4 text-3xl font-bold text-gray-900">{reportData.averageCheckIn}</div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-lg">
          <div className="flex items-center">
            <ChartBarIcon className="h-6 w-6 text-yellow-500" />
            <span className="ml-2 text-lg font-medium">Giờ check-out trung bình</span>
          </div>
          <div className="mt-4 text-3xl font-bold text-gray-900">{reportData.averageCheckOut}</div>
        </div>
      </div>
    </div>
  );
} 