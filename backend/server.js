const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/database");
const taskRoutes = require("./routes/tasks");
const authRoutes = require("./routes/auth");
const errorHandler = require("./middleware/errorHandler");

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Get port from environment or default to 5000
const PORT = process.env.PORT || 5000;

// Connect to MongoDB (non-blocking)
connectDB().catch((err) => {
  console.error("⚠️  Starting server without database connection");
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : ["http://localhost:3000", "http://localhost:5173"];

    // Check if origin is in allowed origins list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    }
    // Allow all *.vercel.app domains
    else if (origin && origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use((req, res, next) => {
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  const mongoose = require("mongoose");
  const dbStatus =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  res.status(200).json({
    status: "OK",
    message: "Task Manager API is running",
    database: dbStatus,
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Task Manager API with Authentication",
    version: "1.0.0",
    endpoints: {
      "GET /health": "Health check",
      "POST /api/auth/register": "User registration",
      "POST /api/auth/login": "User login",
      "POST /api/auth/logout": "User logout",
      "GET /api/auth/me": "Get current user profile",
      "GET /api/auth/sessions": "Get active sessions",
      "GET /api/tasks": "Get user's tasks (auth required)",
      "POST /api/tasks": "Create a new task (auth required)",
      "GET /api/tasks/:id": "Get task by ID (auth required)",
      "PUT /api/tasks/:id": "Update task by ID (auth required)",
      "DELETE /api/tasks/:id": "Delete task by ID (auth required)",
    },
  });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`
🚀 Task Manager API Server is running!
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || "development"}
🔗 Local URL: http://localhost:${PORT}
📚 API Documentation: http://localhost:${PORT}
🏥 Health Check: http://localhost:${PORT}/health
  `);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  server.close(() => {
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  server.close(() => {
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err.message);
  // Don't crash the server for database connection issues in development
  if (process.env.NODE_ENV === "production") {
    server.close(() => {
      process.exit(1);
    });
  }
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

module.exports = app;
