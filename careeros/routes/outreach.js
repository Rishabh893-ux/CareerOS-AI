const express = require("express");
const authMiddleware = require("../middleware/auth");
const Profile = require("../models/Profile");
const { callGemini } = require("../services/geminiService");

const router = express.Router();

router.post("/generate", authMiddleware, async (req, res) => {
  try {
    const { recipientName, companyName, targetRole, platform, context } = req.body;
    
    if (!companyName || !targetRole || !platform) {
      return res.status(400).json({ error: "Company name, target role, and platform are required" });
    }

    // Fetch user profile to ground the generation
    const profile = await Profile.findOne({ user: req.userId }).populate("user", "name");
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const userName = profile.user.name || "A professional";
    
    // Construct the prompt
    const prompt = `You are an expert career coach and executive communicator helping a candidate named ${userName} draft an outreach message.

Target Recipient: ${recipientName ? recipientName : "Hiring Manager / Recruiter"}
Company: ${companyName}
Target Role: ${targetRole}
Platform: ${platform} (Either "LinkedIn" or "Email")
Additional Context from User: ${context || "None"}

Candidate's Background Summary:
${profile.careerGoal || "No summary provided."}

Candidate's Top Skills:
${profile.skills?.join(", ") || "No specific skills listed."}

Instructions:
- If the platform is "LinkedIn", draft a connection request message strictly UNDER 300 characters. It should be punchy, polite, and end with a soft call to action.
- If the platform is "Email", draft a short, professional cold email (subject line + body). Keep it under 150 words. Focus on how the candidate's background aligns with ${companyName}.
- DO NOT use placeholders like [Your Phone Number] if possible, just end with a professional sign-off from ${userName}.
- The tone should be confident but not arrogant, and definitely not spammy or desperate.

Return ONLY the raw message text (and subject line if Email). Do not wrap it in markdown code blocks.`;

    const result = await callGemini("generate_outreach", prompt);
    if (!result.success) {
      return res.status(503).json({ error: result.error });
    }

    res.json({ message: result.data.trim() });
  } catch (err) {
    console.error("[Outreach AI] Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
