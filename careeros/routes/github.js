const express = require("express");
const User = require("../models/User");
const Profile = require("../models/Profile");
const authMiddleware = require("../middleware/auth");
const { fetchGithubSummary, GithubError } = require("../services/githubService");
const { analyzeGithub } = require("../services/githubScoring");
const { callAI } = require("../services/aiService");
const { isStale } = require("../services/cacheUtils");

const router = express.Router();
router.use(authMiddleware);

// Used when the AI is unavailable: a plain summary built from the signals.
function fallbackSummary({ signals, metrics }) {
  const sorted = [...signals].sort((a, b) => b.score / b.max - a.score / a.max);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const langs = metrics.languages.slice(0, 3).map((l) => l.name).join(", ");
  return `${metrics.repoCount} original repositories${langs ? `, mostly ${langs}` : ""}. Strongest area: ${best.label.toLowerCase()} (${best.detail}). Biggest opportunity: ${worst.label.toLowerCase()} (${worst.detail}).`;
}

router.get("/analyze", async (req, res) => {
  try {
    const isRefresh = req.query.refresh === "true";

    const [user, profile] = await Promise.all([
      User.findById(req.userId),
      Profile.findOne({ user: req.userId }),
    ]);
    if (!user?.githubUsername) {
      return res.status(400).json({ error: "No GitHub username linked. Add it in Settings or Edit Profile first." });
    }
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    // Serve the cached analysis unless explicitly refreshed or stale. Analyses
    // from before signals existed are recomputed so the card can show them.
    const cached = profile.githubAnalysis;
    if (!isRefresh && cached?.signals?.length && !isStale(cached.computedAt)) {
      return res.json(cached);
    }

    const ghSummary = await fetchGithubSummary(user.githubUsername);
    const analysis = analyzeGithub(ghSummary);

    const topRepos = ghSummary.repos
      .filter((r) => !r.archived)
      .slice(0, 10)
      .map((r) => ({ name: r.name, description: r.description, language: r.language, stars: r.stars, hasReadme: r.hasReadme, liveDemo: !!r.homepage }));

    const prompt = `You are reviewing a developer's GitHub for a recruiter-facing career tool.
Measured facts (the only facts you may use):
${JSON.stringify({ score: analysis.score, signals: analysis.signals.map(({ label, score, max, detail }) => ({ label, score, max, detail })), languages: analysis.metrics.languages.slice(0, 5), recentRepos: topRepos })}

Write a 2-3 sentence assessment: what their GitHub shows they build, their strongest signal, and the single most valuable improvement.
Do not invent facts that aren't in the data above (no guesses about code quality, tests or commit history), and don't restate the numeric score.
When you mention a count, use the exact number from the data (say "10 of 13 repos", never "all" or "most").
Return ONLY JSON: { "summary": "..." }`;

    const result = await callAI("github_analysis", prompt, { jsonSchemaHint: true });
    const aiSummary = result.success && typeof result.data?.summary === "string" ? result.data.summary.trim() : "";

    profile.githubAnalysis = {
      score: analysis.score,
      summary: aiSummary || fallbackSummary(analysis),
      topLanguages: analysis.metrics.languages.slice(0, 5).map((l) => l.name),
      signals: analysis.signals,
      recommendations: analysis.recommendations,
      metrics: analysis.metrics,
      repos: ghSummary.repos
        .filter((r) => !r.archived)
        .map(({ name, description, language, stars, updatedAt, html_url, homepage, hasReadme }) => ({
          name, description, language, stars, updatedAt, html_url, homepage, hasReadme,
        })),
      computedAt: new Date(),
    };
    await profile.save();

    res.json(profile.githubAnalysis);
  } catch (err) {
    if (err instanceof GithubError) return res.status(err.status).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
