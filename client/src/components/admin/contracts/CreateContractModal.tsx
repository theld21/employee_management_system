'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import api from '@/utils/api';

interface CreateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Device {
  _id: string;
  code: string;
  typeCode: string;
  description: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
}

export const CreateContractModal: React.FC<CreateContractModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    deviceId: '',
    userId: '',
    type: 'ASSIGNMENT',
    note: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      // Reset form when modal opens
      setFormData({
        deviceId: '',
        userId: '',
        type: 'ASSIGNMENT',
        note: '',
      });
      setError(null);
      setUserSearchQuery('');
      setDevices([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (userSearchQuery) {
      const filtered = users.filter(user => 
        `${user.firstName} ${user.lastName} ${user.username}`
          .toLowerCase()
          .includes(userSearchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [userSearchQuery, users]);

  // Fetch devices based on contract type and user selection
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        if (formData.type === 'ASSIGNMENT') {
          // For assignment, fetch only unassigned devices
          const response = await api.get('/devices/all', {
            params: { unassignedOnly: 'true' }
          });
          setDevices(response.data || []);
        } else if (formData.type === 'RECOVERY' && formData.userId) {
          // For recovery, fetch devices assigned to the selected user
          const response = await api.get(`/devices/user/${formData.userId}`);
          setDevices(response.data || []);
        } else {
          setDevices([]);
        }
      } catch (err) {
        console.error('Error fetching devices:', err);
        setError('Không thể tải danh sách thiết bị');
        setDevices([]);
      }
    };

    fetchDevices();
  }, [formData.type, formData.userId]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/groups/users');
      setUsers(response.data || []);
      setFilteredUsers(response.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Không thể tải danh sách người dùng');
      setUsers([]);
      setFilteredUsers([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('/contracts', formData);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Error creating contract:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Không thể tạo biên bản');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset deviceId when type or userId changes
      ...(name === 'type' || name === 'userId' ? { deviceId: '' } : {})
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-xl"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tạo biên bản mới</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/50 dark:border-red-800">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400 dark:text-red-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Loại biên bản
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              disabled={loading}
              className="block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm disabled:opacity-50"
            >
              <option value="ASSIGNMENT">Bàn giao</option>
              <option value="RECOVERY">Thu hồi</option>
            </select>
          </div>

          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nhân viên
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm nhân viên..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              />
              <div className="absolute right-3 top-2.5">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <select
              id="userId"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              required
              disabled={loading}
              className="mt-2 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm disabled:opacity-50"
            >
              <option value="">Chọn nhân viên</option>
              {filteredUsers.map(user => (
                <option key={user._id} value={user._id}>
                  {user.firstName} {user.lastName} ({user.username})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="deviceId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Thiết bị
            </label>
            <select
              id="deviceId"
              name="deviceId"
              value={formData.deviceId}
              onChange={handleChange}
              required
              disabled={loading || (formData.type === 'RECOVERY' && !formData.userId)}
              className="block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm disabled:opacity-50"
            >
              <option value="">Chọn thiết bị</option>
              {devices.map(device => (
                <option key={device._id} value={device._id}>
                  {device.code} - {device.description}
                </option>
              ))}
            </select>
            {formData.type === 'RECOVERY' && !formData.userId && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Vui lòng chọn nhân viên trước
              </p>
            )}
          </div>

          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ghi chú
            </label>
            <textarea
              id="note"
              name="note"
              value={formData.note}
              onChange={handleChange}
              disabled={loading}
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm disabled:opacity-50"
              placeholder="Nhập ghi chú (nếu có)"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Hủy
            </button>
            <button 
              type="submit"
              disabled={loading || !formData.deviceId || !formData.userId}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-brand-500 border border-transparent rounded-md shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 dark:bg-brand-600 dark:hover:bg-brand-700"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang tạo...
                </>
              ) : (
                'Tạo biên bản'
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}; 