const mongoose = require("mongoose");

// Tracks AI calls per day per feature so we know exactly what's eating quota
// before we find out the hard way in production.
const usageLogSchema = new mongoose.Schema({
  date: { type: String, required: true, index: true }, // "YYYY-MM-DD"
  feature: {
    type: String,
    required: true,
    enum: [
      "career_score",
      "github_analysis",
      "ai_copilot",
      "job_match",
      "resume_parse",
      "ats_check",
      "skill_gap",
      "roadmap",
      "interview_questions",
      "mock_interview",
      "linkedin_analysis",
      "linkedin_post",
    ],
  },
  count: { type: Number, default: 0 },
});

usageLogSchema.index({ date: 1, feature: 1 }, { unique: true });

module.exports = mongoose.model("UsageLog", usageLogSchema);
