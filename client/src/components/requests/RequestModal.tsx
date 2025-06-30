"use client";
import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import {
  WORK_START_HOUR,
  WORK_START_MINUTE,
  WORK_END_HOUR,
  WORK_END_MINUTE,
  LUNCH_START_HOUR,
  LUNCH_START_MINUTE,
  LUNCH_END_HOUR,
  LUNCH_END_MINUTE,
} from '@/constants/workDays';

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestSubmitted: () => void;
}

const RequestModal: React.FC<RequestModalProps> = ({
  isOpen,
  onClose,
  onRequestSubmitted,
}) => {
  const [formData, setFormData] = useState({
    type: 'leave-request',
    startTime: '',
    endTime: '',
    reason: '',
    leaveDays: 0
  });

  const [currentLeaveDays, setCurrentLeaveDays] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Thêm state cho việc chọn ca sáng/chiều
  const [startSession, setStartSession] = useState<'morning' | 'afternoon'>('morning');
  const [endSession, setEndSession] = useState<'morning' | 'afternoon'>('afternoon');

  // Hàm validate thời gian
  const validateDates = (start: string, end: string, type: string, startSess?: 'morning' | 'afternoon', endSess?: 'morning' | 'afternoon') => {
    if (!start || !end) return null;

    const startDate = new Date(start);
    const endDate = new Date(end);
    const now = new Date();

    // Nếu là nghỉ phép, set giờ theo ca
    if (type === 'leave-request' && startSess && endSess) {
      if (startSess === 'morning') {
        startDate.setHours(8, 30, 0);
      } else {
        startDate.setHours(13, 0, 0);
      }
      if (endSess === 'morning') {
        endDate.setHours(12, 0, 0);
      } else {
        endDate.setHours(17, 0, 0);
      }
    }

    // Validate end > start
    if (endDate <= startDate) {
      return 'Thời gian kết thúc phải lớn hơn thời gian bắt đầu';
    }

    // Với cập nhật giờ làm: validate thời gian < hiện tại
    if (type === 'work-time') {
      if (startDate >= now) {
        return 'Thời gian bắt đầu phải nhỏ hơn thời gian hiện tại';
      }
      if (endDate >= now) {
        return 'Thời gian kết thúc phải nhỏ hơn thời gian hiện tại';
      }
    }

    return null;
  };

  // Kiểm tra form có hợp lệ không
  const isFormValid = () => {
    if (!formData.startTime || !formData.endTime || !formData.reason) return false;
    if (formData.type === 'leave-request' && formData.leaveDays > (currentLeaveDays ?? 0)) return false;
    return true;
  };

  useEffect(() => {
    const fetchCurrentLeaveDays = async () => {
      try {
        const response = await api.get('/requests/current-leave-days');
        setCurrentLeaveDays(response.data.currentLeaveDays);
      } catch (err) {
        console.error('Error fetching current leave days:', err);
      }
    };

    if (isOpen) {
      fetchCurrentLeaveDays();
    }
    setError(null);
    // Reset form data
    setFormData(prev => ({
      ...prev,
      startTime: '',
      endTime: '',
      reason: '',
      leaveDays: 0
    }));
    // Reset session selections
    setStartSession('morning');
    setEndSession('afternoon');
  }, [isOpen]);

  useEffect(() => {
    setError(null);
    // Reset form data when changing request type
    if (formData.type === 'leave-request') {
      setFormData(prev => ({
        ...prev,
        startTime: '',
        endTime: '',
        reason: '',
        leaveDays: 0
      }));
      setStartSession('morning');
      setEndSession('afternoon');
    } else {
      setFormData(prev => ({
        ...prev,
        startTime: '',
        endTime: '',
        reason: ''
      }));
    }
  }, [formData.type]);

  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      const validationError = formData.type === 'leave-request'
        ? validateDates(formData.startTime, formData.endTime, formData.type, startSession, endSession)
        : validateDates(formData.startTime, formData.endTime, formData.type);

      if (validationError) {
        setError(validationError);
        setFormData(prev => ({ ...prev, leaveDays: 0 }));
        return;
      }

      if (formData.type === 'leave-request') {
        // Xác định giờ theo ca
        const start = new Date(formData.startTime);
        const end = new Date(formData.endTime);

        if (startSession === 'morning') {
          start.setHours(8, 30, 0);
        } else {
          start.setHours(13, 0, 0);
        }
        if (endSession === 'morning') {
          end.setHours(12, 0, 0);
        } else {
          end.setHours(17, 0, 0);
        }

        // Gọi API để tính số ngày nghỉ
        const calculateDays = async () => {
          try {
            const response = await api.post('/requests/calculate-days', {
              startTime: start.toISOString(),
              endTime: end.toISOString()
            });
            setFormData(prev => ({ ...prev, leaveDays: response.data.leaveDays }));
          } catch (err) {
            console.error('Error calculating leave days:', err);
          }
        };
        calculateDays();
      }
    }
    setError(null);
  }, [formData.startTime, formData.endTime, startSession, endSession, formData.type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);

      // Set time based on request type
      if (formData.type === 'leave-request') {
        if (startSession === 'morning') {
          start.setHours(8, 30, 0);
        } else {
          start.setHours(13, 0, 0);
        }
        if (endSession === 'morning') {
          end.setHours(12, 0, 0);
        } else {
          end.setHours(17, 0, 0);
        }

        // Validate với session
        const validationError = validateDates(formData.startTime, formData.endTime, formData.type, startSession, endSession);
        if (validationError) {
          setError(validationError);
          setIsLoading(false);
          return;
        }
      } else {
        // Validate không cần session
        const validationError = validateDates(formData.startTime, formData.endTime, formData.type);
        if (validationError) {
          setError(validationError);
          setIsLoading(false);
          return;
        }
      }

      await api.post('/requests', {
        ...formData,
        startTime: start.toISOString(),
        endTime: end.toISOString()
      });
      toast.success('Tạo yêu cầu thành công');
      onRequestSubmitted();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Có lỗi xảy ra khi tạo yêu cầu');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[600px] dark:bg-gray-900">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Tạo yêu cầu mới
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
          >
            <span className="sr-only">Đóng</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Loại yêu cầu
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="work-time">Cập nhật giờ làm</option>
              <option value="leave-request">Nghỉ phép có lương</option>
            </select>
          </div>

          {/* Ẩn form nếu hết ngày phép */}
          {formData.type === 'leave-request' && currentLeaveDays !== null && currentLeaveDays === 0 && (
            <div className="text-sm text-red-600 dark:text-red-400">
              Số ngày phép còn lại: <span className="font-medium">0 ngày</span>.<br />Bạn không thể tạo yêu cầu nghỉ phép mới.
            </div>
          )}

          {/* Hiển thị form nếu còn ngày phép */}
          {formData.type === 'leave-request' && currentLeaveDays !== null && currentLeaveDays > 0 && (
            <>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Số ngày phép còn lại: <span className="font-medium text-blue-600 dark:text-blue-400">{currentLeaveDays}</span> ngày
              </div>
              <div className="space-y-4">
                {/* Ngày bắt đầu */}
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ngày bắt đầu
                    </label>
                    <input
                      type="date"
                      value={formData.startTime.split('T')[0]}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      required
                    />
                  </div>
                  <div className="w-40 mt-1 md:mt-6">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 md:sr-only">
                      Giờ bắt đầu
                    </label>
                    <select
                      value={startSession}
                      onChange={e => setStartSession(e.target.value as 'morning' | 'afternoon')}
                      className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    >
                      <option value="morning">{`${WORK_START_HOUR.toString().padStart(2, '0')}:${WORK_START_MINUTE.toString().padStart(2, '0')}`}</option>
                      <option value="afternoon">{`${LUNCH_END_HOUR.toString().padStart(2, '0')}:${LUNCH_END_MINUTE.toString().padStart(2, '0')}`}</option>
                    </select>
                  </div>
                </div>
                {/* Ngày kết thúc */}
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ngày kết thúc
                    </label>
                    <input
                      type="date"
                      value={formData.endTime.split('T')[0]}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      required
                    />
                  </div>
                  <div className="w-40 mt-1 md:mt-6">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 md:sr-only">
                      Giờ kết thúc
                    </label>
                    <select
                      value={endSession}
                      onChange={e => setEndSession(e.target.value as 'morning' | 'afternoon')}
                      className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    >
                      <option value="morning">{`${LUNCH_START_HOUR.toString().padStart(2, '0')}:${LUNCH_START_MINUTE.toString().padStart(2, '0')}`}</option>
                      <option value="afternoon">{`${WORK_END_HOUR.toString().padStart(2, '0')}:${WORK_END_MINUTE.toString().padStart(2, '0')}`}</option>
                    </select>
                  </div>
                </div>
              </div>
              {formData.leaveDays > 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Số ngày nghỉ: <span className="font-medium text-blue-600 dark:text-blue-400">{formData.leaveDays}</span> ngày
                  {formData.leaveDays > (currentLeaveDays ?? 0) && (
                    <p className="mt-1 text-red-600 dark:text-red-400">
                      Số ngày nghỉ vượt quá số ngày phép còn lại
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Cập nhật giờ làm */}
          {formData.type === 'work-time' && (
            <>
              <div className="mb-4">
                <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ngày và giờ bắt đầu
                </label>
                <input
                  type="datetime-local"
                  name="startDateTime"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-transparent p-2 text-gray-800 outline-none focus:border-primary focus-visible:shadow-none dark:border-gray-700 dark:text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ngày và giờ kết thúc
                </label>
                <input
                  type="datetime-local"
                  name="endDateTime"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-transparent p-2 text-gray-800 outline-none focus:border-primary focus-visible:shadow-none dark:border-gray-700 dark:text-white"
                  required
                />
              </div>
            </>
          )}

          {!(formData.type === 'leave-request' && currentLeaveDays == 0) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Lý do
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                required
              />
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading || !isFormValid()}
              className="px-4 py-2 rounded-lg bg-blue-500 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              {isLoading ? 'Đang tạo...' : 'Tạo yêu cầu'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default RequestModal; 