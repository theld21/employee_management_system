/**
 * IP Configuration for Attendance System
 * Configure which IP addresses and networks are allowed for check-in/check-out
 */

module.exports = {
  // Enable or disable IP restriction feature
  ENABLE_IP_RESTRICTION: process.env.ENABLE_IP_RESTRICTION === "true" || false,

  // Allowed IP addresses (exact matches)
  ALLOWED_IPS: [
    "127.0.0.1", // Localhost
    "::1", // IPv6 localhost
    // Add specific IP addresses here
    // '192.168.1.100',
    // '10.0.0.50',
  ],

  // Allowed subnets (CIDR notation)
  ALLOWED_SUBNETS: [
    "192.168.0.0/16", // Common home/office network
    "10.0.0.0/8", // Private network class A
    "172.16.0.0/12", // Private network class B
    // Add specific subnets here
    // '192.168.1.0/24',   // Specific office subnet
  ],

  // Subnet mask for same-network checking (default /24)
  DEFAULT_SUBNET_MASK: "255.255.255.0",

  // Development mode - less restrictive for testing
  DEV_MODE: process.env.NODE_ENV === "development",

  // Error messages
  MESSAGES: {
    IP_NOT_ALLOWED: "Không thể chấm công từ vị trí này",
    IP_RESTRICTION_DETAILS:
      "Bạn chỉ có thể chấm công khi kết nối từ mạng công ty",
    IP_BLOCKED: "Địa chỉ IP của bạn không được phép thực hiện thao tác này",
  },

  // Logging configuration
  LOG_IP_ATTEMPTS: true,
  LOG_ALLOWED_IPS: false, // Set to true to log successful IP checks
  LOG_BLOCKED_IPS: true, // Set to true to log blocked IP attempts
};
