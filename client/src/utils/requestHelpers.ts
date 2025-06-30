import RequestStatus from '@/constants/requestStatus';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username?: string;
  email?: string;
  leaveDays?: number;
}

export interface ProcessInfo {
  user: User;
  date: string;
  comment?: string;
  reason?: string;
}

export interface Request {
  _id: string;
  type: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: number;
  createdAt: string;
  leaveDays?: number;
  user: User;
  confirmedBy?: ProcessInfo;
  approvedBy?: ProcessInfo;
  rejectedBy?: ProcessInfo;
  cancelledBy?: ProcessInfo;
}

export const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const dateStr = date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const timeStr = date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return `${dateStr} ${timeStr}`;
};

export const formatRequestType = (type: string) => {
  switch (type) {
    case 'work-time':
      return 'Cập nhật giờ làm';
    case 'leave-request':
      return 'Nghỉ phép có lương';
    case 'wfh-request':
      return 'Yêu cầu làm tại nhà';
    case 'overtime':
      return 'Yêu cầu làm thêm giờ';
    default:
      return type;
  }
};

export const formatStatus = (status: number) => {
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

export const getStatusBadgeClass = (status: number) => {
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

export const getProcessInfo = (request: Request) => {
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