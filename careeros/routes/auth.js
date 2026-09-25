const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const Profile = require("../models/Profile");
const JobApplication = require("../models/JobApplication");

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
              repoUrl: "https://github.com/octocat/careeros-ai",
            },
            {
              title: "Pantry — Recipe Sharing API",
              description: "A REST API for a recipe-sharing app with search, ratings, and image uploads. Deployed with CI/CD on push to main.",
              techStack: ["Node.js", "PostgreSQL", "Docker"],
              repoUrl: "https://github.com/octocat/pantry-api",
            },
            {
              title: "Latency Tracker",
              description: "A small CLI that pings a list of endpoints on a schedule and alerts on latency regressions.",
              techStack: ["Go", "SQLite"],
              repoUrl: "https://github.com/octocat/latency-tracker",
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
          // Same shape the analyzer produces (services/githubScoring.js)
          githubAnalysis: {
            score: 69,
            summary: "Six original repositories spanning a TypeScript web platform, a JavaScript REST API and Go tooling. Activity is the strongest signal, with 4 repos pushed in the last 90 days. Adding live demo links and topics would do the most to strengthen the showcase.",
            topLanguages: ["TypeScript", "JavaScript", "Go"],
            signals: [
              { key: "documentation", label: "Documentation", score: 24, max: 30, detail: "5/6 recent repos have a README · 4/6 have a description" },
              { key: "activity", label: "Activity", score: 20, max: 25, detail: "4 repos pushed in the last 90 days · last push 12 days ago" },
              { key: "showcase", label: "Showcase", score: 11, max: 20, detail: "1 live demo link · 3/6 with topics · 4/6 licensed" },
              { key: "community", label: "Community", score: 8, max: 15, detail: "22 stars · 9 followers" },
              { key: "breadth", label: "Breadth", score: 6, max: 10, detail: "3 languages across 6 repos" },
            ],
            recommendations: [
              "Add live demo links to 2 more projects (About → Website).",
              "Add a README to dotfiles: what it does, how to run it, and a screenshot.",
              "Add a one-line description to dotfiles and scratchpad.",
              "Add topics (e.g. react, fastapi) to latency-tracker, dotfiles and scratchpad so they show up in skill searches.",
            ],
            metrics: {
              repoCount: 6, totalStars: 22, followers: 9, recentlyPushed: 4, daysSinceLastPush: 12,
              readmeChecked: 6, readmeCount: 5, descriptionCount: 4, demoCount: 1, topicsCount: 3, licenseCount: 4,
              hasProfileReadme: true,
              languages: [{ name: "TypeScript", share: 50 }, { name: "JavaScript", share: 33 }, { name: "Go", share: 17 }],
            },
            repos: [
              { name: "careeros-ai", description: "AI career-readiness platform", language: "TypeScript", stars: 12, html_url: "https://github.com/octocat/careeros-ai", hasReadme: true },
              { name: "pantry-api", description: "Recipe sharing REST API", language: "JavaScript", stars: 4, html_url: "https://github.com/octocat/pantry-api", hasReadme: true },
              { name: "latency-tracker", description: "Endpoint latency alerting CLI", language: "Go", stars: 2, html_url: "https://github.com/octocat/latency-tracker", hasReadme: true },
              { name: "design-tokens", description: "Shared color and type tokens for web apps", language: "TypeScript", stars: 3, html_url: "https://github.com/octocat/design-tokens", hasReadme: true },
              { name: "scratchpad", description: "", language: "TypeScript", stars: 1, html_url: "https://github.com/octocat/scratchpad", hasReadme: true },
              { name: "dotfiles", description: "", language: "JavaScript", stars: 0, html_url: "https://github.com/octocat/dotfiles", hasReadme: false },
            ],
            computedAt: now,
          },
          careerPath: {
            targetRole: "Backend/Cloud Software Engineer",
            ladder: [
              { title: "Software Engineer", yearsRange: "0–2 years", description: "Ship well-scoped features and own services end to end with review." },
              { title: "Senior Software Engineer", yearsRange: "3–5 years", description: "Design services, lead projects across a team, mentor juniors." },
              { title: "Staff Engineer", yearsRange: "6–9 years", description: "Set technical direction across teams and own platform-level decisions." },
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

        // A few applications across the board, so the Job Tracker isn't empty
        const daysAgo = (d) => new Date(now.getTime() - d * 86_400_000);
        await JobApplication.insertMany([
          {
            user: user._id, company: "Northwind Payments", role: "Backend Engineer", status: "Interviewing",
            jobUrl: "https://example.com/careers/northwind-backend", appliedOn: daysAgo(18),
            notes: "Recruiter screen went well. System design round on Friday.",
            jobDescription: "Backend Engineer to build payment APIs in Node.js and TypeScript on AWS, with PostgreSQL, Docker and Kubernetes. Nice to have: Kafka, GraphQL.",
            matchStatus: "completed", matchPercentage: 73, keywordSource: "ai", matchedAt: daysAgo(18),
            matchedSkills: ["Node.js", "TypeScript", "AWS", "PostgreSQL", "Docker", "GraphQL"], missingSkills: ["Kubernetes", "Kafka"],
            tips: ["Required skills your resume doesn't mention: Kubernetes. If you've used any, name them in your resume before applying.", "Nice-to-haves you could highlight if they apply: Kafka."],
          },
          {
            user: user._id, company: "Helios Cloud", role: "Platform Engineer", status: "Applied",
            jobUrl: "https://example.com/careers/helios-platform", appliedOn: daysAgo(6),
            jobDescription: "Platform Engineer working on Terraform, Kubernetes and AWS infrastructure, CI/CD with GitHub Actions, and Go tooling. Nice to have: Prometheus, Grafana.",
            matchStatus: "completed", matchPercentage: 45, keywordSource: "ai", matchedAt: daysAgo(6),
            matchedSkills: ["AWS", "Go", "Docker"], missingSkills: ["Terraform", "Kubernetes", "GitHub Actions", "Prometheus", "Grafana"],
            tips: ["Required skills your resume doesn't mention: Terraform, Kubernetes, GitHub Actions. If you've used any, name them in your resume before applying.", "Nice-to-haves you could highlight if they apply: Prometheus, Grafana."],
          },
          {
            user: user._id, company: "Lattice Labs", role: "Software Engineer II", status: "Wishlist",
            jobUrl: "https://example.com/careers/lattice-swe2",
          },
          {
            user: user._id, company: "Quill Analytics", role: "Full Stack Developer", status: "Rejected",
            jobUrl: "https://example.com/careers/quill-fullstack", appliedOn: daysAgo(30),
            notes: "Rejected after take-home. Feedback: add more tests.",
          },
        ]);
      } catch (profileErr) {
        await Promise.all([User.findByIdAndDelete(user._id), JobApplication.deleteMany({ user: user._id })]);
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
