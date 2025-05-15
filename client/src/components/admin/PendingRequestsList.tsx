"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';
import { Modal } from '@/components/ui/modal';

interface Request {
  _id: string;
  type: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: string;
  createdAt: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
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
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/requests/pending');
        setPendingRequests(response.data);
      } catch (err) {
        console.error('Error fetching pending requests:', err);
        setError('Failed to load pending requests');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPendingRequests();
  }, [requestsUpdated]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
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

  const handleOpenModal = (requestId: string, action: 'approve' | 'reject') => {
    setCurrentRequestId(requestId);
    setCurrentAction(action);
    setComment('');
    setModalError(null);
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
      await api.put(`/requests/${currentRequestId}`, {
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
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error processing request:', error);
      setModalError('Failed to process the request');
    } finally {
      setProcessingRequest(null);
    }
  };

  if (!user || !['admin', 'manager', 'level1', 'level2'].includes(user.role)) {
    return (
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-gray-800 dark:bg-gray-900/50">
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-gray-800 dark:bg-gray-900/50">
      <h3 className="mb-5 text-xl font-semibold text-gray-900 dark:text-white">Pending Requests</h3>
      
      {successMessage && (
        <div className="mb-4 rounded-lg bg-green-100 px-4 py-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
          {successMessage}
        </div>
      )}
      
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
          No pending requests to review.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Time Period</th>
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
                    {formatDate(request.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-300">
                    {request.user.firstName} {request.user.lastName}
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {request.user.email}
                    </div>
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
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-300 max-w-[200px]">
                    <div className="line-clamp-2">
                      {request.reason}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(request._id, 'approve')}
                        disabled={processingRequest === request._id}
                        className="px-3 py-1.5 rounded-lg bg-green-500 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleOpenModal(request._id, 'reject')}
                        disabled={processingRequest === request._id}
                        className="px-3 py-1.5 rounded-lg bg-red-500 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Comment Modal */}
      <Modal 
        isOpen={showCommentModal} 
        onClose={handleCloseModal}
        className="max-w-[500px] p-5 lg:p-8"
      >
        <h4 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
          {currentAction === 'approve' ? 'Approve Request' : 'Reject Request'}
        </h4>
        
        {modalError && (
          <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {modalError}
          </div>
        )}
        
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Comment (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-transparent p-3 text-gray-800 outline-none focus:border-primary focus-visible:shadow-none dark:border-gray-700 dark:text-white"
            placeholder={`Add a comment about why you're ${currentAction === 'approve' ? 'approving' : 'rejecting'} this request...`}
            rows={3}
          ></textarea>
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={handleCloseModal}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleProcessRequest}
            disabled={!!processingRequest}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
              currentAction === 'approve' 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-red-500 hover:bg-red-600'
            } disabled:opacity-70`}
          >
            {processingRequest 
              ? 'Processing...' 
              : currentAction === 'approve' 
                ? 'Approve' 
                : 'Reject'
            }
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default PendingRequestsList; 