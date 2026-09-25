const express = require("express");
const JobApplication = require("../models/JobApplication");
const authMiddleware = require("../middleware/auth");
const { analyzeJobMatch } = require("../services/jobMatchService");

const router = express.Router();
router.use(authMiddleware);

const STATUSES = ["Wishlist", "Applied", "Interviewing", "Offer", "Rejected"];

// List all tracked jobs for this user
router.get("/", async (req, res) => {
  const jobs = await JobApplication.find({ user: req.userId }).sort({ updatedAt: -1 });
  res.json(jobs);
});

// "₹6,00,000 – ₹9,00,000" instead of "600000 - 900000"
const CURRENCY = { in: ["INR", "en-IN"], us: ["USD", "en-US"], gb: ["GBP", "en-GB"], ca: ["CAD", "en-CA"], au: ["AUD", "en-AU"], de: ["EUR", "de-DE"] };
function formatSalary(min, max, country) {
  if (!min) return "";
  const [currency, locale] = CURRENCY[country] || CURRENCY.in;
  const fmt = (n) => new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  return max && max !== min ? `${fmt(min)} – ${fmt(max)}` : fmt(min);
}

// Live job search (Adzuna) - MUST be before /:id routes.
// Responds { results, source }: source "sample" means placeholder listings,
// which the UI labels clearly so they're never mistaken for real openings.
router.get("/search", async (req, res) => {
  let what = req.query.what || "";
  let where = req.query.where || "";
  const country = req.query.country || "in"; // default to India
  const page = req.query.page || 1;

  // Adzuna's `where` is a geocoding filter, not a remote-work flag - "Remote"
  // isn't a real place, so it silently returns zero results. Fold it into
  // the keyword search instead, where it actually matches listings.
  if (/\bremote\b/i.test(where)) {
    what = `${what} remote`.trim();
    where = where.replace(/\bremote\b/i, "").trim();
  }

  const appId = process.env.ADZUNA_APP_ID;
  const apiKey = process.env.ADZUNA_API_KEY;
  if (!appId || !apiKey || appId === "your_adzuna_app_id" || apiKey === "your_adzuna_api_key") {
    return res.json({ results: getMockJobs(what, where), source: "sample", notice: "Live search isn't configured, so these are sample listings." });
  }

  try {
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?app_id=${appId}&app_key=${apiKey}&results_per_page=20&what=${encodeURIComponent(what)}&where=${encodeURIComponent(where)}`;
    // Connections to Adzuna occasionally time out; one retry avoids falling back to samples
    const get = () => fetch(url, { signal: AbortSignal.timeout(15000) });
    const response = await get().catch(get);
    if (!response.ok) throw new Error(`Adzuna API returned status ${response.status}`);

    const stripHtml = (str) => (str || "").replace(/<\/?[^>]+(>|$)/g, "");
    const data = await response.json();
    const results = (data.results || []).map((j) => ({
      title: stripHtml(j.title) || "Untitled Role",
      company: j.company?.display_name || "Unknown Company",
      location: j.location?.display_name || where || "Remote",
      description: stripHtml(j.description),
      redirect_url: j.redirect_url,
      salary: formatSalary(j.salary_min, j.salary_max, country),
      postedAt: j.created || null,
    }));
    res.json({ results, source: "live", total: data.count || results.length });
  } catch (err) {
    console.error("[Jobs API Error]:", err.message);
    res.json({ results: getMockJobs(what, where), source: "sample", notice: "Live search is unavailable right now, so these are sample listings." });
  }
});

// Track a new job application
router.post("/", async (req, res) => {
  try {
    const { company, role, jobUrl, notes, jobDescription } = req.body;
    const status = STATUSES.includes(req.body.status) ? req.body.status : "Wishlist";
    if (!company?.trim() || !role?.trim()) return res.status(400).json({ error: "Company and role are required." });

    // The same posting tracked twice would split its notes and history
    if (jobUrl) {
      const existing = await JobApplication.findOne({ user: req.userId, jobUrl });
      if (existing) return res.status(409).json({ error: `You're already tracking ${existing.role} at ${existing.company}.`, job: existing });
    }

    const job = await JobApplication.create({
      user: req.userId,
      company: company.trim(),
      role: role.trim(),
      jobUrl,
      status,
      notes,
      appliedOn: req.body.appliedOn || (status !== "Wishlist" ? new Date() : undefined),
      ...(jobDescription?.trim() ? { jobDescription, matchStatus: "pending" } : {}),
    });

    if (job.matchStatus === "pending") analyzeJobMatch(job._id, req.userId).catch(console.error); // runs in the background
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a job (status, notes, dates, description, ...)
const JOB_UPDATABLE_FIELDS = ["company", "role", "jobUrl", "status", "notes", "appliedOn", "jobDescription"];

router.put("/:id", async (req, res) => {
  try {
    const job = await JobApplication.findOne({ _id: req.params.id, user: req.userId });
    if (!job) return res.status(404).json({ error: "Job not found" });

    const descriptionChanged = "jobDescription" in req.body && (req.body.jobDescription || "") !== (job.jobDescription || "");
    for (const field of JOB_UPDATABLE_FIELDS) {
      if (field in req.body) job[field] = req.body[field];
    }
    // Moving past Wishlist records when you applied, unless you set a date yourself
    if ("status" in req.body && req.body.status !== "Wishlist" && !job.appliedOn && !("appliedOn" in req.body)) {
      job.appliedOn = new Date();
    }
    if (descriptionChanged) {
      job.matchStatus = job.jobDescription?.trim() ? "pending" : undefined;
      job.matchPercentage = undefined;
    }

    await job.save();
    if (descriptionChanged && job.matchStatus === "pending") analyzeJobMatch(job._id, req.userId).catch(console.error);
    res.json(job);
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Re-run the match (after a failure, or after updating your resume)
router.post("/:id/analyze", async (req, res) => {
  try {
    const job = await JobApplication.findOne({ _id: req.params.id, user: req.userId });
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (!job.jobDescription?.trim()) return res.status(400).json({ error: "Add the job description first." });
    job.matchStatus = "pending";
    await job.save();
    analyzeJobMatch(job._id, req.userId).catch(console.error);
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

// Placeholder listings for when live search is unavailable (labelled "sample" in the response)
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
      salary: "₹30,000 – ₹45,000 per month",
    },
    {
      title: `Associate ${query}`,
      company: "CloudFlow Systems",
      location: "Remote",
      description: `We are looking for an Associate specializing in ${query} to join our agile product team. Core stack: MERN with TypeScript.`,
      redirect_url: "https://example.com/jobs/2",
      salary: "₹6,00,000 – ₹9,00,000 per annum",
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
      salary: "₹8,00,000 – ₹12,00,000 per annum",
    },
  ];
}

module.exports = router;
module.exports.formatSalary = formatSalary;
