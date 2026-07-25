const mongoose = require("mongoose");

const interviewSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["HR", "Technical"], required: true },
    format: { type: String, enum: ["Written", "MCQ"], default: "Written" },
    topic: { type: String }, // e.g. "DSA", "DBMS", "OOPs" for Technical
    questions: [{ type: String }], // used for Written format
    mcqQuestions: [
      {
        question: String,
        options: [{ type: String }], // e.g. ["Option A", "Option B", ...]
        correctAnswer: String, // "A", "B", "C", or "D"
      }
    ], // used for MCQ format
    userAnswers: [{ type: String }], // optional, filled if user submits answers
    feedback: { type: String }, // AI feedback or MCQ final score details
    improvementAreas: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("InterviewSession", interviewSessionSchema);
