const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // MongoDB connection options
    const options = {
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds
    };

    console.log("Attempting to connect to MongoDB...");

    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📚 Database Name: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close();
        console.log("MongoDB connection closed through app termination");
        process.exit(0);
      } catch (err) {
        console.error("Error closing MongoDB connection:", err);
        process.exit(1);
      }
    });

    return conn;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.log("💡 Server will continue without database connection");
    console.log(
      "📝 To fix this, ensure your IP is whitelisted in MongoDB Atlas"
    );

    // Don't exit process in development, just log the error
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }

    // Return null to indicate failed connection
    return null;
  }
};

module.exports = connectDB;
