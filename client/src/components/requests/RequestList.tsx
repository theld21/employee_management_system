"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';
import { useModal } from '@/hooks/useModal';
import RequestModal from './RequestModal';
import { Modal } from '@/components/ui/modal';
import RequestStatus from '@/constants/requestStatus';
import { toast } from 'react-hot-toast';
import {
  type Request,
  formatDate,
  formatDateTime,
  formatRequestType,
  formatStatus,
  getStatusBadgeClass,
  getProcessInfo
} from '@/utils/requestHelpers';

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
    setCancelError(null);
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      setCancelLoading(true);
      setCancelError(null);
      await api.post(`/requests/${requestId}/cancel`);
      toast.success('Hủy yêu cầu thành công');
      setShowDetailModal(false);
      fetchRequests();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCancelError(err.message);
      } else {
        setCancelError('Có lỗi xảy ra khi hủy yêu cầu');
      }
    } finally {
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
                        <span className="font-medium"><span className="inline-block w-10">Từ:</span> {formatDateTime(request.startTime)}</span>
                      </div>
                      <div>
                        <span className="font-medium"><span className="inline-block w-10">Đến:</span> {formatDateTime(request.endTime)}</span>
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
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Loại yêu cầu</div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {formatRequestType(selectedRequest.type)}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Trạng thái</div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    <span className={getStatusBadgeClass(selectedRequest.status)}>
                      {formatStatus(selectedRequest.status)}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Thời gian bắt đầu</div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {formatDateTime(selectedRequest.startTime)}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Thời gian kết thúc</div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {formatDateTime(selectedRequest.endTime)}
                  </div>
                </div>
              </div>

              {selectedRequest.type === 'leave-request' && (
                <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Số ngày nghỉ</div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {(selectedRequest.leaveDays || 0).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ngày
                  </div>
                </div>
              )}

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
                        <span className="font-medium"> {selectedRequest.confirmedBy.user.firstName} {selectedRequest.confirmedBy.user.lastName}</span>
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
                {selectedRequest.status === RequestStatus.PENDING && (
                  <button
                    onClick={() => handleCancelRequest(selectedRequest._id)}
                    className="px-4 py-2 rounded-lg bg-red-500 text-sm font-medium text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={cancelLoading}
                  >
                    {cancelLoading ? 'Đang hủy...' : 'Hủy yêu cầu'}
                  </button>
                )}

                {cancelError && (
                  <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {cancelError}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RequestList;