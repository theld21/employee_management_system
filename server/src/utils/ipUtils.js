const os = require("os");
const ipConfig = require("../config/ipConfig");

/**
 * Get client IP address from request object
 * @param {Object} req - Express request object
 * @returns {string} Client IP address
 */
const getClientIP = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  const real = req.headers["x-real-ip"];
  const remoteAddress =
    req.connection?.remoteAddress || req.socket?.remoteAddress;

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (real) {
    return real;
  }
  if (remoteAddress) {
    // Remove ::ffff: prefix from IPv4-mapped IPv6 addresses
    return remoteAddress.replace(/^::ffff:/, "");
  }

  return "unknown";
};

/**
 * Get server local IP addresses
 * @returns {Array} Array of server IP addresses
 */
const getServerIPs = () => {
  const networkInterfaces = os.networkInterfaces();
  const ips = [];

  Object.values(networkInterfaces).forEach((interfaces) => {
    interfaces.forEach((iface) => {
      // Skip internal and IPv6 addresses
      if (!iface.internal && iface.family === "IPv4") {
        ips.push(iface.address);
      }
    });
  });

  return ips;
};

/**
 * Convert CIDR notation to subnet mask
 * @param {string} cidr - CIDR notation (e.g., '192.168.1.0/24')
 * @returns {Object} Object with network and mask
 */
const parseCIDR = (cidr) => {
  const [network, prefixLength] = cidr.split("/");
  const mask = (0xffffffff << (32 - parseInt(prefixLength))) >>> 0;

  return {
    network,
    mask: [
      (mask >>> 24) & 0xff,
      (mask >>> 16) & 0xff,
      (mask >>> 8) & 0xff,
      mask & 0xff,
    ].join("."),
  };
};

/**
 * Check if IP is in CIDR subnet
 * @param {string} ip - IP address to check
 * @param {string} cidr - CIDR notation subnet
 * @returns {boolean} True if IP is in subnet
 */
const isIPInCIDR = (ip, cidr) => {
  try {
    const { network, mask } = parseCIDR(cidr);
    return isSameSubnet(ip, network, mask);
  } catch (error) {
    console.error(`Error checking IP ${ip} against CIDR ${cidr}:`, error);
    return false;
  }
};

/**
 * Check if two IP addresses are in the same subnet
 * @param {string} ip1 - First IP address
 * @param {string} ip2 - Second IP address
 * @param {string} subnet - Subnet mask (default from config)
 * @returns {boolean} True if IPs are in same subnet
 */
const isSameSubnet = (ip1, ip2, subnet = ipConfig.DEFAULT_SUBNET_MASK) => {
  try {
    const ipToInt = (ip) => {
      return (
        ip
          .split(".")
          .reduce((acc, part) => (acc << 8) + parseInt(part, 10), 0) >>> 0
      );
    };

    const ip1Int = ipToInt(ip1);
    const ip2Int = ipToInt(ip2);
    const subnetInt = ipToInt(subnet);

    return (ip1Int & subnetInt) === (ip2Int & subnetInt);
  } catch (error) {
    console.error(`Error comparing IPs ${ip1} and ${ip2}:`, error);
    return false;
  }
};

/**
 * Check if IP is a private network IP
 * @param {string} ip - IP address to check
 * @returns {boolean} True if IP is private
 */
const isPrivateIP = (ip) => {
  try {
    const parts = ip.split(".").map(Number);
    return (
      // 10.0.0.0/8
      parts[0] === 10 ||
      // 172.16.0.0/12
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      // 192.168.0.0/16
      (parts[0] === 192 && parts[1] === 168)
    );
  } catch (error) {
    return false;
  }
};

/**
 * Check if client IP is allowed for attendance actions
 * @param {Object} req - Express request object
 * @returns {Object} Object containing isAllowed boolean and details
 */
const isIPAllowed = (req) => {
  const clientIP = getClientIP(req);
  const serverIPs = getServerIPs();

  // If IP restriction is disabled, allow all
  if (!ipConfig.ENABLE_IP_RESTRICTION) {
    return {
      isAllowed: true,
      clientIP,
      serverIPs,
      reason: "IP restriction disabled",
    };
  }

  // In development mode, be more lenient
  if (ipConfig.DEV_MODE) {
    // Allow localhost and private IPs in dev mode
    if (
      clientIP === "127.0.0.1" ||
      clientIP === "::1" ||
      isPrivateIP(clientIP)
    ) {
      return {
        isAllowed: true,
        clientIP,
        serverIPs,
        reason: "Development mode - private/localhost IP",
      };
    }
  }

  // Check against allowed IPs list
  if (ipConfig.ALLOWED_IPS.includes(clientIP)) {
    return {
      isAllowed: true,
      clientIP,
      serverIPs,
      reason: "IP in allowed list",
    };
  }

  // Check against allowed subnets (CIDR)
  for (const subnet of ipConfig.ALLOWED_SUBNETS) {
    if (isIPInCIDR(clientIP, subnet)) {
      return {
        isAllowed: true,
        clientIP,
        serverIPs,
        reason: `IP in allowed subnet: ${subnet}`,
      };
    }
  }

  // Check if client IP is in same subnet as any server IP
  for (const serverIP of serverIPs) {
    if (isSameSubnet(clientIP, serverIP)) {
      return {
        isAllowed: true,
        clientIP,
        serverIPs,
        reason: `Same subnet as server IP: ${serverIP}`,
      };
    }
  }

  return {
    isAllowed: false,
    clientIP,
    serverIPs,
    reason: "IP not in allowed range",
  };
};

/**
 * Log IP attempt
 * @param {Object} ipInfo - IP information object
 * @param {boolean} allowed - Whether the IP was allowed
 */
const logIPAttempt = (ipInfo, allowed) => {
  if (!ipConfig.LOG_IP_ATTEMPTS) return;

  if (allowed && !ipConfig.LOG_ALLOWED_IPS) return;
  if (!allowed && !ipConfig.LOG_BLOCKED_IPS) return;

  const timestamp = new Date().toISOString();
  const status = allowed ? "ALLOWED" : "BLOCKED";

  console.log(
    `[${timestamp}] IP ${status}: ${ipInfo.clientIP} - ${ipInfo.reason}`
  );
};

/**
 * Middleware to check IP restrictions for attendance actions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const checkIPRestriction = (req, res, next) => {
  const ipCheck = isIPAllowed(req);

  // Log the attempt
  logIPAttempt(ipCheck, ipCheck.isAllowed);

  if (!ipCheck.isAllowed) {
    return res.status(403).json({
      message: ipConfig.MESSAGES.IP_NOT_ALLOWED,
      details: ipConfig.MESSAGES.IP_RESTRICTION_DETAILS,
      clientIP: ipCheck.clientIP,
      reason: ipCheck.reason,
    });
  }

  // Add IP info to request for logging
  req.ipInfo = ipCheck;
  next();
};

module.exports = {
  getClientIP,
  getServerIPs,
  isSameSubnet,
  isIPAllowed,
  checkIPRestriction,
  isPrivateIP,
  isIPInCIDR,
  parseCIDR,
};
