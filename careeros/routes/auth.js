const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const Profile = require("../models/Profile");

const router = express.Router();

// User.email is stored lowercased and trimmed, so lookups must match that.
const normalizeEmail = (email) => (typeof email === "string" ? email.trim().toLowerCase() : "");

router.post("/register", async (req, res) => {
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

router.post("/login", async (req, res) => {
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

// One shared, read-and-play demo account - lets a visitor explore every
// feature with realistic pre-filled data, no signup required. Seeded once
// on first use; subsequent calls just re-issue a token for the same user.
const DEMO_EMAIL = "demo@careeros.ai";

router.post("/demo", async (req, res) => {
  try {
    let user = await User.findOne({ email: DEMO_EMAIL });

    if (!user) {
      const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
      user = await User.create({
        name: "Alex Rivera",
        email: DEMO_EMAIL,
        passwordHash,
        username: "demo",
        githubUsername: "octocat",
      });

      const now = new Date();
      try {
        await Profile.create({
          user: user._id,
          phone: "+1 (555) 010-1234",
          location: "Remote",
          careerGoal: "Seeking a Backend/Cloud Software Engineer role at a product-focused team.",
          skills: ["JavaScript", "TypeScript", "Node.js", "React", "MongoDB", "PostgreSQL", "Docker", "AWS", "GraphQL", "System Design"],
          resumeExtractedSkills: ["Node.js", "React", "MongoDB"],
          education: [
            { institute: "State University", degree: "B.Tech", branch: "Computer Science", cgpa: 8.7, graduationYear: 2024 },
          ],
          experience: [
            {
              company: "Nimbus Cloud Systems",
              role: "Software Engineer",
              startDate: "Jul 2024",
              endDate: "Present",
              description: "- Built and shipped internal tooling used by 40+ engineers daily\n- Migrated a legacy REST service to GraphQL, cutting client round-trips by 35%\n- On-call rotation for a payments microservice handling 200k+ requests/day",
            },
            {
              company: "Brightline Labs",
              role: "Software Engineering Intern",
              startDate: "May 2023",
              endDate: "Aug 2023",
              description: "- Built a real-time notifications feature with WebSockets\n- Wrote integration tests that caught 3 production-bound regressions pre-launch",
            },
          ],
          certifications: [
            { name: "AWS Certified Developer – Associate", issuer: "Amazon Web Services", date: "2024" },
          ],
          projects: [
            {
              title: "CareerOS AI",
              description: "This app — an AI career-readiness platform with resume parsing, ATS scoring, mock interviews, and a job tracker.",
              techStack: ["Next.js", "Express", "MongoDB", "Groq"],
              repoUrl: "github.com/octocat/careeros-ai",
            },
            {
              title: "Pantry — Recipe Sharing API",
              description: "A REST API for a recipe-sharing app with search, ratings, and image uploads. Deployed with CI/CD on push to main.",
              techStack: ["Node.js", "PostgreSQL", "Docker"],
              repoUrl: "github.com/octocat/pantry-api",
            },
            {
              title: "Latency Tracker",
              description: "A small CLI that pings a list of endpoints on a schedule and alerts on latency regressions.",
              techStack: ["Go", "SQLite"],
              repoUrl: "github.com/octocat/latency-tracker",
            },
          ],
          careerScore: {
            score: 78,
            strengths: [
              "Solid full-stack project portfolio with real deployed work",
              "Consistent GitHub activity across multiple languages",
              "Relevant internship-to-full-time career progression",
            ],
            weaknesses: [
              "Limited large-scale distributed systems experience",
              "No public technical writing or conference talks yet",
            ],
            computedAt: now,
          },
          githubAnalysis: {
            score: 71,
            summary: "Active contributor with a healthy mix of backend and tooling projects; commit history shows consistent, incremental work rather than one-off dumps.",
            topLanguages: ["JavaScript", "TypeScript", "Go"],
            repos: [
              { name: "careeros-ai", description: "AI career-readiness platform", language: "TypeScript", stars: 12, html_url: "https://github.com/octocat" },
              { name: "pantry-api", description: "Recipe sharing REST API", language: "JavaScript", stars: 4, html_url: "https://github.com/octocat" },
              { name: "latency-tracker", description: "Endpoint latency alerting CLI", language: "Go", stars: 2, html_url: "https://github.com/octocat" },
            ],
            computedAt: now,
          },
          skillGap: {
            targetRole: "Backend/Cloud Software Engineer",
            missingSkills: ["Kubernetes", "Terraform", "Kafka", "gRPC"],
            computedAt: now,
          },
          roadmap: {
            targetRole: "Backend/Cloud Software Engineer",
            steps: [
              { title: "Learn Kubernetes fundamentals", description: "Deploy an existing project to a local k8s cluster (kind/minikube).", resourceHint: "Kubernetes official docs + a hands-on course" },
              { title: "Get hands-on with Terraform", description: "Recreate your current AWS setup as Infrastructure-as-Code.", resourceHint: "HashiCorp Terraform tutorials" },
              { title: "Understand event-driven architecture", description: "Build a small producer/consumer service using Kafka or a managed equivalent.", resourceHint: "Kafka official quickstart" },
            ],
            computedAt: now,
          },
        });
      } catch (profileErr) {
        await User.findByIdAndDelete(user._id);
        throw profileErr;
      }
    }

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

router.put("/settings", authMiddleware, async (req, res) => {
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

router.post("/forgot-password", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User with this email does not exist" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "https://careeros-ai-phi.vercel.app";
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Dummy email log if nodemailer not configured properly
    console.log(`[Email] Password reset link for ${email}: ${resetUrl}`);

    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      const mailOptions = {
        from: process.env.SMTP_EMAIL,
        to: user.email,
        subject: "CareerOS AI Password Reset",
        text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
          Please click on the following link, or paste this into your browser to complete the process:\n\n
          ${resetUrl}\n\n
          If you did not request this, please ignore this email and your password will remain unchanged.\n`,
      };

      await transporter.sendMail(mailOptions);
      res.json({ message: "Password reset link sent to your email!" });
    } else {
      res.json({ message: `Testing Mode: No email server configured. Your reset link is: ${resetUrl}` });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/reset-password", async (req, res) => {
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
