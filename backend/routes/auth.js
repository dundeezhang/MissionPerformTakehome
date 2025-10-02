const express = require("express");
const { body, validationResult } = require("express-validator");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Session = require("../models/Session");
const {
  authenticate,
  authRateLimit,
  generateAccessToken,
  generateRefreshToken,
  getDeviceInfo,
} = require("../middleware/auth");

const router = express.Router();

// Validation rules
const registerValidation = [
  body("username")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores")
    .toLowerCase(),
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
  body("firstName")
    .optional()
    .isLength({ max: 50 })
    .withMessage("First name cannot exceed 50 characters")
    .trim(),
  body("lastName")
    .optional()
    .isLength({ max: 50 })
    .withMessage("Last name cannot exceed 50 characters")
    .trim(),
];

const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errors.array(),
    });
  }
  next();
};

// Helper function to create session and tokens
const createUserSession = async (user, req, rememberMe = false) => {
  const deviceInfo = getDeviceInfo(req);
  const sessionId = crypto.randomUUID();
  const tokenFamily = crypto.randomUUID();

  // Generate tokens
  const accessTokenPayload = {
    userId: user._id,
    sessionId,
    username: user.username,
    email: user.email,
  };

  const refreshTokenPayload = {
    userId: user._id,
    sessionId,
    tokenFamily,
    type: "refresh",
  };

  const accessToken = generateAccessToken(accessTokenPayload);
  const refreshToken = generateRefreshToken(refreshTokenPayload);

  // Hash refresh token for storage
  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  // Set expiry based on rememberMe option
  const expiryTime = rememberMe
    ? 30 * 24 * 60 * 60 * 1000 // 30 days
    : 7 * 24 * 60 * 60 * 1000; // 7 days

  // Create session record
  const session = new Session({
    userId: user._id,
    sessionId,
    refreshTokenHash,
    tokenFamily,
    deviceInfo,
    expiresAt: new Date(Date.now() + expiryTime),
    loginMethod: "password",
  });

  await session.save();

  // Add session to user's active sessions
  await user.addSession(sessionId);

  return { accessToken, refreshToken, session };
};

// POST /api/auth/register - User registration
router.post(
  "/register",
  authRateLimit(5, 15), // 5 attempts per 15 minutes
  registerValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { username, email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error:
            existingUser.email === email
              ? "Email is already registered"
              : "Username is already taken",
          code: "USER_EXISTS",
        });
      }

      // Create new user
      const userData = {
        username,
        email,
        password,
        firstName: firstName || "",
        lastName: lastName || "",
        isEmailVerified: false, // In production, implement email verification
      };

      const user = new User(userData);
      await user.save();

      // Create session and tokens
      const { accessToken, refreshToken, session } = await createUserSession(
        user,
        req
      );

      // Remove password from response
      const userResponse = user.toJSON();
      delete userResponse.password;

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || "30m",
        },
        session: {
          id: session.sessionId,
          expiresAt: session.expiresAt,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);

      if (error.code === 11000) {
        // Duplicate key error
        const field = Object.keys(error.keyPattern)[0];
        return res.status(409).json({
          success: false,
          error: `${
            field.charAt(0).toUpperCase() + field.slice(1)
          } is already taken`,
          code: "DUPLICATE_KEY",
        });
      }

      res.status(500).json({
        success: false,
        error: "Registration failed",
        code: "REGISTRATION_ERROR",
      });
    }
  }
);

// POST /api/auth/login - User login
router.post(
  "/login",
  authRateLimit(10, 15), // 10 attempts per 15 minutes
  loginValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password, rememberMe = false } = req.body;

      // Find user and include password for verification
      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        });
      }

      // Check if account is locked
      if (user.isLocked) {
        return res.status(423).json({
          success: false,
          error:
            "Account is temporarily locked due to multiple failed login attempts",
          code: "ACCOUNT_LOCKED",
          lockedUntil: user.accountLockedUntil,
        });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: "Account is deactivated",
          code: "ACCOUNT_DEACTIVATED",
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        // Increment failed login attempts
        await user.incLoginAttempts();

        return res.status(401).json({
          success: false,
          error: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        });
      }

      // Reset login attempts on successful login
      if (user.failedLoginAttempts > 0) {
        await user.resetLoginAttempts();
      }

      // Create session and tokens
      const { accessToken, refreshToken, session } = await createUserSession(
        user,
        req,
        rememberMe
      );

      // Remove password from response
      const userResponse = user.toJSON();
      delete userResponse.password;

      res.json({
        success: true,
        message: "Login successful",
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || "30m",
        },
        session: {
          id: session.sessionId,
          expiresAt: session.expiresAt,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        error: "Login failed",
        code: "LOGIN_ERROR",
      });
    }
  }
);

// POST /api/auth/refresh - Refresh access token
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: "Refresh token required",
        code: "REFRESH_TOKEN_MISSING",
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired refresh token",
        code: "REFRESH_TOKEN_INVALID",
      });
    }

    // Hash the received refresh token
    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    // Find active session with matching refresh token
    const session = await Session.findOne({
      sessionId: decoded.sessionId,
      refreshTokenHash,
      isActive: true,
      expiresAt: { $gt: new Date() },
    }).populate("userId");

    if (!session) {
      return res.status(401).json({
        success: false,
        error: "Session not found or expired",
        code: "SESSION_INVALID",
      });
    }

    // Check for token reuse (security breach detection)
    const tokenReuseDetected = await Session.detectTokenReuse(
      decoded.tokenFamily,
      decoded.sessionId
    );

    if (tokenReuseDetected) {
      return res.status(401).json({
        success: false,
        error: "Security breach detected. All sessions have been revoked.",
        code: "TOKEN_REUSE_DETECTED",
      });
    }

    // Generate new access token
    const accessTokenPayload = {
      userId: session.userId._id,
      sessionId: session.sessionId,
      username: session.userId.username,
      email: session.userId.email,
    };

    const newAccessToken = generateAccessToken(accessTokenPayload);

    // Generate new refresh token (token rotation)
    const newRefreshTokenPayload = {
      userId: session.userId._id,
      sessionId: session.sessionId,
      tokenFamily: decoded.tokenFamily,
      type: "refresh",
    };

    const newRefreshToken = generateRefreshToken(newRefreshTokenPayload);

    // Update session with new refresh token hash
    const newRefreshTokenHash = crypto
      .createHash("sha256")
      .update(newRefreshToken)
      .digest("hex");

    session.refreshTokenHash = newRefreshTokenHash;
    session.lastAccessedAt = new Date();
    await session.save();

    res.json({
      success: true,
      message: "Tokens refreshed successfully",
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || "30m",
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      success: false,
      error: "Token refresh failed",
      code: "REFRESH_ERROR",
    });
  }
});

// POST /api/auth/logout - User logout
router.post("/logout", authenticate, async (req, res) => {
  try {
    // Deactivate current session
    await req.session.deactivate("user_logout");

    // Remove session from user's active sessions
    await req.user.removeSession(req.session.sessionId);

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      error: "Logout failed",
      code: "LOGOUT_ERROR",
    });
  }
});

// POST /api/auth/logout-all - Logout from all devices
router.post("/logout-all", authenticate, async (req, res) => {
  try {
    // Revoke all sessions for the user
    await Session.revokeAllForUser(req.user._id, "user_logout_all");

    // Clear user's active sessions
    await req.user.removeAllSessions();

    res.json({
      success: true,
      message: "Logged out from all devices successfully",
    });
  } catch (error) {
    console.error("Logout all error:", error);
    res.status(500).json({
      success: false,
      error: "Logout from all devices failed",
      code: "LOGOUT_ALL_ERROR",
    });
  }
});

// GET /api/auth/me - Get current user profile
router.get("/me", authenticate, (req, res) => {
  try {
    const userResponse = req.user.toJSON();

    res.json({
      success: true,
      user: userResponse,
      session: {
        id: req.session.sessionId,
        expiresAt: req.session.expiresAt,
        lastAccessedAt: req.session.lastAccessedAt,
        deviceInfo: req.session.deviceInfo,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user profile",
      code: "PROFILE_ERROR",
    });
  }
});

// GET /api/auth/sessions - Get user's active sessions
router.get("/sessions", authenticate, async (req, res) => {
  try {
    const sessions = await Session.findActiveByUser(req.user._id);

    const sessionsResponse = sessions.map((session) => ({
      id: session.sessionId,
      deviceInfo: session.deviceInfo,
      lastAccessedAt: session.lastAccessedAt,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isCurrent: session.sessionId === req.session.sessionId,
    }));

    res.json({
      success: true,
      sessions: sessionsResponse,
    });
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get sessions",
      code: "SESSIONS_ERROR",
    });
  }
});

// DELETE /api/auth/sessions/:sessionId - Revoke specific session
router.delete("/sessions/:sessionId", authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Find and deactivate the session (only if it belongs to the current user)
    const session = await Session.findOne({
      sessionId,
      userId: req.user._id,
      isActive: true,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Session not found",
        code: "SESSION_NOT_FOUND",
      });
    }

    await session.deactivate("user_revoked");
    await req.user.removeSession(sessionId);

    res.json({
      success: true,
      message: "Session revoked successfully",
    });
  } catch (error) {
    console.error("Revoke session error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to revoke session",
      code: "REVOKE_SESSION_ERROR",
    });
  }
});

// PUT /api/auth/change-password - Change password
router.put(
  "/change-password",
  authenticate,
  changePasswordValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await User.findById(req.user._id).select("+password");

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(
        currentPassword
      );

      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          error: "Current password is incorrect",
          code: "INVALID_CURRENT_PASSWORD",
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      // Revoke all sessions except current one (force re-login)
      await Session.updateMany(
        {
          userId: user._id,
          isActive: true,
          sessionId: { $ne: req.session.sessionId },
        },
        {
          $set: {
            isActive: false,
            "metadata.deactivationReason": "password_changed",
          },
        }
      );

      res.json({
        success: true,
        message:
          "Password changed successfully. Other sessions have been logged out.",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to change password",
        code: "CHANGE_PASSWORD_ERROR",
      });
    }
  }
);

module.exports = router;
