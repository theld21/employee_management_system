const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const setupAdmin = require("./utils/setupAdmin");
const authRoutes = require("./routes/authRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const attendanceRequestRoutes = require("./routes/attendanceRequestRoutes");
const groupRoutes = require("./routes/groupRoutes");

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB()
  .then(() => {
    // Setup initial admin user
    setupAdmin();
  })
  .catch((err) => {
    console.error("Failed to connect to the database:", err);
  });

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/requests", attendanceRequestRoutes);
app.use("/api/groups", groupRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "success", message: "Server is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Not found middleware
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
