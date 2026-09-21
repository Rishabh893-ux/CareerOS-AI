const express = require("express");
const authMiddleware = require("../middleware/auth");
const { callAI } = require("../services/aiService");
const { isStale } = require("../services/cacheUtils");
const { findProfileOr404, getMergedSkills } = require("../services/profileUtils");

const router = express.Router();
router.use(authMiddleware);

// --- Skill Gap Analysis ---
router.post("/skill-gap", async (req, res) => {
  try {
    const { targetRole } = req.body;
    if (!targetRole) return res.status(400).json({ error: "targetRole is required" });

    const forceRefresh = req.query.refresh === "true";
    const profile = await findProfileOr404(req.userId, res);
    if (!profile) return;

    const cached = profile.skillGap;
    const sameRole = cached?.targetRole === targetRole;

    if (cached && sameRole && !forceRefresh && !isStale(cached.computedAt)) {
      return res.json({ ...cached.toObject(), fromCache: true });
    }

    const currentSkills = getMergedSkills(profile);

    const prompt = `A student has these current skills: ${JSON.stringify(currentSkills)}.
Their target role is: "${targetRole}".

Identify the skills they are MISSING for this role, most important first.
Return ONLY JSON: { "missingSkills": ["skill1", "skill2", ...] } (max 10 items)`;

    const result = await callAI("skill_gap", prompt, {
      jsonSchemaHint: true,
      fallbackData: sameRole ? cached?.toObject() : null,
    });

    if (!result.success && !result.data) {
      return res.status(503).json({ error: result.error });
    }

    const missingSkills = Array.isArray(result.data?.missingSkills) ? result.data.missingSkills : [];
    const skillGap = {
      targetRole,
      missingSkills,
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
    const profile = await findProfileOr404(req.userId, res);
    if (!profile) return;

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

    const result = await callAI("roadmap", prompt, {
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

// --- Career Path Ladder (title progression toward the target role) ---
router.post("/career-path", async (req, res) => {
  try {
    const { targetRole } = req.body;
    if (!targetRole) return res.status(400).json({ error: "targetRole is required" });

    const forceRefresh = req.query.refresh === "true";
    const profile = await findProfileOr404(req.userId, res);
    if (!profile) return;

    const cached = profile.careerPath;
    const sameRole = cached?.targetRole === targetRole;

    if (cached && sameRole && !forceRefresh && !isStale(cached.computedAt)) {
      return res.json({ ...cached.toObject(), fromCache: true });
    }

    const currentSkills = getMergedSkills(profile);

    const prompt = `A student/early-career candidate with these current skills: ${JSON.stringify(currentSkills)} wants to reach this target role: "${targetRole}".

Return a realistic title-progression career ladder from an entry point toward and slightly beyond the target role (4-6 rungs). Use standard industry title conventions for this field (e.g. Junior -> Mid -> Senior -> Staff/Lead, or the equivalent progression for the given field if it isn't software engineering).

Return ONLY JSON in this exact shape:
{
  "ladder": [
    { "title": "...", "yearsRange": "e.g. 0-1 yrs", "description": "1 sentence on what changes at this level (scope, ownership, expectations)" }
  ]
}`;

    const result = await callAI("career_path", prompt, {
      jsonSchemaHint: true,
      fallbackData: sameRole ? cached?.toObject() : null,
    });

    if (!result.success && !result.data) {
      return res.status(503).json({ error: result.error });
    }

    const careerPath = {
      targetRole,
      ladder: Array.isArray(result.data?.ladder) ? result.data.ladder : [],
      computedAt: result.success ? new Date() : cached?.computedAt,
    };

    if (result.success) {
      profile.careerPath = careerPath;
      await profile.save();
    }

    res.json(careerPath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
