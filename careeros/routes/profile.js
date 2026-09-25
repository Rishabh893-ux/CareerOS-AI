const express = require("express");
const Profile = require("../models/Profile");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const { findProfileOr404, getMergedSkills } = require("../services/profileUtils");

const router = express.Router();

// Public route to fetch a user's portfolio by username
router.get("/public/:username", async (req, res) => {
  try {
    const user = await User.findOne({
      $or: [
        { username: req.params.username.toLowerCase() },
        { _id: req.params.username.match(/^[0-9a-fA-F]{24}$/) ? req.params.username : null }
      ]
    }).select("name email githubUsername linkedinUrl");
    if (!user) return res.status(404).json({ error: "Portfolio not found" });

    const profile = await Profile.findOne({ user: user._id }).select("education skills resumeExtractedSkills projects careerGoal experience certifications githubAnalysis careerScore location portfolioUrl resumeUrl");
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    // Show resume-extracted skills too, same as the dashboard does.
    const publicProfile = profile.toObject();
    publicProfile.skills = getMergedSkills(profile);
    delete publicProfile.resumeExtractedSkills;

    res.json({
      user: {
        name: user.name,
        githubUsername: user.githubUsername,
        linkedinUrl: user.linkedinUrl
      },
      profile: publicProfile
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const profile = await findProfileOr404(req.userId, res);
    if (!profile) return;
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/", async (req, res) => {
  try {
    const allowedFields = ["education", "skills", "resumeExtractedSkills", "projects", "careerGoal", "experience", "certifications", "phone", "location", "portfolioUrl"];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const profile = await Profile.findOneAndUpdate(
      { user: req.userId },
      { $set: updates },
      { new: true, upsert: true }
    );

    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
