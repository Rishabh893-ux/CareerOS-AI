export interface Profile {
  careerGoal: string;
  skills: string[];
  resumeExtractedSkills: string[];
  education: Array<{ institute: string; degree: string; branch: string; cgpa?: number; graduationYear?: number }>;
  experience?: Array<{ company: string; role: string; startDate?: string; endDate?: string; description?: string }>;
  certifications?: Array<{ name: string; issuer?: string; date?: string; link?: string }>;
  resumeUrl?: string;
  projects: Array<{ title: string; description: string; techStack: string[]; repoUrl: string }>;
  careerScore?: { score: number; strengths: string[]; weaknesses: string[] };
  githubAnalysis?: {
    score: number;
    summary: string;
    topLanguages: string[];
    signals?: Array<{ key: string; label: string; score: number; max: number; detail: string }>;
    recommendations?: string[];
    metrics?: {
      repoCount: number;
      totalStars: number;
      followers: number;
      recentlyPushed: number;
      daysSinceLastPush: number | null;
      languages: Array<{ name: string; share: number }>;
    };
    computedAt?: string;
    repos?: Array<{
      name: string;
      description: string;
      language: string;
      stars: number;
      updatedAt: string;
      html_url: string;
    }>;
  };
  skillGap?: { targetRole: string; missingSkills: string[] };
  roadmap?: { targetRole: string; steps: Array<{ title: string; description: string; resourceHint: string }> };
  careerPath?: { targetRole: string; ladder: Array<{ title: string; yearsRange: string; description: string }> };
}
