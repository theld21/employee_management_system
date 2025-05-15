"use client";
import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import api from '@/utils/api';

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestSubmitted?: () => void;
}

const RequestModal: React.FC<RequestModalProps> = ({
  isOpen,
  onClose,
  onRequestSubmitted,
}) => {
  const [formData, setFormData] = useState({
    requestType: 'work-time',
    startDateTime: '',
    endDateTime: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Reset success and error messages when form changes
    setSuccess(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.requestType) {
      setError('Please select a request type');
      return;
    }
    
    if (!formData.startDateTime) {
      setError('Please specify the start date and time');
      return;
    }
    
    if (!formData.endDateTime) {
      setError('Please specify the end date and time');
      return;
    }
    
    if (!formData.reason) {
      setError('Please provide a reason for the request');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Sending request with data:', {
        type: formData.requestType,
        startTime: new Date(formData.startDateTime).toISOString(),
        endTime: new Date(formData.endDateTime).toISOString(),
        reason: formData.reason,
        status: 'pending'
      });
      
      // Send the request to the server using the /api/requests/create endpoint to avoid routing conflicts
      const response = await api.post('/requests/create', {
        type: formData.requestType,
        startTime: new Date(formData.startDateTime).toISOString(),
        endTime: new Date(formData.endDateTime).toISOString(),
        reason: formData.reason,
        status: 'pending'
      });
      
      console.log('Response:', response.data);
      
      // Reset form
      setFormData({
        requestType: 'work-time',
        startDateTime: '',
        endDateTime: '',
        reason: '',
      });
      
      setSuccess(true);
      
      // Notify parent component to refresh the request list
      if (onRequestSubmitted) {
        onRequestSubmitted();
      }
      
      // Close modal after successful submission
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      console.error('Full error object:', err);
      
      // More detailed error logging
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as any).response;
        console.error('Error response data:', response?.data);
        console.error('Error status:', response?.status);
        console.error('Error headers:', response?.headers);
        
        // Extract error message or show validation errors if available
        if (response?.data?.errors && Array.isArray(response.data.errors)) {
          const errorMessages = response.data.errors.map((e: any) => 
            `${e.path}: ${e.msg}`
          ).join(', ');
          setError(`Validation errors: ${errorMessages}`);
        } else if (response?.data?.message) {
          setError(response.data.message);
        } else {
          setError('Failed to create request. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[600px] p-5 lg:p-10"
    >
      <h3 className="mb-5 text-xl font-semibold text-gray-900 dark:text-white">Create New Request</h3>
      
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
            Request Type
          </label>
          <select
            name="requestType"
            value={formData.requestType}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 bg-transparent p-3 text-gray-800 outline-none focus:border-primary focus-visible:shadow-none dark:border-gray-700 dark:text-white"
            required
          >
            <option value="work-time">Work Time Update</option>
            <option value="leave-request">Leave Request</option>
            <option value="wfh-request">Work From Home Request</option>
            <option value="overtime">Overtime Request</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Start Date & Time
          </label>
          <input
            type="datetime-local"
            name="startDateTime"
            value={formData.startDateTime}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 bg-transparent p-3 text-gray-800 outline-none focus:border-primary focus-visible:shadow-none dark:border-gray-700 dark:text-white"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            End Date & Time
          </label>
          <input
            type="datetime-local"
            name="endDateTime"
            value={formData.endDateTime}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 bg-transparent p-3 text-gray-800 outline-none focus:border-primary focus-visible:shadow-none dark:border-gray-700 dark:text-white"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Reason
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-transparent p-3 text-gray-800 outline-none focus:border-primary focus-visible:shadow-none dark:border-gray-700 dark:text-white"
            placeholder="Please provide a reason for your request..."
            required
          ></textarea>
        </div>
        
        <div className="flex items-center justify-end w-full gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 rounded-lg bg-blue-500 text-sm font-medium text-white hover:bg-blue-600 focus:ring-4 focus:ring-blue-300/30 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RequestModal; 