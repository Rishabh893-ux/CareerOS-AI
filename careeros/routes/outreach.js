const express = require("express");
const authMiddleware = require("../middleware/auth");
const Profile = require("../models/Profile");
const { callAI } = require("../services/aiService");

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

    const result = await callAI("generate_outreach", prompt);
    if (!result.success) {
      return res.status(503).json({ error: result.error });
    }

    res.json({ message: result.data.trim() });
  } catch (err) {
    console.error("[Outreach AI] Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/research", authMiddleware, async (req, res) => {
  try {
    const { companyName, targetRole } = req.body;
    if (!companyName) {
      return res.status(400).json({ error: "Company name is required" });
    }

    const prompt = `You are an expert career coach helping a candidate prepare talking points for outreach or an interview with "${companyName}"${targetRole ? ` for the role "${targetRole}"` : ""}.

You do NOT have live/current data on this specific company, so you must NEVER invent specific facts: no fabricated funding numbers, exact dates, named executives, "recently announced" products, or news you cannot verify. Instead, give the candidate a generically-informed prep brief based on what is publicly knowable about companies of this type/industry, and explicitly tell them what to go verify themselves.

Return ONLY JSON in this exact shape:
{
  "industryContext": "1-2 sentences on the likely industry/sector this company is in and what tends to matter for companies like it (based on the name/role, reasoned generally, not asserted as fact)",
  "likelyPriorities": ["3-4 plausible priorities a company like this may care about right now, phrased as hypotheses not facts"],
  "talkingPoints": ["3-4 ways the candidate could connect their own background to a company like this in outreach or an interview"],
  "smartQuestions": ["3-4 thoughtful questions the candidate could ask that work well for this type of company/role"],
  "verifyBeforeYouGo": ["3-5 specific things the candidate should look up themselves right before reaching out — e.g. recent news, funding stage, leadership, product launches, glassdoor reviews — framed as a checklist, not answered"]
}`;

    const result = await callAI("company_research", prompt, { jsonSchemaHint: true });
    if (!result.success) {
      return res.status(503).json({ error: result.error });
    }

    if (typeof result.data === "string") {
      return res.status(500).json({ error: "AI returned an invalid format. Please try again." });
    }

    res.json({
      companyName,
      industryContext: result.data.industryContext || "",
      likelyPriorities: Array.isArray(result.data.likelyPriorities) ? result.data.likelyPriorities : [],
      talkingPoints: Array.isArray(result.data.talkingPoints) ? result.data.talkingPoints : [],
      smartQuestions: Array.isArray(result.data.smartQuestions) ? result.data.smartQuestions : [],
      verifyBeforeYouGo: Array.isArray(result.data.verifyBeforeYouGo) ? result.data.verifyBeforeYouGo : [],
    });
  } catch (err) {
    console.error("[Company Research] Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
