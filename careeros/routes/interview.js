const express = require("express");
const InterviewSession = require("../models/InterviewSession");
const authMiddleware = require("../middleware/auth");
const { callGemini } = require("../services/geminiService");

const router = express.Router();
router.use(authMiddleware);

// Generate a set of questions (HR or Technical) and save as a new session
router.post("/generate", async (req, res) => {
  try {
    const { type, topic, format = "Written", limit = 5 } = req.body; // type: "HR" | "Technical", format: "Written" | "MCQ", limit: 5 | 10 | 20
    if (!type || !["HR", "Technical"].includes(type)) {
      return res.status(400).json({ error: 'type must be "HR" or "Technical"' });
    }

    const numQuestions = [5, 10, 20].includes(parseInt(limit, 10)) ? parseInt(limit, 10) : 5;

    let sessionData = {
      user: req.userId,
      type,
      format,
      topic: topic || null,
    };

    if (format === "MCQ") {
      const prompt =
        type === "HR"
          ? `Generate exactly ${numQuestions} multiple-choice questions (MCQ) for a fresher HR/behavioral interview. Each question must have 4 logical options.
Return ONLY JSON in this shape:
{
  "questions": [
    {
      "question": "question text?",
      "options": ["option A", "option B", "option C", "option D"],
      "correctAnswer": "A"
    }
  ]
}
Note: correctAnswer must be a single letter ("A", "B", "C", or "D") corresponding to index 0, 1, 2, or 3.`
          : `Generate exactly ${numQuestions} technical multiple-choice questions (MCQ) on the topic "${topic || "general CS fundamentals"}" suitable for a B.Tech CSE candidate. Each question must have 4 logical options.
Return ONLY JSON in this shape:
{
  "questions": [
    {
      "question": "question text?",
      "options": ["option A", "option B", "option C", "option D"],
      "correctAnswer": "A"
    }
  ]
}
Note: correctAnswer must be a single letter ("A", "B", "C", or "D") corresponding to index 0, 1, 2, or 3.`;

      const result = await callGemini("interview_questions", prompt, { jsonSchemaHint: true });
      if (!result.success) return res.status(503).json({ error: result.error });

      sessionData.mcqQuestions = result.data.questions || [];
    } else {
      const prompt =
        type === "HR"
          ? `Generate exactly ${numQuestions} common HR interview questions for a fresher/internship candidate. Return ONLY JSON: { "questions": ["...", ...] }`
          : `Generate exactly ${numQuestions} technical interview questions on the topic "${topic || "general CS fundamentals"}" suitable for a B.Tech CSE internship candidate. Mix conceptual and applied questions. Return ONLY JSON: { "questions": ["...", ...] }`;

      const result = await callGemini("interview_questions", prompt, { jsonSchemaHint: true });
      if (!result.success) return res.status(503).json({ error: result.error });

      sessionData.questions = result.data.questions || [];
    }

    const session = await InterviewSession.create(sessionData);
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit answers to a session for feedback (mock interview evaluation)
router.post("/:id/feedback", async (req, res) => {
  try {
    const { answers } = req.body; // array of strings (user answers)
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: "answers array is required" });
    }

    const session = await InterviewSession.findOne({ _id: req.params.id, user: req.userId });
    if (!session) return res.status(404).json({ error: "Session not found" });

    if (session.format === "MCQ") {
      // Programmatic evaluation for MCQs to save API calls
      let score = 0;
      const total = session.mcqQuestions.length;
      const improvementAreas = [];

      session.mcqQuestions.forEach((q, index) => {
        const userAnswer = (answers[index] || "").trim().toUpperCase();
        if (userAnswer === q.correctAnswer.toUpperCase()) {
          score++;
        } else {
          improvementAreas.push(
            `Question ${index + 1}: "${q.question}" - You answered "${userAnswer}", correct was "${q.correctAnswer}"`
          );
        }
      });

      const percentage = Math.round((score / total) * 100);
      session.userAnswers = answers;
      session.feedback = `You scored ${score}/${total} (${percentage}%). ${
        percentage >= 70
          ? "Great job! You show good understanding of the topics."
          : "You might want to review the incorrect items to reinforce your understanding."
      }`;
      session.improvementAreas = improvementAreas;
      await session.save();

      res.json(session);
    } else {
      const qa = session.questions.map((q, i) => ({ question: q, answer: answers[i] || "(no answer)" }));

      const prompt = `Evaluate these mock interview answers for a ${session.type} interview${
        session.topic ? ` on ${session.topic}` : ""
      }.
${JSON.stringify(qa)}

Return ONLY JSON: { "feedback": "2-4 sentence overall feedback", "improvementAreas": ["area1", "area2"] }`;

      const result = await callGemini("mock_interview", prompt, { jsonSchemaHint: true });
      if (!result.success) return res.status(503).json({ error: result.error });

      session.userAnswers = answers;
      session.feedback = result.data.feedback;
      session.improvementAreas = result.data.improvementAreas || [];
      await session.save();

      res.json(session);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Interview journal - list past sessions
router.get("/", async (req, res) => {
  const sessions = await InterviewSession.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json(sessions);
});

router.delete("/:id", async (req, res) => {
  const result = await InterviewSession.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!result) return res.status(404).json({ error: "Session not found" });
  res.json({ message: "Deleted" });
});

module.exports = router;
