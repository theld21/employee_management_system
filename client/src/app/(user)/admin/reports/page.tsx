"use client";
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';
import Spinner from '@/components/ui/loading/Spinner';

interface DailyData {
  date: string;
  day: number;
  work: number;
  leave: number;
  note: string;
}

interface UserReport {
  user: {
    _id: string;
    name: string;
    email: string;
    employeeId: string;
  };
  dailyData: DailyData[];
  totalDays: number;
}

interface ReportData {
  month: number;
  year: number;
  startDate: string;
  endDate: string;
  data: UserReport[];
}

export default function AttendanceReports() {
  const { user } = useAuth();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const handleFetchReport = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/attendance/report?month=${month}&year=${year}`);
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
      alert('Có lỗi xảy ra khi tải báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!reportData) return;

    // Tạo dữ liệu cho Excel
    const excelData = [];

    // Header row
    const header = ['STT', 'Tên nhân viên', 'Mã NV'];
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      header.push(`${i}`);
    }
    header.push('Tổng công');
    excelData.push(header);

    // Data rows
    reportData.data.forEach((userReport, index) => {
      const row = [
        index + 1,
        userReport.user.name,
        userReport.user.employeeId || userReport.user.email
      ];

      // Add daily data
      userReport.dailyData.forEach(day => {
        let cellValue = '';
        if (day.work > 0) {
          cellValue = day.work.toString();
          if (day.leave > 0) {
            cellValue += ` (${day.leave === 1 ? '1P' : '1/2P'})`;
          }
        } else if (day.note === 'Cuối tuần') {
          cellValue = '-';
        } else {
          cellValue = '0';
        }
        row.push(cellValue);
      });

      // Add total
      row.push(userReport.totalDays);
      excelData.push(row);
    });

    // Tạo workbook và worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Thiết lập độ rộng cột
    const colWidths = [
      { width: 5 },  // STT
      { width: 20 }, // Tên
      { width: 15 }, // Mã NV
    ];
    for (let i = 0; i < daysInMonth; i++) {
      colWidths.push({ width: 8 }); // Các ngày
    }
    colWidths.push({ width: 10 }); // Tổng công

    ws['!cols'] = colWidths;

    // Thêm worksheet vào workbook
    XLSX.utils.book_append_sheet(wb, ws, `Cong_${month}_${year}`);

    // Xuất file
    const fileName = `BaoCaoCong_${month}_${year}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (user?.role !== 'admin') {
    return <div>Bạn không có quyền truy cập trang này</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-gray-800 dark:bg-gray-900/50">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          Báo cáo chấm công
        </h1>

        {/* Filter controls */}
        <div className="flex items-end gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tháng
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Năm
            </label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const currentYear = new Date().getFullYear();
                const yearValue = currentYear - 2 + i;
                return (
                  <option key={yearValue} value={yearValue}>
                    {yearValue}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleFetchReport}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
            >
              {loading ? <Spinner /> : 'Tải báo cáo'}
            </button>

            {reportData && (
              <button
                onClick={handleExportExcel}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
              >
                Xuất Excel
              </button>
            )}
          </div>
        </div>

        {/* Report table */}
        {reportData && (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 dark:border-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tên nhân viên
                  </th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Mã NV
                  </th>
                  {Array.from({ length: new Date(year, month, 0).getDate() }, (_, i) => (
                    <th key={i + 1} className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {i + 1}
                    </th>
                  ))}
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tổng công
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                {reportData.data.map((userReport, index) => (
                  <tr key={userReport.user._id}>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-sm text-gray-900 dark:text-gray-100">
                      {index + 1}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                      {userReport.user.name}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                      {userReport.user.employeeId || userReport.user.email}
                    </td>
                    {userReport.dailyData.map((day, dayIndex) => (
                      <td key={dayIndex} className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center text-xs text-gray-900 dark:text-gray-100">
                        {day.work > 0 ? (
                          <span>
                            {day.work}
                            {day.leave > 0 && (
                              <span className="text-blue-600 dark:text-blue-400">
                                ({day.leave === 1 ? '1P' : '1/2P'})
                              </span>
                            )}
                          </span>
                        ) : day.note === 'Cuối tuần' ? (
                          <span className="text-gray-400">-</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400">0</span>
                        )}
                      </td>
                    ))}
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-medium text-gray-900 dark:text-gray-100">
                      {userReport.totalDays}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 