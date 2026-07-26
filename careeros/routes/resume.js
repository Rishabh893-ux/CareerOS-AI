const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const pdfParseLib = require("pdf-parse");
const pdfParse = pdfParseLib.default || pdfParseLib; // handle both ESM default and CJS export
const fetch = require("node-fetch");
const Profile = require("../models/Profile");
const authMiddleware = require("../middleware/auth");
const { callGemini } = require("../services/geminiService");

const router = express.Router();
router.use(authMiddleware);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Accept PDF and images
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF, JPG, PNG, or WEBP files are accepted"));
  },
});

// ── Helper: extract text from PDF buffer ──
async function extractTextFromPdf(buffer) {
  try {
    // Try pdf-parse first
    const parsed = await pdfParse(buffer);
    if (parsed.text && parsed.text.trim().length > 50) {
      return parsed.text.trim();
    }
    throw new Error("PDF text too short");
  } catch (err) {
    console.warn("[PDF Parse] pdf-parse failed or empty, falling back to Gemini Vision");
    return null;
  }
}

// ── Helper: extract text from image or PDF via Gemini Vision ──
async function extractTextViaGeminiVision(buffer, mimeType) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const base64 = buffer.toString("base64");

  const body = {
    contents: [{
      parts: [
        {
          inline_data: {
            mime_type: mimeType === "application/pdf" ? "application/pdf" : mimeType,
            data: base64,
          },
        },
        {
          text: "Extract ALL text from this resume document exactly as it appears. Return only the raw text content, no commentary.",
        },
      ],
    }],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini Vision error ${res.status}: ${errText}`);
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No text extracted by Gemini Vision");
  return text.trim();
}

// ── POST /api/resume/upload — PDF or Image ──
router.post("/upload", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const isPdf = req.file.mimetype === "application/pdf";
    const isImage = req.file.mimetype.startsWith("image/");

    // 1. Upload to Cloudinary
    const resourceType = isPdf ? "raw" : "image";
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: resourceType, folder: "careeros_resumes" },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      stream.end(req.file.buffer);
    });

    const resumeUrl = uploadResult.secure_url;

    // 2. Extract text
    let resumeText = "";

    if (isPdf) {
      // Try pdf-parse first, fall back to Gemini Vision
      resumeText = await extractTextFromPdf(req.file.buffer);
      if (!resumeText) {
        console.log("[Resume] Falling back to Gemini Vision for PDF parsing");
        resumeText = await extractTextViaGeminiVision(req.file.buffer, req.file.mimetype);
      }
    } else if (isImage) {
      // Always use Gemini Vision for images
      console.log("[Resume] Using Gemini Vision for image parsing");
      resumeText = await extractTextViaGeminiVision(req.file.buffer, req.file.mimetype);
    }

    if (!resumeText || resumeText.length < 30) {
      return res.status(422).json({ error: "Could not extract readable text from the uploaded file. Please try a clearer PDF or image." });
    }

    // 3. Extract skills and full profile details using Gemini
    const prompt = `You are an expert AI Resume Parser. Extract the following information from the provided resume text.
Return ONLY a valid JSON object matching this exact shape:
{
  "phone": "Extracted phone number, if any",
  "location": "Extracted location (City, State/Country), if any",
  "portfolioUrl": "Extracted personal website or portfolio link, if any",
  "githubUrl": "Extracted GitHub URL, if any",
  "linkedinUrl": "Extracted LinkedIn URL, if any",
  "skills": ["skill1", "skill2"],
  "careerGoal": "The candidate's objective or target role. Always prefix with 'Objective: '",
  "education": [
    {
      "institute": "University Name",
      "degree": "Degree Name (e.g. B.Tech, BSc)",
      "branch": "Field of Study (e.g. Computer Science)",
      "cgpa": 8.5,
      "graduationYear": 2024
    }
  ],
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "startDate": "Start Month/Year",
      "endDate": "End Month/Year or Present",
      "description": "Short bullet points of what they did"
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "Month/Year or Year",
      "link": "Credential URL, if any"
    }
  ],
  "projects": [
    {
      "title": "Project Name",
      "description": "Short 1-2 sentence summary of what it does",
      "techStack": ["React", "Node", "MongoDB"],
      "repoUrl": "Optional URL if found"
    }
  ]
}

Ensure numeric values (cgpa, graduationYear) are numbers, not strings.
If any field is missing from the resume, leave it as an empty array or empty string, or null for numbers.
Do not include soft skills like "communication" in the skills array.

CRITICAL EXTRACTION RULES:
1. Differentiate clearly between Past Experience and Future Objectives.
2. If the text mentions applying for a role or an objective (e.g., "Applying for Intern at InMobi", "Seeking software engineer role"), put that under "careerGoal", not under "projects" or "education".
3. When writing the "careerGoal", it MUST be phrased as an objective (e.g. "Seeking an Analyst Intern position at InMobi Group to leverage my skills in..."). Do NOT phrase it as a statement of current employment (e.g. do NOT write "Analyst Intern at InMobi").
4. Ensure you capture the correct intent.

Resume text:
"""${resumeText.slice(0, 8000)}"""`;

    const result = await callGemini("resume_parse", prompt, { jsonSchemaHint: true });
    console.log("[Resume Parse] Gemini Success:", result.success, "Data:", result.data);
    
    let extractedSkills = [];
    let profile = null;

    if (result.success && result.data && typeof result.data === "object") {
      let { skills, careerGoal, education, experience, certifications, projects, phone, location, portfolioUrl, githubUrl, linkedinUrl } = result.data;
      if (typeof careerGoal === "string" && !careerGoal.startsWith("Objective: ")) {
        careerGoal = `Objective: ${careerGoal}`;
      }

      // Update basic fields on Profile
      const profileUpdates = {
        resumeUrl: resumeUrl,
        resumeRawText: resumeText.slice(0, 10000),
        resumeExtractedSkills: Array.isArray(skills) ? skills : [],
        resumeLastParsedAt: new Date(),
        careerGoal: careerGoal || "",
        education: Array.isArray(education) ? education : [],
        experience: Array.isArray(experience) ? experience : [],
        certifications: Array.isArray(certifications) ? certifications : [],
        projects: Array.isArray(projects) ? projects : []
      };
      
      if (phone) profileUpdates.phone = phone;
      if (location) profileUpdates.location = location;
      if (portfolioUrl) profileUpdates.portfolioUrl = portfolioUrl;

      // Update GitHub / LinkedIn on User if extracted
      const User = require("../models/User");
      const userUpdates = {};
      if (githubUrl) {
        // extract username from url if possible, or just save the url
        const ghMatch = githubUrl.match(/github\.com\/([^\/]+)/i);
        userUpdates.githubUsername = ghMatch ? ghMatch[1] : githubUrl;
      }
      if (linkedinUrl) userUpdates.linkedinUrl = linkedinUrl;
      
      if (Object.keys(userUpdates).length > 0) {
        await User.findByIdAndUpdate(req.userId, { $set: userUpdates });
      }

      profile = await Profile.findOneAndUpdate(
        { user: req.userId },
        { $set: profileUpdates },
        { new: true, upsert: true }
      );
      extractedSkills = profileUpdates.resumeExtractedSkills;

      res.json({
        message: "Resume uploaded and fully parsed successfully",
        resumeUrl,
        extractedSkills,
        profile,
      });
    } else {
      console.warn("[Resume Parse] Fallback! Did not receive valid JSON. Raw text:", result.data);
      res.json({
        message: "Resume parsed with fallback",
        resumeUrl,
        extractedSkills,
        profile,
      });
    }
  } catch (err) {
    console.error("[Resume Upload Error]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/resume/parse — raw text fallback ──
router.post("/parse", async (req, res) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText) return res.status(400).json({ error: "resumeText is required" });

    const prompt = `Extract a clean list of technical and professional skills from this resume text.
Return ONLY a JSON array of strings, lowercase, no duplicates, no soft skills like "communication".
Resume text:
"""${resumeText.slice(0, 6000)}"""`;

    const result = await callGemini("resume_parse", prompt, { jsonSchemaHint: true });
    if (!result.success) return res.status(503).json({ error: result.error });

    const skills = Array.isArray(result.data) ? result.data : [];
    const profile = await Profile.findOneAndUpdate(
      { user: req.userId },
      { $set: { resumeExtractedSkills: skills, resumeLastParsedAt: new Date() } },
      { new: true, upsert: true }
    );

    res.json({ extractedSkills: skills, profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/resume — remove parsed resume from profile ──
router.delete("/", async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { user: req.userId },
      { $unset: { resumeUrl: "", resumeRawText: "", resumeExtractedSkills: "", resumeLastParsedAt: "" } },
      { new: true }
    );
    res.json({ message: "Resume removed successfully", profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/resume/ats-check ──
router.post("/ats-check", upload.single("resume"), async (req, res) => {
  try {
    const { jobDescription = "Provide general feedback and a basic ATS score without a specific job description." } = req.body;

    let candidateProfile = {};

    // 1. If a file is uploaded, extract text directly from it
    if (req.file) {
      const isPdf = req.file.mimetype === "application/pdf";
      const isImage = req.file.mimetype.startsWith("image/");
      
      let resumeText = "";
      if (isPdf) {
        resumeText = await extractTextFromPdf(req.file.buffer);
        if (!resumeText) {
          resumeText = await extractTextViaGeminiVision(req.file.buffer, req.file.mimetype);
        }
      } else if (isImage) {
        resumeText = await extractTextViaGeminiVision(req.file.buffer, req.file.mimetype);
      }

      if (!resumeText || resumeText.length < 30) {
        return res.status(422).json({ error: "Could not extract text from the uploaded file for ATS check." });
      }

      candidateProfile = { resumeText };
    } 
    // 2. Otherwise fallback to the user's saved profile data
    else {
      const profile = await Profile.findOne({ user: req.userId });
      if (!profile) return res.status(404).json({ error: "Profile not found. Please upload your resume first or attach one." });

      candidateProfile = {
        skills: [...new Set([...(profile.skills || []), ...(profile.resumeExtractedSkills || [])])],
        education: profile.education || [],
        projects: profile.projects || [],
        careerGoal: profile.careerGoal || "",
        resumeText: profile.resumeRawText || "",
      };
    }

    const prompt = `You are an expert ATS (Applicant Tracking System) parser and technical recruiter.
Compare this candidate's profile against the job description.

Candidate Profile:
${JSON.stringify({ ...candidateProfile, resumeText: candidateProfile.resumeText?.slice(0, 2000) })}

Job Description:
"""${jobDescription.slice(0, 4000)}"""

Evaluate and return ONLY JSON in this exact shape:
{
  "score": <0-100 integer representing match quality>,
  "missingKeywords": ["keyword1", "keyword2", ...],
  "formattingFeedback": "1-2 sentences on resume structure and scan readability",
  "suggestions": ["suggestion1", "suggestion2", ...]
}`;

    const result = await callGemini("ats_check", prompt, { jsonSchemaHint: true });
    
    console.log("[ATS Check] Gemini Success:", result.success, "Data:", result.data);

    if (!result.success) return res.status(503).json({ error: result.error });

    if (typeof result.data === "string") {
      console.error("[ATS Check] Gemini returned invalid JSON:", result.data);
      return res.status(500).json({ error: "AI returned an invalid format. Please try again." });
    }

    res.json({
      score: result.data.score || 0,
      missingKeywords: Array.isArray(result.data.missingKeywords) ? result.data.missingKeywords : [],
      formattingFeedback: result.data.formattingFeedback || "",
      suggestions: Array.isArray(result.data.suggestions) ? result.data.suggestions : []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/resume/enhance-bullet ──
router.post("/enhance-bullet", async (req, res) => {
  try {
    const { text, type } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    let prompt;
    if (type === 'summary') {
      prompt = `You are an expert resume writer. Enhance the following professional summary.
Rewrite it into a strong, compelling 2-3 sentence paragraph that highlights the candidate's core strengths, experience level, and career objective.
Do not use bullet points. Make it sound professional and confident. Return ONLY the enhanced paragraph.

Original Text:
"""${text.slice(0, 2000)}"""`;
    } else {
      const contextStr = type === 'project' ? 'a software project' : 'work experience';
      prompt = `You are an expert resume writer. Enhance the following description of ${contextStr}.
Rewrite it into 2-3 strong, action-oriented bullet points using the XYZ formula (Accomplished [X] as measured by [Y], by doing [Z]).
Do not invent fake metrics, but if obvious ones could exist, phrase it so the user can fill them in (e.g., "[number]%").
Return ONLY the raw bullet points separated by newlines, no markdown formatting like asterisks or dashes at the start.

Original Text:
"""${text.slice(0, 2000)}"""`;
    }

    const result = await callGemini("enhance_bullet", prompt);
    if (!result.success) return res.status(503).json({ error: result.error });

    const enhancedText = result.data.replace(/^[-*•]\s*/gm, '').trim();
    res.json({ enhancedText });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/resume/tailor ──
router.post("/tailor", async (req, res) => {
  try {
    const { jobDescription, profileData } = req.body;
    if (!jobDescription || !profileData) return res.status(400).json({ error: "jobDescription and profileData required" });

    const prompt = `You are an expert ATS optimizer. 
Given the candidate's base profile and the target job description, re-order their skills, and suggest a tailored "Professional Summary". 
Return ONLY JSON in this exact shape:
{
  "tailoredSummary": "A strong 2-3 sentence summary emphasizing alignment with the JD",
  "recommendedSkills": ["skill1", "skill2"] // ordered by relevance to the JD, filtering out irrelevant ones
}

Job Description:
"""${jobDescription.slice(0, 3000)}"""

Candidate Profile:
${JSON.stringify({
  skills: profileData.skills,
  summary: profileData.summary,
  projects: profileData.projects?.map(p => p.title),
  experience: profileData.experience?.map(e => e.role)
})}
`;

    const result = await callGemini("tailor_resume", prompt, { jsonSchemaHint: true });
    if (!result.success) return res.status(503).json({ error: result.error });

    res.json(result.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
