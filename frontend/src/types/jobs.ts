export type JobStatus = "Wishlist" | "Applied" | "Interviewing" | "Offer" | "Rejected";

export interface Job {
  _id: string;
  company: string;
  role: string;
  jobUrl?: string;
  status: JobStatus;
  notes?: string;
  appliedOn?: string;
  jobDescription?: string;
  /** See careeros/services/jobMatchService.js */
  matchStatus?: "pending" | "completed" | "failed";
  matchPercentage?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  tips?: string[];
  keywordSource?: "ai" | "fallback";
  matchError?: string;
  matchedAt?: string;
  /** Legacy AI prose from before keyword matching; shown only if present */
  strengths?: string[];
  weaknesses?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SearchResult {
  title: string;
  company: string;
  location: string;
  description: string;
  redirect_url: string;
  salary: string;
  postedAt?: string | null;
}

export interface SearchResponse {
  results: SearchResult[];
  /** "sample" = placeholder listings shown when live search is unavailable */
  source: "live" | "sample";
  notice?: string;
  total?: number;
}
