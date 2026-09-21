const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const pdfParseLib = require("pdf-parse");
const pdfParse = pdfParseLib.default || pdfParseLib; // handle both ESM default and CJS export
const Profile = require("../models/Profile");
const authMiddleware = require("../middleware/auth");
const { chatCompletion, VISION_MODEL, callAI } = require("../services/aiService");
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

// ── Helper: extract text from PDF buffer via pdf-parse ──
async function extractTextFromPdf(buffer) {
  try {
    const parsed = await pdfParse(buffer);
    if (parsed.text && parsed.text.trim().length > 50) {
      return parsed.text.trim();
    }
    throw new Error("PDF text too short");
  } catch (err) {
    console.warn("[PDF Parse] pdf-parse failed or empty");
    return null;
  }
}

// ── Shared pdfjs-dist loader ──
// pdfjs-dist's Node "fake worker" caches its handler on a process-wide global
// (globalThis.pdfjsWorker), not per module instance. If more than one
// pdfjs-dist version ever runs in this process, whichever loads its worker
// first "poisons" that global for every other version afterwards, causing a
// hard "API version does not match Worker version" crash. So this app must
// only ever load ONE pdfjs-dist instance - always through this function -
// rather than pulling in a second copy via another package (e.g. pdf-to-img).
let pdfjsLibPromise = null;
function getPdfjsLib() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import("pdfjs-dist/legacy/build/pdf.mjs").then((pdfjsLib) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = require("url").pathToFileURL(
        require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs")
      ).href;
      return pdfjsLib;
    });
  }
  return pdfjsLibPromise;
}

// ── Helper: extract text from PDF buffer via pdfjs-dist's own text layer API ──
// This is a text-only extraction that never touches Canvas/rendering, so it's
// far more robust than the rasterization path below - it recovers text from
// PDFs that trip up pdf-parse (unusual encodings, ligatures, certain embedded
// fonts) without needing the Canvas/clip-path machinery at all.
async function extractTextViaPdfJs(buffer) {
  try {
    const pdfjsLib = await getPdfjsLib();
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer), isEvalSupported: false }).promise;

    const pageTexts = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      pageTexts.push(content.items.map((item) => item.str).join(" "));
    }

    const text = pageTexts.join("\n\n").trim();
    return text.length > 50 ? text : null;
  } catch (err) {
    console.warn("[PDF Parse] pdfjs-dist text extraction failed:", err.message);
    return null;
  }
}

// ── Helper: extract text from a single image buffer via Groq Vision (qwen3.8-27b) ──
async function extractTextFromImageBuffer(buffer, mimeType) {
  const base64 = buffer.toString("base64");

  const text = await chatCompletion([{
    role: "user",
    content: [
      { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
      { type: "text", text: "Extract ALL text from this resume image exactly as it appears. Return only the raw text content, no commentary." },
    ],
  }], { model: VISION_MODEL });

  return text.trim();
}

// ── Helper: scanned/image-based PDF fallback ──
// Groq has no native PDF/document input (only image_url), so a PDF that has
// no real text layer gets rasterized page-by-page (via the same pdfjs-dist
// instance as above, paired with @napi-rs/canvas) and each page is OCR'd
// through Groq Vision instead.
const MAX_VISION_PAGES = 5;

async function extractTextFromScannedPdf(buffer) {
  const pdfjsLib = await getPdfjsLib();
  const { createCanvas } = require("@napi-rs/canvas");

  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer), isEvalSupported: false }).promise;
  const numPages = Math.min(doc.numPages, MAX_VISION_PAGES);

  const pageTexts = [];
  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = createCanvas(viewport.width, viewport.height);
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    const pageText = await extractTextFromImageBuffer(canvas.toBuffer("image/png"), "image/png");
    pageTexts.push(pageText);
  }
  return pageTexts.join("\n\n");
}

// ── Helper: extract text from an uploaded resume file (PDF or image) ──
// PDFs try pdf-parse, then pdfjs-dist's own text layer as a second attempt
// (recovers text pdf-parse chokes on, still no rendering involved), and only
// fall back to rasterizing pages + Groq Vision if there's truly no text layer
// (a scanned/image-only PDF). Images always go straight through Groq Vision.
async function extractResumeFileText(file) {
  const isPdf = file.mimetype === "application/pdf";
  const isImage = file.mimetype.startsWith("image/");

  if (isPdf) {
    const text = await extractTextFromPdf(file.buffer);
    if (text) return text;

    const pdfjsText = await extractTextViaPdfJs(file.buffer);
    if (pdfjsText) return pdfjsText;

    console.log("[Resume] Falling back to Groq Vision (page rasterization) for scanned PDF");
    return extractTextFromScannedPdf(file.buffer);
  }
  if (isImage) {
    return extractTextFromImageBuffer(file.buffer, file.mimetype);
  }
  return "";
}

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

    const result = await callAI("resume_parse", prompt, { jsonSchemaHint: true });
    console.log("[Resume Parse] Claude Success:", result.success, "Data:", result.data);
    
    let extractedSkills = [];
    let profile = null;
    let message = "Resume parsed with fallback";

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

// ── POST /api/resume/parse — raw text fallback ──
router.post("/parse", async (req, res) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText) return res.status(400).json({ error: "resumeText is required" });

    const prompt = `Extract a clean list of technical and professional skills from this resume text.
Return ONLY a JSON array of strings, lowercase, no duplicates, no soft skills like "communication".
Resume text:
"""${resumeText.slice(0, 6000)}"""`;

    const result = await callAI("resume_parse", prompt, { jsonSchemaHint: true });
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
      { 
        $unset: { resumeUrl: "", resumeRawText: "", resumeExtractedSkills: "", resumeLastParsedAt: "", phone: "", location: "", portfolioUrl: "" },
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
router.post("/ats-check", upload.single("resume"), async (req, res) => {
  try {
    const { jobDescription = "Provide general feedback and a basic ATS score without a specific job description." } = req.body;

    let candidateProfile = {};

    // 1. If a file is uploaded, extract text directly from it
    if (req.file) {
      const resumeText = await extractResumeFileText(req.file);

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
        skills: getMergedSkills(profile),
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

    const result = await callAI("ats_check", prompt, { jsonSchemaHint: true });
    
    console.log("[ATS Check] Claude Success:", result.success, "Data:", result.data);

    if (!result.success) return res.status(503).json({ error: result.error });

    if (typeof result.data === "string") {
      console.error("[ATS Check] Claude returned invalid JSON:", result.data);
      return res.status(500).json({ error: "AI returned an invalid format. Please try again." });
    }

    res.json({
      score: result.data.score || 0,
      missingKeywords: Array.isArray(result.data.missingKeywords) ? result.data.missingKeywords : [],
      formattingFeedback: result.data.formattingFeedback || "",
      suggestions: Array.isArray(result.data.suggestions) ? result.data.suggestions : [],
      rawExtractedText: candidateProfile.resumeText || "",
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

    const result = await callAI("enhance_bullet", prompt);
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

    const result = await callAI("tailor_resume", prompt, { jsonSchemaHint: true });
    if (!result.success) return res.status(503).json({ error: result.error });

    res.json(result.data);
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
