const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI;
  const opts = {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 30000,
    family: 4, // Use IPv4 — avoids some DNS/SRV issues on Windows
  };

  try {
    await mongoose.connect(uri, opts);
    console.log("[DB] MongoDB connected successfully");
  } catch (err) {
    console.error("[DB] Connection failed:", err.message);
    console.error("[DB] Check: 1) Atlas cluster is running (not paused), 2) Your IP is whitelisted in Atlas Network Access, 3) Internet connectivity");
    process.exit(1);
  }
}

module.exports = connectDB;
