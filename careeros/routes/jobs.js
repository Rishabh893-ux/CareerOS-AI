const express = require("express");
const JobApplication = require("../models/JobApplication");
const Profile = require("../models/Profile");
const authMiddleware = require("../middleware/auth");
const { callGemini } = require("../services/geminiService");
const { analyzeJobMatch } = require("../services/jobMatchService");

const router = express.Router();
router.use(authMiddleware);

// List all tracked jobs for this user
router.get("/", async (req, res) => {
  const jobs = await JobApplication.find({ user: req.userId }).sort({ updatedAt: -1 });
  res.json(jobs);
});

// Live job search endpoint (Adzuna Integration) - MUST be before /:id routes
router.get("/search", async (req, res) => {
  try {
    const what = req.query.what || "";
    const where = req.query.where || "";
    const country = req.query.country || "in"; // default to India
    const page = req.query.page || 1;

    const appId = process.env.ADZUNA_APP_ID;
    const apiKey = process.env.ADZUNA_API_KEY;

    // If Adzuna keys are not configured, serve mock data gracefully
    if (!appId || !apiKey || appId === "your_adzuna_app_id" || apiKey === "your_adzuna_api_key") {
      console.warn("[Jobs API] Adzuna credentials missing, serving mock jobs fallback.");
      return res.json(getMockJobs(what, where));
    }

    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?app_id=${appId}&app_key=${apiKey}&results_per_page=15&what=${encodeURIComponent(what)}&where=${encodeURIComponent(where)}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Adzuna API returned status ${response.status}`);
    }

    const data = await response.json();
    const formattedJobs = (data.results || []).map((j) => ({
      title: j.title.replace(/<\/?[^>]+(>|$)/g, ""),
      company: j.company?.display_name || "Unknown Company",
      location: j.location?.display_name || where || "Remote",
      description: j.description.replace(/<\/?[^>]+(>|$)/g, ""),
      redirect_url: j.redirect_url,
      salary: j.salary_min ? `${j.salary_min} - ${j.salary_max || ""}` : "Not Disclosed",
    }));

    res.json(formattedJobs);
  } catch (err) {
    console.error("[Jobs API Error]:", err.message);
    res.json(getMockJobs(req.query.what || "", req.query.where || ""));
  }
});

// Track a new job application
router.post("/", async (req, res) => {
  try {
    const { company, role, jobUrl, status, notes, appliedOn, jobDescription } = req.body;
    if (!company || !role) return res.status(400).json({ error: "company and role are required" });

    const jobData = {
      user: req.userId,
      company,
      role,
      jobUrl,
      status,
      notes,
      appliedOn,
    };

    if (jobDescription) {
      jobData.jobDescription = jobDescription;
      jobData.matchStatus = "pending";
    }

    const job = await JobApplication.create(jobData);
    
    // Trigger background analysis if description provided
    if (jobDescription) {
      analyzeJobMatch(job._id, req.userId).catch(console.error); // Fire and forget
    }

    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a job (status, notes, etc.)
router.put("/:id", async (req, res) => {
  try {
    const job = await JobApplication.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { $set: req.body },
      { new: true }
    );
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a tracked job
router.delete("/:id", async (req, res) => {
  const result = await JobApplication.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!result) return res.status(404).json({ error: "Job not found" });
  res.json({ message: "Deleted" });
});

// Mock job data fallback
function getMockJobs(what, where) {
  const query = what || "Full Stack Developer";
  const loc = where || "Bengaluru, India";
  return [
    {
      title: `${query} (Internship)`,
      company: "InnovateTech Labs",
      location: loc,
      description: `Exciting opportunity for a junior candidate specializing in ${query}. You will work with Node.js, React, and databases.`,
      redirect_url: "https://example.com/jobs/1",
      salary: "₹30,000 - ₹45,000 per month",
    },
    {
      title: `Associate ${query}`,
      company: "CloudFlow Systems",
      location: "Remote",
      description: `We are looking for an Associate specializing in ${query} to join our agile product team. Core stack: MERN with TypeScript.`,
      redirect_url: "https://example.com/jobs/2",
      salary: "₹6,00,000 - ₹9,00,000 per annum",
    },
    {
      title: `Junior Software Engineer (${query})`,
      company: "DeltaCorp Software",
      location: loc,
      description: `Collaborate with seniors to build products. Perfect fit for recent CSE/IT graduates looking for a career track in ${query}.`,
      redirect_url: "https://example.com/jobs/3",
      salary: "₹4,00,000 per annum",
    },
    {
      title: `Software Development Engineer - I (${query})`,
      company: "Huron Technologies",
      location: loc,
      description: `Responsible for designing components, managing code commits, and optimizing service scalability. Require basic knowledge in SQL.`,
      redirect_url: "https://example.com/jobs/4",
      salary: "₹8,00,000 - ₹12,00,000 per annum",
    },
  ];
}

module.exports = router;
