const express = require("express");
const Profile = require("../models/Profile");
const JobApplication = require("../models/JobApplication");
const authMiddleware = require("../middleware/auth");
const { callGemini } = require("../services/geminiService");

const router = express.Router();
router.use(authMiddleware);

router.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "question is required" });

    const profile = await Profile.findOne({ user: req.userId });
    const jobs = await JobApplication.find({ user: req.userId }).select("company role status");

    // Context is built from CACHED analysis only - copilot never triggers
    // a fresh GitHub/career score computation itself, to avoid hidden quota burn.
    const context = {
      skills: profile?.skills,
      careerGoal: profile?.careerGoal,
      careerScore: profile?.careerScore
        ? { score: profile.careerScore.score, weaknesses: profile.careerScore.weaknesses }
        : "not yet computed - tell user to run /career/score first",
      githubScore: profile?.githubAnalysis?.score ?? "not yet computed",
      linkedinScore: profile?.linkedinAnalysis?.score ?? "not yet computed",
      skillGap: profile?.skillGap?.missingSkills ?? "not yet computed - tell user to run /growth/skill-gap",
      roadmap: profile?.roadmap?.steps?.map((s) => s.title) ?? "not yet computed",
      applications: jobs,
    };

    const prompt = `You are CareerOS AI Copilot, a career advisor for a student.
Use this context about the user:
${JSON.stringify(context)}

If a score or analysis is "not yet computed", tell the user which feature to run first instead of guessing.
Answer concisely and actionably.

User question: "${question}"`;

    const result = await callGemini("ai_copilot", prompt);

    if (!result.success) {
      return res.status(503).json({
        error: result.error,
        message: "Copilot is temporarily unavailable (quota/rate limit). Try again in a bit.",
      });
    }

    res.json({ answer: result.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
