import { log } from "console";

/**
 * Request status constants
 */
const RequestStatus = {
  PENDING: 1,
  CONFIRMED: 2,
  APPROVED: 3,
  REJECTED: 4,
  CANCELLED: 5,
  
  // Helper functions
  getStatusText: (statusCode: number): string => {
    switch (statusCode) {
      case RequestStatus.PENDING:
        return 'pending';
      case RequestStatus.CONFIRMED:
        return 'confirmed';
      case RequestStatus.APPROVED:
        return 'approved';
      case RequestStatus.REJECTED:
        return 'rejected';
      case RequestStatus.CANCELLED:
        return 'cancelled';
      default:
        return 'unknown';
    }
  },
  
  getStatusCode: (statusText: string): number => {
    switch (statusText.toLowerCase()) {
      case 'pending':
        return RequestStatus.PENDING;
      case 'confirmed':
        return RequestStatus.CONFIRMED;
      case 'approved':
        return RequestStatus.APPROVED;
      case 'rejected':
        return RequestStatus.REJECTED;
      case 'cancelled':
        return RequestStatus.CANCELLED;
      default:
        return -1;
    }
  }
};

export default RequestStatus; 