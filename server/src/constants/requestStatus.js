/**
 * Request status constants
 */
const REQUEST_STATUS = {
  PENDING: 1,
  CONFIRMED: 2,
  APPROVED: 3,
  REJECTED: 4,
  CANCELLED: 5,
};

// Map ngược từ code sang text
const STATUS_TEXT = {
  1: "pending",
  2: "confirmed",
  3: "approved",
  4: "rejected",
  5: "cancelled",
};

// Lấy status code từ text hoặc số
function getStatusCode(status) {
  // Nếu status là số, trả về luôn nếu hợp lệ
  if (typeof status === "number") {
    return Object.values(REQUEST_STATUS).includes(status)
      ? status
      : REQUEST_STATUS.PENDING;
  }

  // Nếu status là string, chuyển về lowercase và kiểm tra
  if (typeof status === "string") {
    const statusLower = status.toLowerCase();
    const matchingStatus = Object.entries(REQUEST_STATUS).find(
      ([key]) => key.toLowerCase() === statusLower
    );
    return matchingStatus ? matchingStatus[1] : REQUEST_STATUS.PENDING;
  }

  // Mặc định trả về PENDING
  return REQUEST_STATUS.PENDING;
}

// Lấy status text từ code
function getStatusText(code) {
  return STATUS_TEXT[code] || "pending";
}

module.exports = {
  ...REQUEST_STATUS,
  getStatusCode,
  getStatusText,
};
