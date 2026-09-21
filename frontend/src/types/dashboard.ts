export interface Profile {
  careerGoal: string;
  skills: string[];
  resumeExtractedSkills: string[];
  education: Array<{ institute: string; degree: string; branch: string; cgpa: number; graduationYear: number }>;
  projects: Array<{ title: string; description: string; techStack: string[]; repoUrl: string }>;
  careerScore?: { score: number; strengths: string[]; weaknesses: string[] };
  githubAnalysis?: {
    score: number;
    summary: string;
    topLanguages: string[];
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
