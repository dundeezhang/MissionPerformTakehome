const mongoose = require("mongoose");

// Define the Session schema for hybrid JWT + session storage
const sessionSchema = new mongoose.Schema(
  {
    // Core session data
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    sessionId: {
      type: String,
      required: [true, "Session ID is required"],
      unique: true,
      index: true,
    },

    // Token management
    refreshTokenHash: {
      type: String,
      required: true,
      select: false, // Don't include in queries by default
    },
    tokenFamily: {
      type: String,
      required: true,
      index: true, // For detecting token reuse
    },

    // Device and security information
    deviceInfo: {
      userAgent: {
        type: String,
        required: true,
      },
      ip: {
        type: String,
        required: true,
      },
      location: {
        type: String,
        default: "Unknown",
      },
      deviceFingerprint: {
        type: String,
        index: true,
      },
    },

    // Session status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Timestamps and expiry
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL index for automatic cleanup
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },

    // Security tracking
    loginMethod: {
      type: String,
      enum: ["password", "refresh", "social"],
      default: "password",
    },
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Metadata
    metadata: {
      type: Map,
      of: String,
      default: new Map(),
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.refreshTokenHash;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Virtual for session age
sessionSchema.virtual("ageInMinutes").get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60));
});

// Virtual for time until expiry
sessionSchema.virtual("expiresInMinutes").get(function () {
  return Math.floor((this.expiresAt - Date.now()) / (1000 * 60));
});

// Virtual for checking if session is expired
sessionSchema.virtual("isExpired").get(function () {
  return this.expiresAt < new Date();
});

// Virtual for checking if session is suspicious
sessionSchema.virtual("isSuspicious").get(function () {
  return this.riskScore > 70;
});

// Method to update last accessed time
sessionSchema.methods.updateLastAccessed = function () {
  this.lastAccessedAt = new Date();
  return this.save();
};

// Method to mark session as inactive
sessionSchema.methods.deactivate = function (reason = "manual") {
  this.isActive = false;
  this.metadata.set("deactivationReason", reason);
  this.metadata.set("deactivatedAt", new Date().toISOString());
  return this.save();
};

// Method to extend session expiry
sessionSchema.methods.extend = function (
  additionalTime = 7 * 24 * 60 * 60 * 1000
) {
  // Default 7 days
  this.expiresAt = new Date(Date.now() + additionalTime);
  return this.save();
};

// Method to calculate risk score based on various factors
sessionSchema.methods.calculateRiskScore = function () {
  let score = 0;

  // Age factor (older sessions are riskier)
  const ageInHours = (Date.now() - this.createdAt) / (1000 * 60 * 60);
  if (ageInHours > 24 * 7) score += 20; // More than a week old
  else if (ageInHours > 24) score += 10; // More than a day old

  // Inactivity factor
  const inactiveHours = (Date.now() - this.lastAccessedAt) / (1000 * 60 * 60);
  if (inactiveHours > 24) score += 15; // Inactive for more than a day
  else if (inactiveHours > 6) score += 5; // Inactive for more than 6 hours

  // Device consistency (would be enhanced with more data)
  if (!this.deviceInfo.deviceFingerprint) score += 10;

  this.riskScore = Math.min(score, 100);
  return this.riskScore;
};

// Static method to cleanup expired sessions
sessionSchema.statics.cleanupExpired = async function () {
  const result = await this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      {
        isActive: false,
        updatedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }, // Inactive for more than 24 hours
    ],
  });
  return result;
};

// Static method to find active sessions for a user
sessionSchema.statics.findActiveByUser = function (userId) {
  return this.find({
    userId,
    isActive: true,
    expiresAt: { $gt: new Date() },
  }).populate("userId", "username email fullName");
};

// Static method to revoke all sessions for a user
sessionSchema.statics.revokeAllForUser = async function (
  userId,
  reason = "security"
) {
  const result = await this.updateMany(
    { userId, isActive: true },
    {
      $set: {
        isActive: false,
        "metadata.deactivationReason": reason,
        "metadata.deactivatedAt": new Date().toISOString(),
      },
    }
  );
  return result;
};

// Static method to detect token reuse (security breach)
sessionSchema.statics.detectTokenReuse = async function (
  tokenFamily,
  currentSessionId
) {
  const sessions = await this.find({
    tokenFamily,
    isActive: true,
    sessionId: { $ne: currentSessionId },
  });

  if (sessions.length > 0) {
    // Token reuse detected - revoke all sessions in this family
    await this.updateMany(
      { tokenFamily },
      {
        $set: {
          isActive: false,
          riskScore: 100,
          "metadata.securityBreach": "token_reuse_detected",
          "metadata.breachDetectedAt": new Date().toISOString(),
        },
      }
    );
    return true;
  }

  return false;
};

// Pre-save middleware to calculate risk score
sessionSchema.pre("save", function (next) {
  if (this.isModified("lastAccessedAt") || this.isNew) {
    this.calculateRiskScore();
  }
  next();
});

// Indexes for performance and security
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ sessionId: 1 });
sessionSchema.index({ tokenFamily: 1 });
sessionSchema.index({ expiresAt: 1 });
sessionSchema.index({ "deviceInfo.ip": 1 });
sessionSchema.index({ "deviceInfo.deviceFingerprint": 1 });
sessionSchema.index({ riskScore: 1 });
sessionSchema.index({ createdAt: 1 });

// Create and export the Session model
const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;
