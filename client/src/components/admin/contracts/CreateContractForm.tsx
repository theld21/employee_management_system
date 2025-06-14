'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

interface Device {
  _id: string;
  code: string;
  description: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

export const CreateContractForm: React.FC = () => {
  const [deviceId, setDeviceId] = useState('');
  const [userId, setUserId] = useState('');
  const [type, setType] = useState<'ASSIGNMENT' | 'RECOVERY'>('ASSIGNMENT');
  const [note, setNote] = useState('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [devicesRes, usersRes] = await Promise.all([
          api.get('/devices'),
          api.get('/admin/users')
        ]);
        
        // Assuming the devices endpoint returns paginated data
        setDevices(devicesRes.data.devices || devicesRes.data || []);
        // Assuming the users endpoint returns an array of users
        setUsers(usersRes.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceId || !userId || !type) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const contractData = {
        deviceId,
        userId,
        type,
        note: note || '',
      };

      await api.post('/contracts', contractData);
      router.push('/admin/contracts');
    } catch (err: any) {
      console.error('Error creating contract:', err);
      const message = err.response?.data?.message || 'Có lỗi xảy ra khi tạo biên bản';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/contracts');
  };

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Tạo biên bản mới</h2>
        <div className="text-center py-10">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Tạo biên bản mới</h2>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Loại biên bản <span className="text-red-500">*</span>
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as 'ASSIGNMENT' | 'RECOVERY')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ASSIGNMENT">Bàn giao thiết bị</option>
            <option value="RECOVERY">Thu hồi thiết bị</option>
          </select>
        </div>

        <div>
          <label htmlFor="device" className="block text-sm font-medium text-gray-700 mb-1">
            Thiết bị <span className="text-red-500">*</span>
          </label>
          <select
            id="device"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Chọn thiết bị</option>
            {devices.map((device) => (
              <option key={device._id} value={device._id}>
                {device.code} - {device.description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1">
            Nhân viên <span className="text-red-500">*</span>
          </label>
          <select
            id="user"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Chọn nhân viên</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
            Ghi chú
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {submitting ? 'Đang tạo...' : 'Tạo biên bản'}
          </button>
        </div>
      </form>
    </div>
  );
};
