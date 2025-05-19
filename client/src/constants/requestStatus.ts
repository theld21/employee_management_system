import { log } from "console";

/**
 * Request status constants
 */
export const RequestStatus = {
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
  CANCELLED: 4,
  
  // Helper functions
  getStatusText: function(statusCode: number): string {
    switch(statusCode) {
      case 1: return 'pending';
      case 2: return 'approved';
      case 3: return 'rejected';
      case 4: return 'cancelled';
      default: return 'unknown';
    }
  },
  
  getStatusCode: function(statusText: string): number {
    switch(statusText) {
      case 'pending': return 1;
      case 'approved': return 2;
      case 'rejected': return 3;
      case 'cancelled': return 4;
      default: return 1; // Default to pending
    }
  }
};

export default RequestStatus; 