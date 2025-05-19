"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';
import { useModal } from '@/hooks/useModal';
import RequestModal from './RequestModal';
import { Modal } from '@/components/ui/modal';

interface Request {
  _id: string;
  type: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: string;
  createdAt: string;
  approvedBy?: {
    user: {
      firstName: string;
      lastName: string;
    };
    date: string;
    comment: string;
  };
  rejectedBy?: {
    user: {
      firstName: string;
      lastName: string;
    };
    date: string;
    comment: string;
  };
  cancelledBy?: {
    user: {
      firstName: string;
      lastName: string;
    };
    date: string;
    reason: string;
  };
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

const RequestList: React.FC = () => {
  const { token } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, openModal, closeModal } = useModal();
  
  // For request details modal
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  // Simplify cancellation state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const fetchRequests = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await api.get('/requests/my');
      setRequests(response.data);
    } catch (err: unknown) {
      setError('Error fetching requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  // Thêm useEffect để log thông tin request được chọn
  useEffect(() => {
    if (selectedRequest && selectedRequest.status === 'cancelled' && selectedRequest.cancelledBy) {
      console.log('Selected Request:', selectedRequest);
      console.log('Cancelled By:', selectedRequest.cancelledBy);
    }
  }, [selectedRequest]);

  const handleCreateRequest = () => {
    openModal();
  };

  const handleRequestSubmitted = () => {
    fetchRequests();
  };
  
  const handleShowRequestDetails = (request: Request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };
  
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedRequest(null);
    setShowCancelConfirm(false);
    setCancelError(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatRequestType = (type: string) => {
    switch (type) {
      case 'work-time':
        return 'Work Time Update';
      case 'leave-request':
        return 'Leave Request';
      case 'wfh-request':
        return 'Work From Home';
      case 'overtime':
        return 'Overtime';
      default:
        return type;
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  // Simplified cancel request handler
  const handleCancelRequest = async () => {
    if (!selectedRequest) return;
    
    // Đảm bảo chỉ request ở trạng thái pending mới có thể bị hủy
    if (selectedRequest.status !== 'pending') {
      setCancelError('Only pending requests can be cancelled');
      return;
    }
    
    setCancelLoading(true);
    setCancelError(null);
    
    try {
      // Use the original cancel endpoint with a default reason
      const response = await api.put(`/requests/cancel/${selectedRequest._id}`, {
        reason: "Request cancelled by user"
      });
      
      // Xử lý cấu trúc phản hồi mới
      const updatedRequest = response.data.data || response.data;
      
      // Update the local state with the response data
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req._id === selectedRequest._id ? { ...updatedRequest } : req
        )
      );
      
      // Update the selected request view with the response data
      setSelectedRequest(updatedRequest);
      
      // Hide the cancel confirmation
      setShowCancelConfirm(false);
      
    } catch (err: unknown) {
      console.error('Error cancelling request:', err);
      // Use type assertion to safely access response data
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response: { data?: { message?: string } } }).response;
        setCancelError(response?.data?.message || 'Failed to cancel request');
      } else {
        setCancelError('Failed to cancel request');
      }
    } finally {
      setCancelLoading(false);
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
          You don&apos;t have any requests.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Time Period</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr 
                  key={request._id} 
                  className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50 cursor-pointer"
                  onClick={() => handleShowRequestDetails(request)}
                >
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-300">
                    {formatDate(request.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-300">
                    {formatRequestType(request.type)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-300">
                    <div>
                      <span className="font-medium">From:</span> {formatDateTime(request.startTime)}
                    </div>
                    <div>
                      <span className="font-medium">To:</span> {formatDateTime(request.endTime)}
                    </div>
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

      {/* Request Creation Modal */}
      <RequestModal 
        isOpen={isOpen}
        onClose={closeModal}
        onRequestSubmitted={handleRequestSubmitted}
      />
      
      {/* Request Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={closeDetailModal}
        className="max-w-[600px] p-5 lg:p-8"
      >
        {selectedRequest && (
          <div>
            <div className="items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Request Details
              </h3>
              <span 
                className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium mt-2 ${getStatusBadgeClass(selectedRequest.status)}`}
              >
                {formatStatus(selectedRequest.status)}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Request Type</h4>
                <p className="text-gray-800 dark:text-gray-300">{formatRequestType(selectedRequest.type)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Submission Date</h4>
                <p className="text-gray-800 dark:text-gray-300">{formatDate(selectedRequest.createdAt)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Time</h4>
                <p className="text-gray-800 dark:text-gray-300">{formatDateTime(selectedRequest.startTime)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">End Time</h4>
                <p className="text-gray-800 dark:text-gray-300">{formatDateTime(selectedRequest.endTime)}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Reason</h4>
              <p className="text-gray-800 dark:text-gray-300 mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">{selectedRequest.reason}</p>
            </div>
            
            {selectedRequest.status === 'approved' && selectedRequest.approvedBy && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-green-700 dark:text-green-400">Approved Information</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  <span className="font-medium">Approved by:</span> {selectedRequest.approvedBy.user.firstName} {selectedRequest.approvedBy.user.lastName}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Approved on:</span> {formatDateTime(selectedRequest.approvedBy.date)}
                </p>
                {selectedRequest.approvedBy.comment && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    <span className="font-medium">Comment:</span> {selectedRequest.approvedBy.comment}
                  </p>
                )}
              </div>
            )}
            
            {selectedRequest.status === 'rejected' && selectedRequest.rejectedBy && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-red-700 dark:text-red-400">Rejection Information</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  <span className="font-medium">Rejected by:</span> {selectedRequest.rejectedBy.user.firstName} {selectedRequest.rejectedBy.user.lastName}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Rejected on:</span> {formatDateTime(selectedRequest.rejectedBy.date)}
                </p>
                {selectedRequest.rejectedBy.comment && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    <span className="font-medium">Reason:</span> {selectedRequest.rejectedBy.comment}
                  </p>
                )}
              </div>
            )}
            
            {selectedRequest.status === 'cancelled' && selectedRequest.cancelledBy && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-red-700 dark:text-red-400">Cancellation Information</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  <span className="font-medium">Cancelled by:</span> {
                    selectedRequest.cancelledBy.user && selectedRequest.cancelledBy.user.firstName 
                    ? `${selectedRequest.cancelledBy.user.firstName} ${selectedRequest.cancelledBy.user.lastName}`
                    : ''
                  }
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Cancelled on:</span> {formatDateTime(selectedRequest.cancelledBy.date)}
                </p>
                {selectedRequest.cancelledBy.reason && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    <span className="font-medium">Reason:</span> {selectedRequest.cancelledBy.reason}
                  </p>
                )}
              </div>
            )}
            
            {/* Add the cancel button only for pending requests */}
            <div className="flex justify-end mt-6">
              {selectedRequest && selectedRequest.status === 'pending' && !showCancelConfirm && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="px-4 py-2 mr-2 rounded-lg bg-red-500 text-white hover:bg-red-600 focus:ring-4 focus:ring-red-300/30"
                >
                  Cancel Request
                </button>
              )}
              
              {/* Cancel confirmation tooltip */}
              {showCancelConfirm && (
                <div className="flex items-center mr-2">
                  <button
                    onClick={handleCancelRequest}
                    disabled={cancelLoading}
                    className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 focus:ring-4 focus:ring-red-300/30 disabled:opacity-70 mr-1"
                  >
                    {cancelLoading ? '...' : 'Confirm cancel request'}
                  </button>
                </div>
              )}
              
              <button
                onClick={closeDetailModal}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
            
            {/* Show error if cancellation fails */}
            {cancelError && (
              <div className="mt-4 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {cancelError}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RequestList;