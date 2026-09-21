export interface PortfolioEducation {
  institute: string;
  degree: string;
  branch: string;
  cgpa?: number;
  graduationYear?: number;
}

export interface PortfolioProject {
  title: string;
  description: string;
  techStack: string[];
  repoUrl?: string;
}

export interface PortfolioExperience {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface PortfolioCertification {
  name: string;
  issuer: string;
  date?: string;
  link?: string;
}

export interface PortfolioRepo {
  name: string;
  description?: string;
  language?: string;
  stars?: number;
  html_url?: string;
}

export interface PortfolioData {
  user: {
    name: string;
    email?: string;
    githubUsername: string;
    linkedinUrl: string;
  };
  profile: {
    careerGoal: string;
    skills: string[];
    education: PortfolioEducation[];
    projects: PortfolioProject[];
    experience: PortfolioExperience[];
    certifications: PortfolioCertification[];
    location?: string;
    portfolioUrl?: string;
    resumeUrl?: string;
    githubAnalysis?: {
      score: number;
      summary: string;
      topLanguages: string[];
      repos: PortfolioRepo[];
    };
    careerScore?: {
      score: number;
      strengths: string[];
      weaknesses: string[];
    };
  };
}
