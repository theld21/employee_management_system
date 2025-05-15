"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';
import { useModal } from '@/hooks/useModal';
import RequestModal from './RequestModal';

interface AttendanceRequest {
  _id: string;
  requestType: 'check-in' | 'check-out' | 'both';
  currentCheckIn?: string;
  currentCheckOut?: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
  status: 'pending' | 'approved-level2' | 'approved' | 'rejected-level2' | 'rejected-level1';
  createdAt: string;
  approvalLevel2?: {
    user: {
      firstName: string;
      lastName: string;
    };
    date: string;
    comment?: string;
  };
  approvalLevel1?: {
    user: {
      firstName: string;
      lastName: string;
    };
    date: string;
    comment?: string;
  };
}

const RequestList: React.FC = () => {
  const { token } = useAuth();
  const [requests, setRequests] = useState<AttendanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, openModal, closeModal } = useModal();

  const fetchRequests = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await api.get('/requests/my');
      setRequests(response.data);
    } catch (err) {
      setError('Error fetching requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const handleCreateRequest = () => {
    openModal();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'approved-level2':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected-level2':
      case 'rejected-level1':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'approved-level2':
        return 'Approved by L2 Manager';
      case 'approved':
        return 'Approved';
      case 'rejected-level2':
        return 'Rejected by L2 Manager';
      case 'rejected-level1':
        return 'Rejected by L1 Manager';
      default:
        return status;
    }
  };

  return (
    <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-gray-800 dark:bg-gray-900/50">
      <div className="mb-5 flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">My Requests</h3>
        <button
          onClick={handleCreateRequest}
          className="px-4 py-2.5 rounded-lg bg-blue-500 text-sm font-medium text-white hover:bg-blue-600 focus:ring-4 focus:ring-blue-300/30"
        >
          Create Request
        </button>
      </div>
      
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-lg bg-gray-100 px-4 py-8 text-center text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          You don&apos;t have any attendance correction requests.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Requested Times</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr 
                  key={request._id} 
                  className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-300">
                    {formatDate(request.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-300">
                    {request.requestType === 'check-in' 
                      ? 'Check-in' 
                      : request.requestType === 'check-out' 
                      ? 'Check-out' 
                      : 'Check-in & Check-out'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-300">
                    {request.requestType === 'check-in' || request.requestType === 'both' ? (
                      <div>
                        <span className="font-medium">In:</span> {formatTime(request.requestedCheckIn)}
                      </div>
                    ) : null}
                    
                    {request.requestType === 'check-out' || request.requestType === 'both' ? (
                      <div>
                        <span className="font-medium">Out:</span> {formatTime(request.requestedCheckOut)}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span 
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(request.status)}`}
                    >
                      {formatStatus(request.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Request Modal */}
      <RequestModal 
        isOpen={isOpen}
        onClose={closeModal}
      />
    </div>
  );
};

export default RequestList; 