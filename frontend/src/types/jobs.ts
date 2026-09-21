export interface Job {
  _id: string;
  company: string;
  role: string;
  jobUrl?: string;
  status: "Wishlist" | "Applied" | "Interviewing" | "Offer" | "Rejected";
  notes?: string;
  matchStatus?: "pending" | "completed" | "failed";
  matchPercentage?: number;
  missingSkills?: string[];
  strengths?: string[];
  weaknesses?: string[];
  tips?: string[];
  appliedOn?: string;
}

export interface SearchResult {
  title: string;
  company: string;
  location: string;
  description: string;
  redirect_url: string;
  salary: string;
}
