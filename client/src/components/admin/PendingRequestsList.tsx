"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';

interface Attendance {
  _id: string;
  date: string;
  checkIn?: {
    time: string;
  };
  checkOut?: {
    time: string;
  };
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
}

interface AttendanceRequest {
  _id: string;
  user: User;
  attendance: Attendance;
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

interface PendingRequestsListProps {
  requestsUpdated: boolean;
  onRequestProcessed: () => void;
}

const PendingRequestsList: React.FC<PendingRequestsListProps> = ({
  requestsUpdated,
  onRequestProcessed,
}) => {
  const { user, token } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<AttendanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [currentAction, setCurrentAction] = useState<'approve' | 'reject' | null>(null);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      setLoading(true);
      try {
        const response = await api.get('/requests/pending');
        setPendingRequests(response.data);
      } catch (error) {
        console.error('Error fetching pending requests:', error);
        setError('Failed to load pending requests');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingRequests();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleActionClick = (requestId: string, action: 'approve' | 'reject') => {
    setCurrentRequestId(requestId);
    setCurrentAction(action);
    setComment('');
    setShowCommentModal(true);
  };

  const handleCloseModal = () => {
    setShowCommentModal(false);
    setCurrentRequestId(null);
    setCurrentAction(null);
    setComment('');
  };

  const handleProcessRequest = async () => {
    setProcessingRequest(currentRequestId);
    try {
      const endpoint = user?.role === 'level1' 
        ? `/requests/level1/${currentRequestId}`
        : `/requests/level2/${currentRequestId}`;
        
      const response = await api.put(endpoint, {
        action: currentAction,
        comment: comment
      });
      
      // Update the requests list
      setPendingRequests(prev => 
        prev.filter(req => req._id !== currentRequestId)
      );
      onRequestProcessed();
      handleCloseModal();
      setSuccessMessage(`Request ${currentAction === 'approve' ? 'approved' : 'rejected'} successfully`);
    } catch (error) {
      console.error('Error processing request:', error);
      setModalError('Failed to process the request');
    } finally {
      setProcessingRequest(null);
    }
  };

  return (
    <div>
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      ) : pendingRequests.length === 0 ? (
        <div className="rounded-lg bg-gray-100 px-4 py-8 text-center text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          No pending requests to review at this time.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Employee</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Request Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Current/Requested Times</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Reason</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map((request) => (
                <tr 
                  key={request._id} 
                  className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-300">
                    {`${request.user.firstName} ${request.user.lastName}`}
                    <div className="text-xs text-gray-500 dark:text-gray-400">{request.user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-300">
                    {formatDate(request.attendance.date)}
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
                      <div className="mb-1">
                        <div><span className="font-medium">Current In:</span> {formatTime(request.currentCheckIn)}</div>
                        <div><span className="font-medium">Requested In:</span> {formatTime(request.requestedCheckIn)}</div>
                      </div>
                    ) : null}
                    
                    {request.requestType === 'check-out' || request.requestType === 'both' ? (
                      <div>
                        <div><span className="font-medium">Current Out:</span> {formatTime(request.currentCheckOut)}</div>
                        <div><span className="font-medium">Requested Out:</span> {formatTime(request.requestedCheckOut)}</div>
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-300">
                    {request.reason}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleActionClick(request._id, 'approve')}
                        disabled={processingRequest === request._id}
                        className="rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {processingRequest === request._id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleActionClick(request._id, 'reject')}
                        disabled={processingRequest === request._id}
                        className="rounded-lg bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {processingRequest === request._id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCommentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Add Comment
            </h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mb-4 w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
              placeholder="Optional comment..."
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCloseModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessRequest}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-green-700 dark:text-green-400">
              {successMessage}
            </h3>
            <button
              onClick={() => {
                setSuccessMessage(null);
                setModalError(null);
              }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {modalError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-red-700 dark:text-red-400">
              {modalError}
            </h3>
            <button
              onClick={() => {
                setSuccessMessage(null);
                setModalError(null);
              }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingRequestsList; 