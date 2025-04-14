"use client";
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';

interface Attendance {
  _id: string;
  date: string;
  checkIn: {
    time: string;
    note?: string;
  };
  checkOut?: {
    time: string;
    note?: string;
  };
}

interface AttendanceRequestFormProps {
  attendanceRecords: Attendance[];
  onRequestSubmitted: () => void;
}

const AttendanceRequestForm: React.FC<AttendanceRequestFormProps> = ({
  attendanceRecords,
  onRequestSubmitted,
}) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    attendanceId: '',
    requestType: 'check-in',
    requestedCheckIn: '',
    requestedCheckOut: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const selectedAttendance = attendanceRecords.find(
    (record) => record._id === formData.attendanceId
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatDateTimeForInput = (dateString: string | undefined) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // When attendance record changes, update the requested times
    if (name === 'attendanceId') {
      const record = attendanceRecords.find((r) => r._id === value);
      if (record) {
        setFormData((prev) => ({
          ...prev,
          requestedCheckIn: formatDateTimeForInput(record.checkIn?.time),
          requestedCheckOut: formatDateTimeForInput(record.checkOut?.time),
        }));
      }
    }
    
    // Reset success and error messages when form changes
    setSuccess(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.attendanceId) {
      setError('Please select an attendance record');
      return;
    }
    
    if (!formData.reason) {
      setError('Please provide a reason for the request');
      return;
    }
    
    if (
      (formData.requestType === 'check-in' || formData.requestType === 'both') && 
      !formData.requestedCheckIn
    ) {
      setError('Please specify the requested check-in time');
      return;
    }
    
    if (
      (formData.requestType === 'check-out' || formData.requestType === 'both') && 
      !formData.requestedCheckOut
    ) {
      setError('Please specify the requested check-out time');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const requestData = {
      attendanceId: formData.attendanceId,
      requestType: formData.requestType,
      reason: formData.reason,
      ...(formData.requestType === 'check-in' || formData.requestType === 'both' 
        ? { requestedCheckIn: formData.requestedCheckIn } 
        : {}
      ),
      ...(formData.requestType === 'check-out' || formData.requestType === 'both' 
        ? { requestedCheckOut: formData.requestedCheckOut } 
        : {}
      )
    };
    
    try {
      const response = await api.post('/requests', requestData);
      
      // Reset form
      setFormData({
        attendanceId: '',
        requestType: 'check-in',
        requestedCheckIn: '',
        requestedCheckOut: '',
        reason: '',
      });
      
      setSuccess(true);
      onRequestSubmitted();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create request');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {success && (
        <div className="mb-4 rounded-lg bg-green-100 px-4 py-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
          Request submitted successfully!
        </div>
      )}
      
      {error && (
        <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Select Attendance Record
        </label>
        <select
          name="attendanceId"
          value={formData.attendanceId}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 bg-transparent p-3 text-gray-800 outline-none focus:border-primary focus-visible:shadow-none dark:border-gray-700 dark:text-white"
          required
        >
          <option value="">Select a date</option>
          {attendanceRecords.map((record) => (
            <option key={record._id} value={record._id}>
              {formatDate(record.date)}
            </option>
          ))}
        </select>
      </div>
      
      {selectedAttendance && (
        <div className="mb-4 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Current Times:
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Check-in: {selectedAttendance.checkIn?.time 
              ? new Date(selectedAttendance.checkIn.time).toLocaleTimeString() 
              : 'Not checked in'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Check-out: {selectedAttendance.checkOut?.time 
              ? new Date(selectedAttendance.checkOut.time).toLocaleTimeString() 
              : 'Not checked out'}
          </p>
        </div>
      )}
      
      <div className="mb-4">
        <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Request Type
        </label>
        <select
          name="requestType"
          value={formData.requestType}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 bg-transparent p-3 text-gray-800 outline-none focus:border-primary focus-visible:shadow-none dark:border-gray-700 dark:text-white"
          required
        >
          <option value="check-in">Check-in Time</option>
          <option value="check-out">Check-out Time</option>
          <option value="both">Both Times</option>
        </select>
      </div>
      
      {(formData.requestType === 'check-in' || formData.requestType === 'both') && (
        <div className="mb-4">
          <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Requested Check-in Time
          </label>
          <input
            type="datetime-local"
            name="requestedCheckIn"
            value={formData.requestedCheckIn}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 bg-transparent p-3 text-gray-800 outline-none focus:border-primary focus-visible:shadow-none dark:border-gray-700 dark:text-white"
            required={formData.requestType === 'check-in' || formData.requestType === 'both'}
          />
        </div>
      )}
      
      {(formData.requestType === 'check-out' || formData.requestType === 'both') && (
        <div className="mb-4">
          <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Requested Check-out Time
          </label>
          <input
            type="datetime-local"
            name="requestedCheckOut"
            value={formData.requestedCheckOut}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 bg-transparent p-3 text-gray-800 outline-none focus:border-primary focus-visible:shadow-none dark:border-gray-700 dark:text-white"
            required={formData.requestType === 'check-out' || formData.requestType === 'both'}
          />
        </div>
      )}
      
      <div className="mb-6">
        <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Reason
        </label>
        <textarea
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 bg-transparent p-3 text-gray-800 outline-none focus:border-primary focus-visible:shadow-none dark:border-gray-700 dark:text-white"
          rows={3}
          placeholder="Please explain why you need to update your attendance time"
          required
        ></textarea>
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary py-3 px-6 text-center font-medium text-white hover:bg-primary/90 disabled:bg-primary/70"
      >
        {loading ? 'Submitting...' : 'Submit Request'}
      </button>
    </form>
  );
};

export default AttendanceRequestForm; 