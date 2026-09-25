export interface Profile {
  careerGoal: string;
  skills: string[];
  resumeExtractedSkills: string[];
  resumeUrl?: string;
  resumeLastParsedAt?: string;
  lastAtsCheck?: AtsResult;
  education: Array<{ institute: string; degree: string; branch: string; cgpa: number; graduationYear: number }>;
  projects: Array<{ title: string; description: string; techStack: string[]; repoUrl: string }>;
}

export interface AtsKeyword {
  term: string;
  found: boolean;
}

export interface AtsCheck {
  key: string;
  label: string;
  pass: boolean;
  partial?: boolean;
  detail?: string;
}

/** See careeros/services/atsAnalyzer.js */
export interface AtsResult {
  /** "match" = scored against a job description; "health" = format checks only */
  mode: "match" | "health";
  score: number;
  breakdown: { keywords: number | null; format: number };
  role?: string;
  keywords: { required: AtsKeyword[]; preferred: AtsKeyword[] } | null;
  missingKeywords: string[];
  checks: AtsCheck[];
  suggestions: string[];
  keywordSource?: "ai" | "fallback" | null;
  resumeSource?: "upload" | "profile-resume" | "profile-fields";
  checkedAt?: string;
  rawExtractedText?: string;
}

export const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
export const ACCEPTED_EXTENSIONS = ".pdf,.jpg,.jpeg,.png,.webp";
