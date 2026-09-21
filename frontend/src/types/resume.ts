export interface Profile {
  careerGoal: string;
  skills: string[];
  resumeExtractedSkills: string[];
  resumeUrl?: string;
  resumeLastParsedAt?: string;
  education: Array<{ institute: string; degree: string; branch: string; cgpa: number; graduationYear: number }>;
  projects: Array<{ title: string; description: string; techStack: string[]; repoUrl: string }>;
}

export interface AtsResult {
  score: number;
  missingKeywords: string[];
  formattingFeedback: string;
  suggestions: string[];
  rawExtractedText?: string;
}

export const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
export const ACCEPTED_EXTENSIONS = ".pdf,.jpg,.jpeg,.png,.webp";
