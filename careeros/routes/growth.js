const express = require("express");
const Profile = require("../models/Profile");
const authMiddleware = require("../middleware/auth");
const { callGemini } = require("../services/geminiService");

const router = express.Router();
router.use(authMiddleware);

const CACHE_TTL_HOURS = parseInt(process.env.GEMINI_CACHE_TTL_HOURS || "24", 10);

function isStale(computedAt) {
  return !computedAt || Date.now() - new Date(computedAt).getTime() > CACHE_TTL_HOURS * 60 * 60 * 1000;
}

// --- Skill Gap Analysis ---
router.post("/skill-gap", async (req, res) => {
  try {
    const { targetRole } = req.body;
    if (!targetRole) return res.status(400).json({ error: "targetRole is required" });

    const forceRefresh = req.query.refresh === "true";
    const profile = await Profile.findOne({ user: req.userId });
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const cached = profile.skillGap;
    const sameRole = cached?.targetRole === targetRole;

    if (cached && sameRole && !forceRefresh && !isStale(cached.computedAt)) {
      return res.json({ ...cached.toObject(), fromCache: true });
    }

    const currentSkills = [...new Set([...(profile.skills || []), ...(profile.resumeExtractedSkills || [])])];

    const prompt = `A student has these current skills: ${JSON.stringify(currentSkills)}.
Their target role is: "${targetRole}".

Identify the skills they are MISSING for this role, most important first.
Return ONLY JSON: { "missingSkills": ["skill1", "skill2", ...] } (max 10 items)`;

    const result = await callGemini("skill_gap", prompt, {
      jsonSchemaHint: true,
      fallbackData: sameRole ? cached?.toObject() : null,
    });

    if (!result.success && !result.data) {
      return res.status(503).json({ error: result.error });
    }

    const skillGap = {
      targetRole,
      missingSkills: result.data.missingSkills || result.data,
      computedAt: result.success ? new Date() : cached?.computedAt,
    };

    if (result.success) {
      profile.skillGap = skillGap;
      await profile.save();
    }

    res.json(skillGap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Roadmap Generator (builds on skill gap if already computed) ---
router.post("/roadmap", async (req, res) => {
  try {
    const { targetRole } = req.body;
    if (!targetRole) return res.status(400).json({ error: "targetRole is required" });

    const forceRefresh = req.query.refresh === "true";
    const profile = await Profile.findOne({ user: req.userId });
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const cached = profile.roadmap;
    const sameRole = cached?.targetRole === targetRole;

    if (cached && sameRole && !forceRefresh && !isStale(cached.computedAt)) {
      return res.json({ ...cached.toObject(), fromCache: true });
    }

    const missingSkills =
      profile.skillGap?.targetRole === targetRole ? profile.skillGap.missingSkills : [];

    const prompt = `Create a learning roadmap for a student targeting the role: "${targetRole}".
${missingSkills.length ? `Known missing skills to prioritize: ${JSON.stringify(missingSkills)}` : ""}

Return ONLY JSON in this shape, max 6 steps, ordered by priority:
{
  "steps": [
    { "title": "...", "description": "1-2 sentences", "resourceHint": "what type of resource to look for, e.g. 'freeCodeCamp course' or 'official docs', no specific URLs" }
  ]
}`;

    const result = await callGemini("roadmap", prompt, {
      jsonSchemaHint: true,
      fallbackData: sameRole ? cached?.toObject() : null,
    });

    if (!result.success && !result.data) {
      return res.status(503).json({ error: result.error });
    }

    const roadmap = {
      targetRole,
      steps: result.data.steps || [],
      computedAt: result.success ? new Date() : cached?.computedAt,
    };

    if (result.success) {
      profile.roadmap = roadmap;
      await profile.save();
    }

    res.json(roadmap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
