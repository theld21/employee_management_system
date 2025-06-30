"use client";
import React, { useState, useEffect } from 'react';
import api from '@/utils/api';
import { Modal } from '@/components/ui/modal';
import {
  type Request,
  formatDate,
  formatDateTime,
  formatRequestType,
  formatStatus,
  getStatusBadgeClass,
  getProcessInfo
} from '@/utils/requestHelpers';

interface PendingRequestsListProps {
  requestsUpdated: boolean;
  onRequestProcessed: () => void;
}

// Constants for request status
const RequestStatus = {
  PENDING: 1,
  CONFIRMED: 2,
  APPROVED: 3,
  REJECTED: 4,
  CANCELLED: 5
} as const;

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
    closeDetailModal();
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
                        <span className="font-medium"><span className="inline-block w-10">Từ:</span> {formatDateTime(request.startTime)}</span>
                      </div>
                      <div>
                        <span className="font-medium"><span className="inline-block w-10">Đến:</span> {formatDateTime(request.endTime)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(request.status)}`}>
                        {formatStatus(request.status)}
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
        className="max-w-[500px] dark:bg-gray-900"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
              {currentAction === 'approve' ? 'Duyệt yêu cầu' :
                currentAction === 'confirm' ? 'Xác nhận yêu cầu' : 'Từ chối yêu cầu'}
            </h4>
            <button
              onClick={handleCloseModal}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
            >
              <span className="sr-only">Đóng</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {modalError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/50 dark:border-red-800">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400 dark:text-red-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{modalError}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ghi chú (Tùy chọn)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 shadow-sm p-3 focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white sm:text-sm disabled:opacity-50"
              placeholder={`Thêm ghi chú về lý do ${currentAction === 'approve' ? 'duyệt' : currentAction === 'confirm' ? 'xác nhận' : 'từ chối'} yêu cầu...`}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleCloseModal}
              disabled={!!processingRequest}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={handleProcessRequest}
              disabled={!!processingRequest}
              className={`inline-flex justify-center px-4 py-2 rounded-lg text-sm font-medium text-white ${currentAction === 'reject'
                ? 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                : 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700'
                } disabled:opacity-50`}
            >
              {processingRequest ? (
                <>
                  <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang xử lý...
                </>
              ) : currentAction === 'approve' ? 'Duyệt' :
                currentAction === 'confirm' ? 'Xác nhận' : 'Từ chối'
              }
            </button>
          </div>
        </div>
      </Modal>

      {/* Request Details Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={closeDetailModal}
        className="max-w-[600px] dark:bg-gray-900"
      >
        {selectedRequest && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Chi tiết yêu cầu
              </h3>
              <button
                onClick={closeDetailModal}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              >
                <span className="sr-only">Đóng</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Người yêu cầu</div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {selectedRequest.user.firstName} {selectedRequest.user.lastName}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Loại yêu cầu</div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {formatRequestType(selectedRequest.type)}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Thời gian bắt đầu</div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {new Date(selectedRequest.startTime).toLocaleString()}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Thời gian kết thúc</div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {new Date(selectedRequest.endTime).toLocaleString()}
                  </div>
                </div>

                {selectedRequest.type === 'leave-request' && (
                  <>
                    <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Số ngày nghỉ</div>
                      <div className="text-gray-900 dark:text-white font-medium">
                        {(selectedRequest.leaveDays ?? 0).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ngày
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Số ngày phép còn lại</div>
                      <div className="text-gray-900 dark:text-white font-medium">
                        {(selectedRequest.user.leaveDays ?? 0).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ngày
                      </div>
                    </div>

                    {(selectedRequest.user.leaveDays ?? 0) < (selectedRequest.leaveDays ?? 0) && (
                      <div className="col-span-2 p-4 bg-red-50 rounded-lg dark:bg-red-900/30">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-700 dark:text-red-300">
                              Người dùng không còn đủ ngày phép để thực hiện yêu cầu này
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Lý do</div>
                <div className="text-gray-900 dark:text-white whitespace-pre-wrap">
                  {selectedRequest.reason}
                </div>
              </div>

              {/* Process Info */}
              {getProcessInfo(selectedRequest) && (
                <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">Thông tin xử lý</div>
                  <div className="space-y-2">
                    {selectedRequest?.confirmedBy && (
                      <div className="text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">({new Date(selectedRequest.confirmedBy.date).toLocaleString('vi-VN')})</span>
                        <span className="font-medium">{selectedRequest.confirmedBy.user.firstName} {selectedRequest.confirmedBy.user.lastName}</span>
                        <span className={getStatusBadgeClass(RequestStatus.CONFIRMED)}>
                          {formatStatus(RequestStatus.CONFIRMED)}
                        </span>
                        {selectedRequest.confirmedBy.comment && (
                          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
                            Ghi chú: {selectedRequest.confirmedBy.comment}
                          </div>
                        )}
                      </div>
                    )}
                    {selectedRequest?.approvedBy && (
                      <div className="text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">({new Date(selectedRequest.approvedBy.date).toLocaleString('vi-VN')})</span>
                        <span className="font-medium">{selectedRequest.approvedBy.user.firstName} {selectedRequest.approvedBy.user.lastName}</span>
                        <span className={getStatusBadgeClass(RequestStatus.APPROVED)}>
                          {formatStatus(RequestStatus.APPROVED)}
                        </span>
                        {selectedRequest.approvedBy.comment && (
                          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
                            Ghi chú: {selectedRequest.approvedBy.comment}
                          </div>
                        )}
                      </div>
                    )}
                    {selectedRequest?.rejectedBy && (
                      <div className="text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">({new Date(selectedRequest.rejectedBy.date).toLocaleString('vi-VN')})</span>
                        <span className="font-medium">{selectedRequest.rejectedBy.user.firstName} {selectedRequest.rejectedBy.user.lastName}</span>
                        <span className={getStatusBadgeClass(RequestStatus.REJECTED)}>
                          {formatStatus(RequestStatus.REJECTED)}
                        </span>
                        {selectedRequest.rejectedBy.comment && (
                          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
                            Ghi chú: {selectedRequest.rejectedBy.comment}
                          </div>
                        )}
                      </div>
                    )}
                    {selectedRequest?.cancelledBy && (
                      <div className="text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">({new Date(selectedRequest.cancelledBy.date).toLocaleString('vi-VN')})</span>
                        <span className="font-medium">{selectedRequest.cancelledBy.user.firstName} {selectedRequest.cancelledBy.user.lastName}</span>
                        <span className={getStatusBadgeClass(RequestStatus.CANCELLED)}>
                          {formatStatus(RequestStatus.CANCELLED)}
                        </span>
                        {selectedRequest.cancelledBy.reason && (
                          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
                            Lý do: {selectedRequest.cancelledBy.reason}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                      className="px-4 py-2 rounded-lg bg-red-500 text-sm font-medium text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                    >
                      Từ chối
                    </button>
                    <button
                      onClick={(e) => {
                        const action = getActionForRequest(selectedRequest);
                        if (action) {
                          handleOpenModal(selectedRequest._id, action, e);
                        }
                      }}
                      disabled={processingRequest === selectedRequest._id}
                      className="px-4 py-2 rounded-lg bg-green-500 text-sm font-medium text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                    >
                      {getActionButtonText(selectedRequest)}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PendingRequestsList; 