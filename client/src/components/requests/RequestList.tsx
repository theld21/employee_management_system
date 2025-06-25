"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';
import { useModal } from '@/hooks/useModal';
import RequestModal from './RequestModal';
import { Modal } from '@/components/ui/modal';
import RequestStatus from '@/constants/requestStatus';

interface Request {
  _id: string;
  type: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: number;
  createdAt: string;
  confirmedBy?: {
    user: {
      firstName: string;
      lastName: string;
    };
    date: string;
    comment: string;
  };
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  
  // For request details modal
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  // Simplify cancellation state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const fetchRequests = async (page = currentPage, limit = pageSize) => {
    if (!token) return;
    
    setLoading(true);
    try {
      console.log(`Fetching requests with params: page=${page}, limit=${limit}`);
      const response = await api.get(`/requests/my?page=${page}&limit=${limit}`);
      
      console.log('API Response status:', response.status);
      const data = response.data;
      console.log('API Response data:', data);
      
      // Handle both new paginated format and old direct array format
      if (data && typeof data === 'object' && 'requests' in data && 'pagination' in data) {
        console.log('Using paginated format:', data.pagination);
        // New format with pagination
        setRequests(data.requests);
        setTotalItems(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
        setCurrentPage(data.pagination.page);
      } else if (Array.isArray(data)) {
        console.log('Using array format, length:', data.length);
        // Old format (direct array of requests)
        setRequests(data);
        setTotalItems(data.length);
        setTotalPages(1);
        setCurrentPage(1);
      } else {
        console.error('Unexpected response format:', data);
        setError('Unexpected response format from server');
      }
    } catch (err: unknown) {
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
      
      setError('Error fetching requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    fetchRequests(newPage);
  };

  // Handle page size change
  const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(event.target.value, 10);
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page
    fetchRequests(1, newSize);
  };

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

  const getStatusBadgeClass = (status: number) => {
    switch (status) {
      case RequestStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case RequestStatus.CONFIRMED:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case RequestStatus.APPROVED:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case RequestStatus.REJECTED:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case RequestStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatRequestType = (type: string) => {
    switch (type) {
      case 'work-time':
        return 'Cập nhật giờ làm';
      case 'leave-request':
        return 'Nghỉ phép';
      case 'wfh-request':
        return 'Làm việc từ xa';
      case 'overtime':
        return 'Làm thêm giờ';
      default:
        return type;
    }
  };

  const formatStatus = (status: number) => {
    switch (status) {
      case RequestStatus.PENDING:
        return 'Chờ xác nhận';
      case RequestStatus.CONFIRMED:
        return 'Đã xác nhận';
      case RequestStatus.APPROVED:
        return 'Đã duyệt';
      case RequestStatus.REJECTED:
        return 'Từ chối';
      case RequestStatus.CANCELLED:
        return 'Đã hủy';
      default:
        return 'Không xác định';
    }
  };

  // Simplified cancel request handler
  const handleCancelRequest = async () => {
    if (!selectedRequest) return;
    
    // Đảm bảo chỉ request ở trạng thái pending mới có thể bị hủy
    if (selectedRequest.status !== RequestStatus.PENDING) {
      setCancelError('Chỉ yêu cầu đang chờ mới có thể bị hủy');
      return;
    }
    
    setCancelLoading(true);
    setCancelError(null);
    
    try {
      // Use the original cancel endpoint with a default reason
      await api.put(`/requests/cancel/${selectedRequest._id}`, {
        reason: "Yêu cầu đã bị hủy bởi người dùng"
      });
      
      // Đóng modal chi tiết request
      closeDetailModal();
      
      // Tải lại danh sách requests
      fetchRequests();
      
    } catch (err: unknown) {
      console.error('Error cancelling request:', err);
      // Use type assertion to safely access response data
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response: { data?: { message?: string } } }).response;
        setCancelError(response?.data?.message || 'Failed to cancel request');
      } else {
        setCancelError('Failed to cancel request');
      }
      setCancelLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-gray-800 dark:bg-gray-900/50">
      <div className="mb-5 flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Yêu cầu của tôi</h3>
        <button
          onClick={handleCreateRequest}
          className="px-4 py-2.5 rounded-lg bg-blue-500 text-sm font-medium text-white hover:bg-blue-600 focus:ring-4 focus:ring-blue-300/30"
        >
          Tạo yêu cầu
        </button>
      </div>
      
      {loading && requests.length === 0 ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-lg bg-gray-100 px-4 py-8 text-center text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          Bạn không có yêu cầu nào.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Ngày</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Loại</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Thời gian</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Trạng thái</th>
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
                Chi tiết yêu cầu
              </h3>
              <span 
                className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium mt-2 ${getStatusBadgeClass(selectedRequest.status)}`}
              >
                {formatStatus(selectedRequest.status)}
              </span>
            </div>
            
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
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Thời gian bắt đầu</h4>
                <p className="text-gray-800 dark:text-gray-300">{formatDateTime(selectedRequest.startTime)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Thời gian kết thúc</h4>
                <p className="text-gray-800 dark:text-gray-300">{formatDateTime(selectedRequest.endTime)}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Lý do</h4>
              <p className="text-gray-800 dark:text-gray-300 mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">{selectedRequest.reason}</p>
            </div>
            
            {selectedRequest.status === RequestStatus.CONFIRMED && selectedRequest.confirmedBy && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400">Thông tin xác nhận</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  <span className="font-medium">Xác nhận bởi:</span> {selectedRequest.confirmedBy.user.firstName} {selectedRequest.confirmedBy.user.lastName}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Xác nhận vào:</span> {formatDateTime(selectedRequest.confirmedBy.date)}
                </p>
                {selectedRequest.confirmedBy.comment && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    <span className="font-medium">Ghi chú:</span> {selectedRequest.confirmedBy.comment}
                  </p>
                )}
              </div>
            )}
            
            {selectedRequest.status === RequestStatus.APPROVED && selectedRequest.approvedBy && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-green-700 dark:text-green-400">Thông tin phê duyệt</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  <span className="font-medium">Phê duyệt bởi:</span> {selectedRequest.approvedBy.user.firstName} {selectedRequest.approvedBy.user.lastName}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Phê duyệt vào:</span> {formatDateTime(selectedRequest.approvedBy.date)}
                </p>
                {selectedRequest.approvedBy.comment && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    <span className="font-medium">Ghi chú:</span> {selectedRequest.approvedBy.comment}
                  </p>
                )}
              </div>
            )}
            
            {selectedRequest.status === RequestStatus.REJECTED && selectedRequest.rejectedBy && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-red-700 dark:text-red-400">Thông tin từ chối</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  <span className="font-medium">Từ chối bởi:</span> {selectedRequest.rejectedBy.user.firstName} {selectedRequest.rejectedBy.user.lastName}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Từ chối vào:</span> {formatDateTime(selectedRequest.rejectedBy.date)}
                </p>
                {selectedRequest.rejectedBy.comment && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    <span className="font-medium">Lý do:</span> {selectedRequest.rejectedBy.comment}
                  </p>
                )}
              </div>
            )}
            
            {selectedRequest.status === RequestStatus.CANCELLED && selectedRequest.cancelledBy && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-red-700 dark:text-red-400">Thông tin hủy</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  <span className="font-medium">Hủy bởi:</span> {
                    selectedRequest.cancelledBy.user && selectedRequest.cancelledBy.user.firstName 
                    ? `${selectedRequest.cancelledBy.user.firstName} ${selectedRequest.cancelledBy.user.lastName}`
                    : 'You'
                  }
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Hủy vào:</span> {formatDateTime(selectedRequest.cancelledBy.date)}
                </p>
                {selectedRequest.cancelledBy.reason && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    <span className="font-medium">Lý do:</span> {selectedRequest.cancelledBy.reason}
                  </p>
                )}
              </div>
            )}
            
            {/* Show cancel button only for pending requests */}
            {selectedRequest && selectedRequest.status === RequestStatus.PENDING && !showCancelConfirm && (
              <div className="mt-6 flex items-center justify-end">
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="px-4 py-2.5 rounded-lg bg-red-500 text-sm font-medium text-white hover:bg-red-600 focus:ring-4 focus:ring-red-300/30"
                >
                  Hủy yêu cầu
                </button>
              </div>
            )}
            
            {/* Confirmation dialog for cancellation */}
            {selectedRequest && selectedRequest.status === RequestStatus.PENDING && showCancelConfirm && (
              <div className="mt-6">
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    Bạn có chắc chắn muốn hủy yêu cầu này? Hành động này không thể được hoàn tác.
                  </p>
                </div>
                
                {cancelError && (
                  <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    {cancelError}
                  </div>
                )}
                
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    disabled={cancelLoading}
                  >
                    Không, giữ yêu cầu
                  </button>
                  <button
                    onClick={handleCancelRequest}
                    className="px-4 py-2.5 rounded-lg bg-red-500 text-sm font-medium text-white hover:bg-red-600 focus:ring-4 focus:ring-red-300/30 disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={cancelLoading}
                  >
                    {cancelLoading ? 'Đang hủy...' : 'Có, hủy yêu cầu'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RequestList;