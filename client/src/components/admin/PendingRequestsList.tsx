"use client";
import React, { useState, useEffect } from 'react';
import api from '@/utils/api';
import { Modal } from '@/components/ui/modal';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username?: string;
}

interface ProcessInfo {
  user: User;
  date: string;
  comment?: string;
  reason?: string;
}

interface Request {
  _id: string;
  type: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: number; // 1: pending, 2: confirmed, 3: approved, 4: rejected, 5: cancelled
  createdAt: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  confirmedBy?: ProcessInfo;
  approvedBy?: ProcessInfo;
  rejectedBy?: ProcessInfo;
  cancelledBy?: ProcessInfo;
}

// Constants for request status
const RequestStatus = {
  PENDING: 1,
  CONFIRMED: 2,
  APPROVED: 3,
  REJECTED: 4,
  CANCELLED: 5
} as const;

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

const getStatusText = (status: number) => {
  switch (status) {
    case RequestStatus.PENDING:
      return 'Chờ xác nhận';
    case RequestStatus.CONFIRMED:
      return 'Đã xác nhận';
    case RequestStatus.APPROVED:
      return 'Đã duyệt';
    case RequestStatus.REJECTED:
      return 'Đã từ chối';
    case RequestStatus.CANCELLED:
      return 'Đã hủy';
    default:
      return 'Không xác định';
  }
};

const getStatusColor = (status: number) => {
  switch (status) {
    case RequestStatus.PENDING:
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30';
    case RequestStatus.CONFIRMED:
      return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30';
    case RequestStatus.APPROVED:
      return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30';
    case RequestStatus.REJECTED:
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30';
    case RequestStatus.CANCELLED:
      return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30';
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30';
  }
};

const getProcessInfo = (request: Request) => {
  if (request.cancelledBy) {
    return {
      action: 'Đã hủy',
      user: `${request.cancelledBy.user.firstName} ${request.cancelledBy.user.lastName}`,
      date: formatDateTime(request.cancelledBy.date),
      note: request.cancelledBy.reason
    };
  }
  if (request.rejectedBy) {
    return {
      action: 'Đã từ chối',
      user: `${request.rejectedBy.user.firstName} ${request.rejectedBy.user.lastName}`,
      date: formatDateTime(request.rejectedBy.date),
      note: request.rejectedBy.comment
    };
  }
  if (request.approvedBy) {
    return {
      action: 'Đã duyệt',
      user: `${request.approvedBy.user.firstName} ${request.approvedBy.user.lastName}`,
      date: formatDateTime(request.approvedBy.date),
      note: request.approvedBy.comment
    };
  }
  if (request.confirmedBy) {
    return {
      action: 'Đã xác nhận',
      user: `${request.confirmedBy.user.firstName} ${request.confirmedBy.user.lastName}`,
      date: formatDateTime(request.confirmedBy.date),
      note: request.confirmedBy.comment
    };
  }
  return null;
};

interface PendingRequestsListProps {
  requestsUpdated: boolean;
  onRequestProcessed: () => void;
}

const PendingRequestsList: React.FC<PendingRequestsListProps> = ({
  requestsUpdated,
  onRequestProcessed,
}) => {
  const [pendingRequests, setPendingRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [managerType, setManagerType] = useState<'confirm' | 'approve' | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<'confirm' | 'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // For request details modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  const fetchPendingRequests = async (page = currentPage, limit = pageSize) => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching pending requests with params: page=${page}, limit=${limit}`);
      const response = await api.get(`/requests/pending?page=${page}&limit=${limit}`);
      
      console.log('API Response status:', response.status);
      const data = response.data;
      console.log('API Response data:', data);
      
      // Handle both new paginated format and old direct array format
      if (data && typeof data === 'object' && 'requests' in data && 'pagination' in data) {
        console.log('Using paginated format:', data.pagination);
        // New format with pagination
        setPendingRequests(data.requests);
        setTotalItems(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
        setCurrentPage(data.pagination.page);
        // Set manager type
        setManagerType(data.managerType || null);
      } else if (Array.isArray(data)) {
        console.log('Using array format, length:', data.length);
        // Old format (direct array of requests)
        setPendingRequests(data);
        setTotalItems(data.length);
        setTotalPages(1); 
        setCurrentPage(1);
      } else {
        console.error('Unexpected response format:', data);
        setError('Unexpected response format from server');
      }
    } catch (err) {
      console.error('Full error object:', err);
      
      if (err && typeof err === 'object' && 'response' in err) {
        const errorResponse = (err as {
          response: {
            status: number;
            data: unknown;
          }
        }).response;
        console.error('Error status:', errorResponse?.status);
        console.error('Error data:', errorResponse?.data);
      }
      
      setError('Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, [requestsUpdated]);
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    fetchPendingRequests(newPage);
  };

  // Handle page size change
  const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(event.target.value, 10);
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page
    fetchPendingRequests(1, newSize);
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
  
  const handleShowRequestDetails = (request: Request, e: React.MouseEvent) => {
    // Prevent propagation to avoid triggering row click when clicking on buttons
    e.stopPropagation();
    setSelectedRequest(request);
    setShowDetailModal(true);
  };
  
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedRequest(null);
  };

  const handleOpenModal = (requestId: string, action: 'confirm' | 'approve' | 'reject', e: React.MouseEvent) => {
    // Prevent click from propagating to the row handler
    e.stopPropagation();
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
  
  const handleApproveFromDetails = () => {
    if (selectedRequest) {
      setCurrentRequestId(selectedRequest._id);
      setCurrentAction('approve');
      setComment('');
      setModalError(null);
      closeDetailModal();
      setShowCommentModal(true);
    }
  };
  
  const handleRejectFromDetails = () => {
    if (selectedRequest) {
      setCurrentRequestId(selectedRequest._id);
      setCurrentAction('reject');
      setComment('');
      setModalError(null);
      closeDetailModal();
      setShowCommentModal(true);
    }
  };

  const getActionButtonText = (request: Request) => {
    // Nếu là manager confirm và request đang pending
    if (managerType === 'confirm' && request.status === 1) {
      return 'Xác nhận';
    }
    // Nếu là manager approve và request đã confirmed
    if (managerType === 'approve' && request.status === 2) {
      return 'Duyệt';
    }
    return '';
  };

  const canProcessRequest = (request: Request) => {
    // Manager confirm chỉ có thể xử lý request pending
    if (managerType === 'confirm') {
      return request.status === 1; // PENDING
    }
    // Manager approve chỉ có thể xử lý request confirmed
    if (managerType === 'approve') {
      return request.status === 2; // CONFIRMED
    }
    return false;
  };

  const getActionForRequest = (request: Request) => {
    if (managerType === 'confirm' && request.status === 1) {
      return 'confirm';
    }
    if (managerType === 'approve' && request.status === 2) {
      return 'approve';
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-gray-800 dark:bg-gray-900/50">
      <h3 className="mb-5 text-xl font-semibold text-gray-900 dark:text-white">
        {managerType === 'confirm' ? 'Yêu cầu chờ xác nhận' : 'Yêu cầu chờ duyệt'}
      </h3>
      
      {successMessage && (
        <div className="mb-4 rounded-lg bg-green-100 px-4 py-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
          {successMessage}
        </div>
      )}
      
      {loading && pendingRequests.length === 0 ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      ) : pendingRequests.length === 0 ? (
        <div className="rounded-lg bg-gray-100 px-4 py-8 text-center text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          Không có yêu cầu chờ duyệt.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Ngày</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Người dùng</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Loại</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Thời gian</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((request) => (
                  <tr 
                    key={request._id} 
                    className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50 cursor-pointer"
                    onClick={(e) => handleShowRequestDetails(request, e)}
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
                        <span className="font-medium">Từ:</span> {formatDateTime(request.startTime)}
                        </div>
                        <div>
                        <span className="font-medium">Đến:</span> {formatDateTime(request.endTime)}
                        </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {canProcessRequest(request) && (
                          <>
                            <button
                              onClick={(e) => {
                                const action = getActionForRequest(request);
                                if (action) {
                                  handleOpenModal(request._id, action, e);
                                }
                              }}
                              disabled={processingRequest === request._id}
                              className="px-3 py-1.5 rounded-lg bg-green-500 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
                            >
                              {getActionButtonText(request)}
                            </button>
                            <button
                              onClick={(e) => handleOpenModal(request._id, 'reject', e)}
                              disabled={processingRequest === request._id}
                              className="px-3 py-1.5 rounded-lg bg-red-500 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
                            >
                              Từ chối
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination UI */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="page-size" className="text-sm text-gray-500 dark:text-gray-400">
                Hiển thị:
              </label>
              <select
                id="page-size"
                value={pageSize}
                onChange={handlePageSizeChange}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
              </select>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                của {totalItems} mục
              </span>
            </div>

            <div className="flex items-center justify-center space-x-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              >
                <span className="sr-only">Trang đầu</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="11 17 6 12 11 7"></polyline>
                  <polyline points="18 17 13 12 18 7"></polyline>
                </svg>
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              >
                <span className="sr-only">Trang trước</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              
              <span className="mx-2 inline-flex text-sm font-medium text-gray-700 dark:text-gray-300">
                Trang {currentPage} của {totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              >
                <span className="sr-only">Trang tiếp</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              >
                <span className="sr-only">Trang cuối</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="13 17 18 12 13 7"></polyline>
                  <polyline points="6 17 11 12 6 7"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Comment Modal */}
      <Modal 
        isOpen={showCommentModal} 
        onClose={handleCloseModal}
        className="max-w-[500px] p-5 lg:p-8"
      >
        <h4 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
          {currentAction === 'approve' ? 'Duyệt yêu cầu' : 
           currentAction === 'confirm' ? 'Xác nhận yêu cầu' : 'Từ chối yêu cầu'}
        </h4>
        
        {modalError && (
          <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {modalError}
          </div>
        )}
        
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Ghi chú (Tùy chọn)
          </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-transparent p-3 text-gray-800 outline-none focus:border-primary focus-visible:shadow-none dark:border-gray-700 dark:text-white"
            placeholder={`Thêm ghi chú về lý do ${currentAction === 'approve' ? 'duyệt' : 'từ chối'} yêu cầu...`}
            rows={3}
          ></textarea>
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={handleCloseModal}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Hủy
          </button>
          <button
            onClick={handleProcessRequest}
            disabled={!!processingRequest}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
              currentAction === 'reject' 
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-500 hover:bg-green-600'
            } disabled:opacity-70`}
          >
            {processingRequest 
              ? 'Đang xử lý...' 
              : currentAction === 'approve'
                ? 'Duyệt'
                : currentAction === 'confirm'
                  ? 'Xác nhận'
                  : 'Từ chối'
            }
          </button>
        </div>
      </Modal>
      
      {/* Request Details Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={closeDetailModal}
        className="max-w-[600px] p-5 lg:p-8"
      >
        {selectedRequest && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Chi tiết yêu cầu
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Loại yêu cầu</h4>
                <p className="text-gray-800 dark:text-gray-300">{formatRequestType(selectedRequest.type)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Ngày gửi</h4>
                <p className="text-gray-800 dark:text-gray-300">{formatDate(selectedRequest.createdAt)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Người gửi</h4>
                <p className="text-gray-800 dark:text-gray-300">
                  {selectedRequest.user.firstName} {selectedRequest.user.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{selectedRequest.user.email}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Trạng thái</h4>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                  {getStatusText(selectedRequest.status)}
                </span>
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Thời gian</h4>
              <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-800 dark:text-gray-300">
                  <span className="font-medium">Từ:</span> {formatDateTime(selectedRequest.startTime)}
                </p>
                <p className="text-gray-800 dark:text-gray-300">
                  <span className="font-medium">Đến:</span> {formatDateTime(selectedRequest.endTime)}
                </p>
          </div>
        </div>
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Lý do</h4>
              <p className="text-gray-800 dark:text-gray-300 mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">{selectedRequest.reason}</p>
            </div>
            
            {/* Add Process Info */}
            {getProcessInfo(selectedRequest) && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Thông tin xử lý</h4>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-gray-800 dark:text-gray-300">
                    <span className="font-medium">Hành động:</span> {getProcessInfo(selectedRequest)?.action}
                  </p>
                  <p className="text-gray-800 dark:text-gray-300">
                    <span className="font-medium">Người xử lý:</span> {getProcessInfo(selectedRequest)?.user}
                  </p>
                  <p className="text-gray-800 dark:text-gray-300">
                    <span className="font-medium">Thời gian:</span> {getProcessInfo(selectedRequest)?.date}
                  </p>
                  {getProcessInfo(selectedRequest)?.note && (
                    <p className="text-gray-800 dark:text-gray-300">
                      <span className="font-medium">Ghi chú:</span> {getProcessInfo(selectedRequest)?.note}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeDetailModal}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Đóng
              </button>
              {canProcessRequest(selectedRequest) && (
                <>
                  <button
                    onClick={handleRejectFromDetails}
                    className="px-4 py-2 rounded-lg bg-red-500 text-sm font-medium text-white hover:bg-red-600"
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={handleApproveFromDetails}
                    className="px-4 py-2 rounded-lg bg-green-500 text-sm font-medium text-white hover:bg-green-600"
                  >
                    {getActionButtonText(selectedRequest)}
                  </button>
                </>
              )}
            </div>
        </div>
      )}
      </Modal>
    </div>
  );
};

export default PendingRequestsList; 