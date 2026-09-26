require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const resumeRoutes = require("./routes/resume");
const githubRoutes = require("./routes/github");
const careerRoutes = require("./routes/career");
const jobRoutes = require("./routes/jobs");
const copilotRoutes = require("./routes/copilot");
const growthRoutes = require("./routes/growth");
const interviewRoutes = require("./routes/interview");
const outreachRoutes = require("./routes/outreach");

const app = express();

// ── CORS ──
// Trim whitespace/trailing slashes from every origin (including FRONTEND_URL)
// so a stray newline or trailing "/" pasted into an env var can't silently
// break matching — that failure mode is invisible (no error, just a missing
// Access-Control-Allow-Origin header) and hard to diagnose from the outside.
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.FRONTEND_URL,
  "https://careeros-ai-phi.vercel.app",
  "https://careeros-ai-rishabh-1f3c.vercel.app",
  "https://frontend-psi-sage-59.vercel.app",
]
  .filter(Boolean)
  .map((o) => o.trim().replace(/\/$/, ""));

app.use(cors({
  origin: (origin, callback) => {
    // No Origin header = server-to-server call, curl, or the health check;
    // never a real cross-site browser request, so it's always allowed.
    if (!origin) return callback(null, true);
    const normalized = origin.trim().replace(/\/$/, "");
    if (ALLOWED_ORIGINS.includes(normalized)) return callback(null, true);
    callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));

// ── Health check (always available, even without DB) ──
app.get("/", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = ["disconnected", "connected", "connecting", "disconnecting"][dbState] || "unknown";
  res.json({
    status: "CareerOS AI backend running",
    version: "1.0.0-mvp",
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/career", careerRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/copilot", copilotRoutes);
app.use("/api/growth", growthRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/outreach", outreachRoutes);

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error("[Error]", err.message);
  res.status(500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;

// ── Start server immediately, connect DB with retry ──
app.listen(PORT, () => {
  console.log(`\n[Server] ✅ CareerOS AI backend listening on port ${PORT}`);
  console.log(`[Server] Health: http://localhost:${PORT}/\n`);
});

// ── MongoDB connection with retry ──
const MONGO_URI = process.env.MONGO_URI;
const MONGO_OPTS = {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 30000,
  family: 4,
};

let retryCount = 0;
const MAX_RETRIES = 5;

async function connectWithRetry() {
  try {
    console.log(`[DB] Connecting to MongoDB... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
    await mongoose.connect(MONGO_URI, MONGO_OPTS);
    console.log("[DB] ✅ MongoDB connected successfully\n");
    retryCount = 0;
  } catch (err) {
    retryCount++;
    console.error(`[DB] ❌ Connection failed: ${err.message}`);

    if (retryCount < MAX_RETRIES) {
      const delay = Math.min(5000 * retryCount, 30000);
      console.log(`[DB] Retrying in ${delay / 1000}s...`);
      setTimeout(connectWithRetry, delay);
    } else {
      console.error("[DB] Max retries reached. Please check:");
      console.error("  1. MongoDB Atlas cluster is RUNNING (not paused)");
      console.error("  2. Your IP is whitelisted → Atlas > Network Access > Add 0.0.0.0/0");
      console.error("  3. Internet connection is active");
      console.error("[DB] Server still running — will retry on next restart.\n");
    }
  }
}

mongoose.connection.on("disconnected", () => {
  console.warn("[DB] Disconnected. Attempting reconnect...");
  if (retryCount < MAX_RETRIES) connectWithRetry();
});

connectWithRetry();