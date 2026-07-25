const mongoose = require("mongoose");

const jobApplicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    company: { type: String, required: true },
    role: { type: String, required: true },
    jobUrl: { type: String },
    status: {
      type: String,
      enum: ["Wishlist", "Applied", "Interviewing", "Offer", "Rejected"],
      default: "Wishlist",
    },
    notes: { type: String },
    appliedOn: { type: Date },
    jobDescription: { type: String }, // Store the actual job posting text
    // Match fields
    matchStatus: { type: String, enum: ["pending", "completed", "failed"] },
    matchPercentage: { type: Number },
    missingSkills: [{ type: String }],
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    tips: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobApplication", jobApplicationSchema);
