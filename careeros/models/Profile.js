const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    // Resume file lives in Cloudinary; we only store the URL + extracted summary here
    resumeUrl: { type: String },
    resumeExtractedSkills: [{ type: String }],
    resumeLastParsedAt: { type: Date },
    resumeRawText: { type: String }, // cached extracted text for ATS checks

    phone: { type: String },
    location: { type: String },
    portfolioUrl: { type: String },

    education: [
      {
        institute: String,
        degree: String,
        branch: String,
        cgpa: Number,
        graduationYear: Number,
      },
    ],

    experience: [
      {
        company: String,
        role: String,
        startDate: String,
        endDate: String,
        description: String
      }
    ],
    
    certifications: [
      {
        name: String,
        issuer: String,
        date: String,
        link: String
      }
    ],

    skills: [{ type: String }],

    projects: [
      {
        title: String,
        description: String, // short summary, not full README dump
        techStack: [String],
        repoUrl: String,
      },
    ],

    careerGoal: { type: String }, // e.g. "Full Stack Developer", "AI Engineer"

    // Cached AI analysis results - avoids re-calling Gemini on every dashboard load
    careerScore: {
      score: Number,
      strengths: [String],
      weaknesses: [String],
      computedAt: Date,
    },

    githubAnalysis: {
      score: Number,
      summary: String,
      topLanguages: [String],
      repos: [
        {
          name: String,
          description: String,
          language: String,
          stars: Number,
          updatedAt: String,
          html_url: String
        }
      ],
      computedAt: Date,
    },

    // LinkedIn has no scrapeable free API - user pastes their own text instead
    linkedinManualInput: {
      headline: String,
      about: String,
      skillsListed: [String],
    },
    linkedinAnalysis: {
      score: Number,
      headlineFeedback: String,
      aboutFeedback: String,
      suggestedHeadline: String,
      computedAt: Date,
    },

    skillGap: {
      targetRole: String,
      missingSkills: [String],
      computedAt: Date,
    },

    roadmap: {
      targetRole: String,
      steps: [
        {
          title: String,
          description: String,
          resourceHint: String,
        },
      ],
      computedAt: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", profileSchema);
