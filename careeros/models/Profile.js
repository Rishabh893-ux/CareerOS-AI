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

    // Cached AI analysis results - avoids re-calling Claude on every dashboard load
    careerScore: {
      score: Number,
      strengths: [String],
      weaknesses: [String],
      computedAt: Date,
    },

    // Latest ATS check (see routes/resume.js); raw resume text isn't duplicated here
    lastAtsCheck: {
      mode: String, // "match" (against a JD) or "health" (no JD)
      score: Number,
      breakdown: { keywords: Number, format: Number },
      role: String,
      keywords: {
        required: [{ _id: false, term: String, found: Boolean }],
        preferred: [{ _id: false, term: String, found: Boolean }],
      },
      missingKeywords: [String],
      checks: [{ _id: false, key: String, label: String, pass: Boolean, partial: Boolean, detail: String }],
      suggestions: [String],
      keywordSource: String,
      resumeSource: String,
      checkedAt: Date,
    },
    githubAnalysis: {
      score: Number,
      summary: String,
      topLanguages: [String],
      // How the score was built (see services/githubScoring.js)
      signals: [{ _id: false, key: String, label: String, score: Number, max: Number, detail: String }],
      recommendations: [String],
      metrics: {
        repoCount: Number,
        totalStars: Number,
        followers: Number,
        recentlyPushed: Number,
        daysSinceLastPush: Number,
        readmeChecked: Number,
        readmeCount: Number,
        descriptionCount: Number,
        demoCount: Number,
        topicsCount: Number,
        licenseCount: Number,
        hasProfileReadme: Boolean,
        languages: [{ _id: false, name: String, share: Number }],
      },
      repos: [
        {
          name: String,
          description: String,
          language: String,
          stars: Number,
          updatedAt: String,
          html_url: String,
          homepage: String,
          hasReadme: Boolean,
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

    careerPath: {
      targetRole: String,
      ladder: [
        {
          title: String,
          yearsRange: String,
          description: String,
        },
      ],
      computedAt: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", profileSchema);
