/**
 * Request status constants
 */
module.exports = {
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
  CANCELLED: 4,

  // Helper functions
  getStatusText: function (statusCode) {
    switch (statusCode) {
      case 1:
        return "pending";
      case 2:
        return "approved";
      case 3:
        return "rejected";
      case 4:
        return "cancelled";
      default:
        return "unknown";
    }
  },

  getStatusCode: function (statusText) {
    // Handle undefined or null status values
    if (!statusText) {
      return this.PENDING; // Default to pending if status is undefined/null
    }

    switch (statusText) {
      case "pending":
        return 1;
      case "approved":
        return 2;
      case "rejected":
        return 3;
      case "cancelled":
        return 4;
      default:
        return 1; // Default to pending
    }
  },
};
