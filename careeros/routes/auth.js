const express = require("express");
const validate = require("../middleware/validate");
const schemas = require("../validation/schemas");
const rateLimits = require("../middleware/rateLimits");
const { getFreshDemoUser } = require("../services/demoAccount");
const { sendMail } = require("../services/mailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const Profile = require("../models/Profile");

const router = express.Router();

// User.email is stored lowercased and trimmed, so lookups must match that.
const normalizeEmail = (email) => (typeof email === "string" ? email.trim().toLowerCase() : "");

router.post("/register", rateLimits.register, validate(schemas.register), async (req, res) => {
  try {
    const { name, password } = req.body;
    const email = normalizeEmail(req.body.email);
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    try {
      await Profile.create({ user: user._id }); // empty profile shell
    } catch (profileErr) {
      await User.findByIdAndDelete(user._id); // roll back the orphaned user
      throw profileErr;
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", rateLimits.login, validate(schemas.login), async (req, res) => {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Shared demo account (see services/demoAccount.js)
router.post("/demo", rateLimits.demo, async (req, res) => {
  try {
    const user = await getFreshDemoUser();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const authMiddleware = require("../middleware/auth");

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-passwordHash");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/settings", authMiddleware, validate(schemas.settings), async (req, res) => {
  try {
    // Partial update: only fields present in the body change, so callers can
    // send just { githubUsername } without touching name or username.
    const { username } = req.body;
    const $set = {};
    for (const field of ["name", "githubUsername", "linkedinUrl"]) {
      if (req.body[field] !== undefined) $set[field] = req.body[field];
    }

    // Check if username is already taken by someone else
    if (username) {
      const existing = await User.findOne({ username: username.toLowerCase(), _id: { $ne: req.userId } });
      if (existing) {
        return res.status(409).json({ error: "Username is already taken" });
      }
    }

    // username is unique+sparse: an empty string would still collide between
    // accounts, so clearing it must remove the field instead of storing "".
    const update = { $set };
    if (username) $set.username = username;
    else if (username !== undefined) update.$unset = { username: "" };
    const user = await User.findByIdAndUpdate(req.userId, update, { new: true }).select("-passwordHash");

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// The same reply whether or not the email has an account, so this endpoint
// can't be used to find out who is registered.
const RESET_REQUESTED = "If an account exists for that email, a password reset link has been sent to it.";

router.post("/forgot-password", rateLimits.passwordReset, validate(schemas.forgotPassword), async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: RESET_REQUESTED });

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "https://careeros-ai-phi.vercel.app";
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      // Without email, only local development may see the link. Anywhere else,
      // handing it back would let anyone reset anyone's password.
      if (process.env.NODE_ENV === "development") {
        console.log(`[Email] Password reset link for ${email}: ${resetUrl}`);
        return res.json({ message: `Development mode: no email server configured. Your reset link is: ${resetUrl}` });
      }
      console.error("[Email] SMTP_EMAIL / SMTP_PASSWORD not set; password reset email was not sent.");
      return res.json({ message: RESET_REQUESTED });
    }

    try {
      await sendMail({
        to: user.email,
        subject: "CareerOS AI Password Reset",
        text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        ${resetUrl}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`,
      });
    } catch (mailErr) {
      // Network and SMTP details stay in the server log, not on the user's screen
      console.error("[Email] Password reset email failed:", mailErr.code || "", mailErr.message);
      return res.status(503).json({ error: "We couldn't send the reset email right now. Please try again in a few minutes." });
    }
    res.json({ message: RESET_REQUESTED });
  } catch (err) {
    console.error("[Auth] forgot-password failed:", err.message);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

router.post("/reset-password", rateLimits.passwordReset, validate(schemas.resetPassword), async (req, res) => {
  try {
    const { token, password } = req.body;
    
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Password reset token is invalid or has expired" });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password has been successfully updated. You can now log in." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
