const express = require("express");
const User = require("../models/User");
const Profile = require("../models/Profile");
const authMiddleware = require("../middleware/auth");
const { fetchGithubSummary } = require("../services/githubService");
const { callGemini } = require("../services/geminiService");

const router = express.Router();
router.use(authMiddleware);

const CACHE_TTL_HOURS = parseInt(process.env.GEMINI_CACHE_TTL_HOURS || "24", 10);

router.get("/analyze", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true";

    const user = await User.findById(req.userId);
    if (!user?.githubUsername) {
      return res.status(400).json({ error: "No GitHub username linked. Set it via PUT /profile/links first." });
    }

    const profile = await Profile.findOne({ user: req.userId });

    // Serve cached analysis unless explicitly refreshed or stale beyond TTL
    const { force, refresh } = req.query;
    const isRefresh = force || refresh === "true";
    const cached = profile?.githubAnalysis;
    
    if (!isRefresh && cached && cached.computedAt) {
      const hoursSince = (new Date() - new Date(cached.computedAt)) / (1000 * 60 * 60);
      const ttl = process.env.GEMINI_CACHE_TTL_HOURS || 24;
      if (hoursSince < ttl) {
        console.log("[GitHub] Serving cached analysis");
        return res.json(cached);
      }
    }

    const ghSummary = await fetchGithubSummary(user.githubUsername);

    const prompt = `Analyze this GitHub profile summary and produce a career-readiness score.
Profile: ${JSON.stringify(ghSummary)}

Return ONLY JSON in this exact shape:
{
  "score": <0-100 integer>,
  "summary": "<2-3 sentence assessment>",
  "topLanguages": ["lang1", "lang2"]
}`;

    const result = await callGemini("github_analysis", prompt, {
      jsonSchemaHint: true,
      fallbackData: cached ? cached.toObject() : null,
    });

    if (!result.success && !result.data) {
      return res.status(503).json({ error: result.error });
    }

    const analysis = result.success
      ? { ...result.data, computedAt: new Date() }
      : { ...result.data, fromCache: true };

    if (result.success) {
      analysis.repos = ghSummary.repos;
      profile.githubAnalysis = analysis;
      await profile.save();
    }

    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
