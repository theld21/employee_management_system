const axios = require("axios");
require("dotenv").config();

const BASE_URL = process.env.SERVER_URL || "http://localhost:5000";

// Test server health
const testHealth = async () => {
  try {
    console.log(`Testing server health at ${BASE_URL}/health`);
    const response = await axios.get(`${BASE_URL}/health`);
    console.log("Health response:", response.data);
    return true;
  } catch (error) {
    console.error("Health check failed:", error.message);
    return false;
  }
};

// Test attendance endpoint
const testAttendanceEndpoint = async () => {
  try {
    console.log(
      `Testing attendance endpoint at ${BASE_URL}/api/attendance/month`
    );
    console.log("Note: This should fail with 401 Unauthorized without a token");

    try {
      await axios.get(`${BASE_URL}/api/attendance/month?month=3&year=2023`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log(
          "Got expected 401 Unauthorized error (authentication required)"
        );
        return true;
      }
      throw error;
    }

    console.warn(
      "Warning: Endpoint did not require authentication as expected"
    );
    return false;
  } catch (error) {
    console.error("Attendance endpoint test failed:", error.message);
    if (error.code === "ECONNREFUSED") {
      console.error(
        "Server appears to be down or not listening on the expected port"
      );
    }
    return false;
  }
};

// Run tests
const runTests = async () => {
  console.log("Starting endpoint tests...");
  console.log("=========================");

  const healthOk = await testHealth();
  const attendanceOk = await testAttendanceEndpoint();

  console.log("=========================");
  console.log("Test results:");
  console.log(`Health endpoint: ${healthOk ? "OK" : "FAILED"}`);
  console.log(`Attendance endpoint: ${attendanceOk ? "OK" : "FAILED"}`);

  if (healthOk && attendanceOk) {
    console.log(
      "All tests passed! The server appears to be configured correctly."
    );
  } else {
    console.log("Some tests failed. Please check your server configuration.");
  }
};

runTests();
