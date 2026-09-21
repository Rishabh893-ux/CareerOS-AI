const express = require("express");
const User = require("../models/User");
const Profile = require("../models/Profile");
const authMiddleware = require("../middleware/auth");
const { fetchGithubSummary } = require("../services/githubService");
const { callAI } = require("../services/aiService");
const { isStale } = require("../services/cacheUtils");

const router = express.Router();
router.use(authMiddleware);

router.get("/analyze", async (req, res) => {
  try {
    const isRefresh = req.query.refresh === "true";

    const [user, profile] = await Promise.all([
      User.findById(req.userId),
      Profile.findOne({ user: req.userId }),
    ]);
    if (!user?.githubUsername) {
      return res.status(400).json({ error: "No GitHub username linked. Set it via PUT /profile/links first." });
    }
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    // Serve cached analysis unless explicitly refreshed or stale beyond TTL
    const cached = profile.githubAnalysis;

    if (!isRefresh && cached && !isStale(cached.computedAt)) {
      console.log("[GitHub] Serving cached analysis");
      return res.json(cached);
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

    const result = await callAI("github_analysis", prompt, {
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
