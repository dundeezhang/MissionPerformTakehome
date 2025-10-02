const errorHandler = (err, req, res, next) => {
  console.error("Error occurred:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Ensure CORS headers are set even on errors
  const origin = req.headers.origin;
  if (origin) {
    if (
      origin.endsWith(".vercel.app") ||
      origin === "http://localhost:3000" ||
      origin === "http://localhost:5173"
    ) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type,Authorization,X-Requested-With"
      );
    }
  }

  // Default error
  let error = {
    message: err.message || "Internal Server Error",
    status: err.status || 500,
  };

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    error.message = "Invalid ID format";
    error.status = 400;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    error.message = "Resource already exists";
    error.status = 400;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    error.message = messages.join(", ");
    error.status = 400;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error.message = "Invalid token";
    error.status = 401;
  }

  if (err.name === "TokenExpiredError") {
    error.message = "Token expired";
    error.status = 401;
  }

  res.status(error.status).json({
    success: false,
    error: error.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
