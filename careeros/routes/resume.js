const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const Profile = require("../models/Profile");
const authMiddleware = require("../middleware/auth");
const { callAI } = require("../services/aiService");
const { extractResumeFileText } = require("../services/resumeTextExtractor");
const { analyzeAts } = require("../services/atsAnalyzer");
const { extractJobKeywords, profileAsText } = require("../services/jobKeywords");
const { getMergedSkills } = require("../services/profileUtils");

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


// ── POST /api/resume/upload — PDF or Image ──
router.post("/upload", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const isPdf = req.file.mimetype === "application/pdf";

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
    const resumeText = await extractResumeFileText(req.file);

    if (!resumeText || resumeText.length < 30) {
      return res.status(422).json({ error: "Could not extract readable text from the uploaded file. Please try a clearer PDF or image." });
    }

    // 3. Extract skills and full profile details using Claude
    const prompt = `You are an expert AI Resume Parser. Extract the following information from the provided resume text.
Return ONLY a valid JSON object matching this exact shape:
{
  "phone": "Extracted phone number, if any",
  "location": "Extracted location (City, State/Country), if any",
  "portfolioUrl": "Extracted personal website or portfolio link, if any",
  "githubUrl": "Extracted GitHub URL, if any",
  "linkedinUrl": "Extracted LinkedIn URL, if any",
  "skills": ["skill1", "skill2"],
  "careerGoal": "The candidate's objective or target role, as a short phrase",
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

    const result = await callAI("resume_parse", prompt, { jsonSchemaHint: true });
    console.log("[Resume Parse] Claude Success:", result.success, "Data:", result.data);
    
    let extractedSkills = [];
    let profile = null;
    let message = "Resume parsed with fallback";

    if (result.success && result.data && typeof result.data === "object") {
      let { skills, careerGoal, education, experience, certifications, projects, phone, location, portfolioUrl, githubUrl, linkedinUrl } = result.data;
      // Store the goal as plain text; strip a label the model may add anyway.
      careerGoal = typeof careerGoal === "string" ? careerGoal.replace(/^s*objectives*:s*/i, "").trim() : "";

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
        { $set: profileUpdates, $unset: { lastAtsCheck: "" } }, // a new resume invalidates the last ATS check
        { new: true, upsert: true }
      );
      extractedSkills = profileUpdates.resumeExtractedSkills;
      message = "Resume uploaded and fully parsed successfully";
    } else {
      console.warn("[Resume Parse] Fallback! Did not receive valid JSON. Raw text:", result.data);
    }

    res.json({ message, resumeUrl, extractedSkills, profile });
  } catch (err) {
    console.error("[Resume Upload Error]", err.stack || err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/resume — remove parsed resume from profile ──
router.delete("/", async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { user: req.userId },
      { 
        $unset: { resumeUrl: "", resumeRawText: "", resumeExtractedSkills: "", resumeLastParsedAt: "", phone: "", location: "", portfolioUrl: "", lastAtsCheck: "" },
        $set: { skills: [], education: [], experience: [], certifications: [], projects: [], careerGoal: "" }
      },
      { new: true }
    );
    res.json({ message: "Resume removed successfully", profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/resume/ats-check ──
// Keyword coverage + format checks against the full resume text (see
// services/atsAnalyzer.js). The AI is used only to pull keywords out of the
// job description; with no JD this is a free "resume health" check.

router.post("/ats-check", upload.single("resume"), async (req, res) => {
  try {
    const jobDescription = (req.body.jobDescription || "").trim();
    const profile = await Profile.findOne({ user: req.userId });

    let resumeText;
    let source;
    if (req.file) {
      resumeText = await extractResumeFileText(req.file);
      if (!resumeText || resumeText.length < 30) {
        return res.status(422).json({ error: "Could not read text from that file. Try a text-based PDF rather than a scan." });
      }
      source = "upload";
    } else {
      if (!profile) return res.status(404).json({ error: "Upload a resume first, or attach one to this check." });
      if (profile.resumeRawText) {
        resumeText = profile.resumeRawText;
      } else {
        const User = require("../models/User");
        resumeText = profileAsText(profile, await User.findById(req.userId).select("name email linkedinUrl githubUsername"));
      }
      source = profile.resumeRawText ? "profile-resume" : "profile-fields";
      if (resumeText.length < 30) return res.status(422).json({ error: "Your profile is too empty to check. Upload a resume first." });
    }

    // A few words aren't a job description; treat them as none.
    const hasJd = jobDescription.split(/\s+/).length >= 15;
    const keywordList = hasJd ? await extractJobKeywords(jobDescription) : null;
    const analysis = analyzeAts(resumeText, keywordList);

    const result = {
      ...analysis,
      keywordSource: keywordList?.source || null,
      resumeSource: source,
      checkedAt: new Date(),
    };

    // Remember the latest result so the page can show it after a reload.
    if (profile) {
      profile.lastAtsCheck = result;
      await profile.save();
    }

    res.json({ ...result, rawExtractedText: resumeText });
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

    const result = await callAI("enhance_bullet", prompt);
    if (!result.success) return res.status(503).json({ error: result.error });

    const enhancedText = result.data.replace(/^[-*•]\s*/gm, '').trim();
    res.json({ enhancedText });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/resume/cover-letter ──
router.post("/cover-letter", async (req, res) => {
  try {
    const { companyName, roleTitle, jobDescription, tone } = req.body;
    if (!companyName || !roleTitle) {
      return res.status(400).json({ error: "companyName and roleTitle are required" });
    }

    const profile = await Profile.findOne({ user: req.userId });
    if (!profile) return res.status(404).json({ error: "Profile not found. Please complete your profile first." });

    const candidateProfile = {
      careerGoal: profile.careerGoal || "",
      skills: getMergedSkills(profile),
      education: (profile.education || []).map(e => ({ degree: e.degree, institute: e.institute })),
      experience: (profile.experience || []).map(e => ({ company: e.company, role: e.role, description: e.description })),
      projects: (profile.projects || []).map(p => ({ title: p.title, description: p.description, techStack: p.techStack })),
    };

    const toneInstruction = tone === "formal"
      ? "Keep the tone formal and traditional."
      : tone === "confident"
      ? "Keep the tone confident and achievement-forward, without sounding arrogant."
      : "Keep the tone warm, professional, and conversational — not stiff or generic.";

    const prompt = `You are an expert career writer. Write a concise, compelling cover letter for this candidate applying to the role of "${roleTitle}" at "${companyName}".

Candidate background:
${JSON.stringify(candidateProfile)}

${jobDescription ? `Job Description:\n"""${jobDescription.slice(0, 3000)}"""` : "No job description was provided — write a strong general letter for this role and company based on the candidate's background."}

Rules:
- 3-4 short paragraphs, under 320 words total.
- Open with genuine, specific interest in the role/company (do not fabricate company facts you don't know — speak generally about the mission/industry instead).
- Draw only on the candidate's real skills/projects/experience listed above — never invent metrics, employers, or experience not given.
- ${toneInstruction}
- Close with a clear, confident call to action.
- Return ONLY the letter body text, no subject line, no "Dear Hiring Manager" placeholders beyond a normal greeting, no markdown formatting.`;

    const result = await callAI("cover_letter", prompt);
    if (!result.success) return res.status(503).json({ error: result.error });

    res.json({ letter: typeof result.data === "string" ? result.data.trim() : String(result.data) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
