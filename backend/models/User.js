const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Define the User schema
const userSchema = new mongoose.Schema(
  {
    // Basic user information
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      lowercase: true,
      match: [
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false, // Don't include password in queries by default
    },

    // Optional profile information
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },

    // Security fields
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    accountLockedUntil: {
      type: Date,
    },
    lastLoginAt: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
      default: Date.now,
    },

    // Session management
    activeSessions: [
      {
        type: String, // Session IDs
      },
    ],
    maxConcurrentSessions: {
      type: Number,
      default: parseInt(process.env.SESSION_MAX_CONCURRENT) || 5,
    },

    // Account status
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Security preferences
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Virtual for account lock status
userSchema.virtual("isLocked").get(function () {
  return !!(this.accountLockedUntil && this.accountLockedUntil > Date.now());
});

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.firstName || this.lastName || this.username;
});

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    // Hash password with cost of 12
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);

    // Update passwordChangedAt field
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure it's before JWT timestamp
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Method to handle failed login attempts
userSchema.methods.incLoginAttempts = async function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.accountLockedUntil && this.accountLockedUntil < Date.now()) {
    return this.updateOne({
      $unset: { accountLockedUntil: 1 },
      $set: { failedLoginAttempts: 1 },
    });
  }

  const updates = { $inc: { failedLoginAttempts: 1 } };
  const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
  const lockTime = parseInt(process.env.ACCOUNT_LOCK_TIME) || 30 * 60 * 1000; // 30 minutes

  // If we have max attempts and not locked yet, lock the account
  if (this.failedLoginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { accountLockedUntil: Date.now() + lockTime };
  }

  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $unset: { failedLoginAttempts: 1, accountLockedUntil: 1 },
  });
};

// Method to add session
userSchema.methods.addSession = async function (sessionId) {
  // Remove session if it already exists
  this.activeSessions = this.activeSessions.filter((id) => id !== sessionId);

  // Add new session
  this.activeSessions.push(sessionId);

  // Keep only the most recent sessions
  if (this.activeSessions.length > this.maxConcurrentSessions) {
    this.activeSessions = this.activeSessions.slice(
      -this.maxConcurrentSessions
    );
  }

  // Update last login time
  this.lastLoginAt = new Date();

  return this.save();
};

// Method to remove session
userSchema.methods.removeSession = async function (sessionId) {
  this.activeSessions = this.activeSessions.filter((id) => id !== sessionId);
  return this.save();
};

// Method to remove all sessions (logout from all devices)
userSchema.methods.removeAllSessions = async function () {
  this.activeSessions = [];
  return this.save();
};

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ activeSessions: 1 });
userSchema.index({ accountLockedUntil: 1 }, { sparse: true });

// Create and export the User model
const User = mongoose.model("User", userSchema);

module.exports = User;
