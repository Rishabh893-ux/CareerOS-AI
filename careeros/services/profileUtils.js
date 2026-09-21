const Profile = require("../models/Profile");

// Shared "load profile or send 404" used by routes that require an existing
// profile document. Returns null after writing the 404 response so callers
// can just `if (!profile) return;`.
async function findProfileOr404(userId, res) {
  const profile = await Profile.findOne({ user: userId });
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return null;
  }
  return profile;
}

function getMergedSkills(profile) {
  return [...new Set([...(profile.skills || []), ...(profile.resumeExtractedSkills || [])])];
}

module.exports = { findProfileOr404, getMergedSkills };
