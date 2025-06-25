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
  getStatusText: (code) => {
    switch (code) {
      case 1:
        return "Pending";
      case 2:
        return "Confirmed";
      case 3:
        return "Approved";
      case 4:
        return "Rejected";
      case 5:
        return "Cancelled";
      default:
        return "Pending";
    }
  },

  getStatusCode: (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return 1;
      case "confirmed":
        return 2;
      case "approved":
        return 3;
      case "rejected":
        return 4;
      case "cancelled":
        return 5;
      default:
        return 1;
    }
  },
};

module.exports = RequestStatus;
