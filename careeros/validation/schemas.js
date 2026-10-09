// Request schemas for every route that takes input (see middleware/validate.js).
// They check types and sizes only; business rules stay in the routes. Keeping
// every value a plain string/number also blocks query-operator injection such
// as { "token": { "$ne": null } } reaching a Mongo filter.
const { z } = require("zod");

const required = (max, message = "Required") =>
  z.string({ required_error: message, invalid_type_error: "Must be text" }).trim().min(1, message).max(max);
const optional = (max) => z.string({ invalid_type_error: "Must be text" }).max(max).nullish();
const stringList = (maxItems, maxLength = 200) => z.array(z.string().max(maxLength)).max(maxItems);

// ── Auth ──
const email = z.string({ required_error: "Required" }).trim().max(254);
const password = z.string({ required_error: "Required" }).min(1, "Required").max(200);

const register = z.object({
  name: required(100, "name, email, and password are required"),
  email: email.email("Enter a valid email address"),
  password,
});
const login = z.object({ email, password });
const settings = z.object({
  name: required(100).optional(),
  username: z.string().trim().max(50).optional(),
  githubUsername: z.string().trim().max(100).optional(),
  linkedinUrl: z.string().trim().max(500).optional(),
});
const forgotPassword = z.object({ email });
const BAD_RESET_TOKEN = "Password reset token is invalid or has expired";
const resetPassword = z.object({
  token: z.string({ required_error: BAD_RESET_TOKEN, invalid_type_error: BAD_RESET_TOKEN }).regex(/^[a-f0-9]{40}$/, BAD_RESET_TOKEN),
  password,
});

// ── Profile ──
const education = z.object({
  institute: optional(200),
  degree: optional(200),
  branch: optional(200),
  // No ranges: entries parsed from a resume are sent back as-is on every save
  cgpa: z.number().nullish(),
  graduationYear: z.number().nullish(),
});
const experience = z.object({
  company: optional(200),
  role: optional(200),
  startDate: optional(50),
  endDate: optional(50),
  description: optional(5000),
});
const certification = z.object({
  name: optional(300),
  issuer: optional(200),
  date: optional(50),
  link: optional(2000),
});
const project = z.object({
  title: optional(200),
  description: optional(5000),
  techStack: stringList(50, 100).nullish(),
  repoUrl: optional(2000),
});
const profileUpdate = z.object({
  careerGoal: optional(500),
  skills: stringList(200).optional(),
  resumeExtractedSkills: stringList(200).optional(),
  education: z.array(education).max(20).optional(),
  experience: z.array(experience).max(50).optional(),
  certifications: z.array(certification).max(50).optional(),
  projects: z.array(project).max(50).optional(),
  phone: optional(50),
  location: optional(200),
  portfolioUrl: optional(2000),
});

// ── Resume ──
const atsCheck = z.object({ jobDescription: optional(20000) });
const enhanceBullet = z.object({
  text: required(5000, "Text is required"),
  type: optional(30),
});
const coverLetter = z.object({
  companyName: required(200, "companyName and roleTitle are required"),
  roleTitle: required(200, "companyName and roleTitle are required"),
  jobDescription: optional(20000),
  tone: optional(30),
});

// ── Growth, interview, copilot, outreach ──
const targetRole = z.object({ targetRole: required(200, "targetRole is required") });

const interviewGenerate = z.object({
  type: z.enum(["HR", "Technical"], { errorMap: () => ({ message: 'type must be "HR" or "Technical"' }) }),
  topic: optional(200),
  format: z.enum(["Written", "MCQ"]).optional(),
  limit: z.union([z.number(), z.string().max(5)]).optional(),
});
const interviewFeedback = z.object({
  answers: z
    .array(z.string().max(10000).nullable(), { required_error: "answers array is required" })
    .min(1, "answers array is required")
    .max(50),
});

const copilotAsk = z.object({ question: required(2000, "question is required") });

const outreachGenerate = z.object({
  recipientName: optional(200),
  companyName: required(200, "Company name, target role, and platform are required"),
  targetRole: required(200, "Company name, target role, and platform are required"),
  platform: required(50, "Company name, target role, and platform are required"),
  context: optional(5000),
});
const outreachResearch = z.object({
  companyName: required(200, "Company name is required"),
  targetRole: optional(200),
});

// ── Jobs ──
const jobFields = {
  jobUrl: optional(2000),
  status: optional(30),
  notes: optional(10000),
  appliedOn: optional(50),
  jobDescription: optional(20000),
};
const jobCreate = z.object({
  company: required(200, "Company and role are required."),
  role: required(200, "Company and role are required."),
  ...jobFields,
});
const jobUpdate = z.object({
  company: required(200, "Company can't be empty.").optional(),
  role: required(200, "Role can't be empty.").optional(),
  ...jobFields,
});
const jobSearch = z.object({
  what: z.string().max(200).optional(),
  where: z.string().max(200).optional(),
  country: z.string().regex(/^[a-z]{2}$/i, "Use a two-letter country code").optional(),
  page: z.string().regex(/^\d{1,3}$/, "Must be a page number").optional(),
});

module.exports = {
  register, login, settings, forgotPassword, resetPassword,
  profileUpdate,
  atsCheck, enhanceBullet, coverLetter,
  targetRole, interviewGenerate, interviewFeedback, copilotAsk,
  outreachGenerate, outreachResearch,
  jobCreate, jobUpdate, jobSearch,
};
