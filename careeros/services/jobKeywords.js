// Shared by the ATS check (routes/resume.js) and job matching (services/jobMatchService.js).
const { callAI } = require("./aiService");
const { getMergedSkills } = require("./profileUtils");
const { fallbackKeywords } = require("./atsAnalyzer");

// Profiles filled in by hand have no parsed resume text; build one from their fields.
function profileAsText(profile) {
  const lines = [];
  if (profile.careerGoal) lines.push("Summary", profile.careerGoal);
  const skills = getMergedSkills(profile);
  if (skills.length) lines.push("Skills", skills.join(", "));
  if (profile.experience?.length) {
    lines.push("Experience");
    for (const e of profile.experience) lines.push(`${e.role} at ${e.company}`, ...(e.description || "").split("\n"));
  }
  if (profile.projects?.length) {
    lines.push("Projects");
    for (const p of profile.projects) lines.push(p.title, p.description || "", (p.techStack || []).join(", "));
  }
  if (profile.education?.length) {
    lines.push("Education");
    for (const e of profile.education) lines.push([e.degree, e.branch, e.institute, e.graduationYear].filter(Boolean).join(" "));
  }
  return lines.filter(Boolean).join("\n");
}

/** @param feature usage-log feature name, so AI quota is attributed to the caller */
async function extractJobKeywords(jobDescription, feature = "ats_check") {
  const prompt = `Extract the skills and qualifications an applicant tracking system would screen for in this job description.
Return ONLY JSON: { "role": "job title", "required": ["..."], "preferred": ["..."] }
Rules: short terms exactly as a resume would write them (e.g. "React", "PostgreSQL", "CI/CD", "Agile"); required = must-haves, preferred = nice-to-haves;
at most 15 required and 10 preferred; no soft skills like "communication" or "team player"; no years of experience.

Job description:
"""${jobDescription.slice(0, 6000)}"""`;
  const result = await callAI(feature, prompt, { jsonSchemaHint: true });
  const d = result.success && result.data && typeof result.data === "object" ? result.data : null;
  if (!d || !Array.isArray(d.required)) return { ...fallbackKeywords(jobDescription), source: "fallback" };
  return {
    role: typeof d.role === "string" ? d.role : "",
    required: d.required.filter((t) => typeof t === "string"),
    preferred: Array.isArray(d.preferred) ? d.preferred.filter((t) => typeof t === "string") : [],
    source: "ai",
  };
}

/** The text to match a job against: the parsed resume, or the profile fields. */
function resumeTextFor(profile) {
  return profile.resumeRawText || profileAsText(profile);
}

module.exports = { extractJobKeywords, profileAsText, resumeTextFor };
