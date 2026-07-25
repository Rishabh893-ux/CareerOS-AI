const express = require("express");
const Profile = require("../models/Profile");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Public route to fetch a user's portfolio by username
router.get("/public/:username", async (req, res) => {
  try {
    const user = await User.findOne({
      $or: [
        { username: req.params.username },
        { _id: req.params.username.match(/^[0-9a-fA-F]{24}$/) ? req.params.username : null }
      ]
    }).select("name email githubUsername linkedinUrl");
    if (!user) return res.status(404).json({ error: "Portfolio not found" });

    const profile = await Profile.findOne({ user: user._id }).select("education skills projects careerGoal experience certifications githubAnalysis location portfolioUrl");
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    res.json({
      user: {
        name: user.name,
        githubUsername: user.githubUsername,
        linkedinUrl: user.linkedinUrl
      },
      profile
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.userId });
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/", async (req, res) => {
  try {
    const allowedFields = ["education", "skills", "projects", "careerGoal", "experience", "certifications", "phone", "location", "portfolioUrl"];
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

// Get linked social handles
router.get("/links", async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("githubUsername linkedinUrl");
    res.json({ githubUsername: user?.githubUsername || "", linkedinUrl: user?.linkedinUrl || "" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Link GitHub/LinkedIn handles - stored on User, not Profile
router.put("/links", async (req, res) => {
  try {
    const { githubUsername, linkedinUrl } = req.body;
    const updates = {};
    if (githubUsername !== undefined) updates.githubUsername = githubUsername;
    if (linkedinUrl !== undefined) updates.linkedinUrl = linkedinUrl;

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true });
    res.json({ githubUsername: user.githubUsername, linkedinUrl: user.linkedinUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
