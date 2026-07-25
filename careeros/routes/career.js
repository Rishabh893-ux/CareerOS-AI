const express = require("express");
const Profile = require("../models/Profile");
const authMiddleware = require("../middleware/auth");
const { callGemini } = require("../services/geminiService");

const router = express.Router();
router.use(authMiddleware);

const CACHE_TTL_HOURS = parseInt(process.env.GEMINI_CACHE_TTL_HOURS || "24", 10);

router.get("/score", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true";
    const profile = await Profile.findOne({ user: req.userId });
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const cached = profile.careerScore;
    const isStale =
      !cached?.computedAt ||
      Date.now() - new Date(cached.computedAt).getTime() > CACHE_TTL_HOURS * 60 * 60 * 1000;

    if (cached && !forceRefresh && !isStale) {
      return res.json({ ...cached.toObject(), fromCache: true });
    }

    // Decision: weighting is OURS, not left to the model to invent -
    // 40% skills/projects, 30% GitHub activity, 30% career goal alignment.
    const context = {
      skills: profile.skills,
      resumeExtractedSkills: profile.resumeExtractedSkills,
      projects: profile.projects,
      careerGoal: profile.careerGoal,
      githubScore: profile.githubAnalysis?.score ?? null,
      githubSummary: profile.githubAnalysis?.summary ?? null,
    };

    const prompt = `You are scoring a student's career readiness using this exact weighting:
- 40% Skills & Project quality (based on skills list and project descriptions)
- 30% GitHub activity/score (given below, or treat as neutral if null)
- 30% Alignment with stated career goal

Profile data: ${JSON.stringify(context)}

Return ONLY JSON in this exact shape:
{
  "score": <0-100 integer>,
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."]
}`;

    const result = await callGemini("career_score", prompt, {
      jsonSchemaHint: true,
      fallbackData: cached ? cached.toObject() : null,
    });

    if (!result.success && !result.data) {
      return res.status(503).json({ error: result.error });
    }

    const scoreData = result.success
      ? { ...result.data, computedAt: new Date() }
      : { ...result.data, fromCache: true };

    if (result.success) {
      profile.careerScore = scoreData;
      await profile.save();
    }

    res.json(scoreData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
