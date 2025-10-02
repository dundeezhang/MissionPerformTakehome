const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const User = require("../models/User");
const Session = require("../models/Session");

// Promisify jwt.verify for async/await usage
const jwtVerify = promisify(jwt.verify);

// Generate JWT access token
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30m",
    issuer: "task-manager-api",
    audience: "task-manager-client",
  });
};

// Generate JWT refresh token
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    issuer: "task-manager-api",
    audience: "task-manager-client",
  });
};

// Extract device information from request
const getDeviceInfo = (req) => {
  const userAgent = req.get("User-Agent") || "Unknown";
  const ip = req.ip || req.connection.remoteAddress || "Unknown";

  // Simple device fingerprinting (can be enhanced)
  const deviceFingerprint = Buffer.from(`${userAgent}-${ip}`).toString(
    "base64"
  );

  return {
    userAgent,
    ip,
    deviceFingerprint,
    location: req.get("CF-IPCountry") || "Unknown", // Cloudflare country header
  };
};

// Main authentication middleware
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Access token required",
        code: "TOKEN_MISSING",
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = await jwtVerify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          error: "Access token has expired",
          code: "TOKEN_EXPIRED",
        });
      } else if (jwtError.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          error: "Invalid access token",
          code: "TOKEN_INVALID",
        });
      } else {
        throw jwtError;
      }
    }

    // Verify session exists and is active
    const session = await Session.findOne({
      sessionId: decoded.sessionId,
      userId: decoded.userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        error: "Session not found or expired",
        code: "SESSION_INVALID",
      });
    }

    // Get user and verify account status
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: "Account is deactivated",
        code: "ACCOUNT_DEACTIVATED",
      });
    }

    if (user.isLocked) {
      return res.status(401).json({
        success: false,
        error: "Account is locked due to multiple failed login attempts",
        code: "ACCOUNT_LOCKED",
      });
    }

    // Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      await session.deactivate("password_changed");
      return res.status(401).json({
        success: false,
        error: "Password has been changed. Please log in again.",
        code: "PASSWORD_CHANGED",
      });
    }

    // Update session last accessed time (async, don't wait)
    session.updateLastAccessed().catch((err) => {
      console.error("Error updating session last accessed time:", err);
    });

    // Attach user and session to request
    req.user = user;
    req.session = session;
    req.deviceInfo = getDeviceInfo(req);

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({
      success: false,
      error: "Authentication failed",
      code: "AUTH_ERROR",
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    // Use the main authenticate middleware
    await authenticate(req, res, next);
  } catch (error) {
    // If optional auth fails, just continue without user
    next();
  }
};

// Middleware to require specific permissions
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        code: "AUTH_REQUIRED",
      });
    }

    // Basic permission check (can be enhanced with role-based permissions)
    if (permission === "admin" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Admin privileges required",
        code: "INSUFFICIENT_PERMISSIONS",
      });
    }

    next();
  };
};

// Middleware to check if user owns a resource
const requireOwnership = (getResourceUserId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
          code: "AUTH_REQUIRED",
        });
      }

      const resourceUserId = await getResourceUserId(req);

      if (!resourceUserId) {
        return res.status(404).json({
          success: false,
          error: "Resource not found",
          code: "RESOURCE_NOT_FOUND",
        });
      }

      if (resourceUserId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: "Access denied. You can only access your own resources.",
          code: "ACCESS_DENIED",
        });
      }

      next();
    } catch (error) {
      console.error("Ownership check error:", error);
      res.status(500).json({
        success: false,
        error: "Authorization failed",
        code: "AUTH_ERROR",
      });
    }
  };
};

// Rate limiting middleware for authentication routes
const authRateLimit = (maxAttempts = 5, windowMinutes = 15) => {
  const attempts = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;

    // Clean old entries
    for (const [key, data] of attempts.entries()) {
      if (now - data.firstAttempt > windowMs) {
        attempts.delete(key);
      }
    }

    // Check current IP attempts
    const ipAttempts = attempts.get(ip);

    if (!ipAttempts) {
      attempts.set(ip, { count: 1, firstAttempt: now });
      return next();
    }

    if (now - ipAttempts.firstAttempt > windowMs) {
      // Reset window
      attempts.set(ip, { count: 1, firstAttempt: now });
      return next();
    }

    if (ipAttempts.count >= maxAttempts) {
      return res.status(429).json({
        success: false,
        error: "Too many authentication attempts. Please try again later.",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: Math.ceil(
          (ipAttempts.firstAttempt + windowMs - now) / 1000
        ),
      });
    }

    ipAttempts.count++;
    next();
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  requirePermission,
  requireOwnership,
  authRateLimit,
  generateAccessToken,
  generateRefreshToken,
  getDeviceInfo,
};
