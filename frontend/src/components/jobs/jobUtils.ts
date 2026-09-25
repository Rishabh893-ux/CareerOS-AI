import { JobStatus } from "@/types/jobs";

export const STATUSES: JobStatus[] = ["Wishlist", "Applied", "Interviewing", "Offer", "Rejected"];

export const getStatusColor = (status: JobStatus) => {
  switch (status) {
    case "Wishlist": return "border-line text-muted bg-surface-alt";
    case "Applied": return "border-accent/30 text-accent bg-accent-soft";
    case "Interviewing": return "border-warning/30 text-warning bg-warning/10";
    case "Offer": return "border-success/30 text-success bg-success/10";
    case "Rejected": return "border-danger/30 text-danger bg-danger/10";
  }
};

export const getMatchColor = (pct: number) => {
  if (pct >= 75) return "text-success";
  if (pct >= 50) return "text-warning";
  return "text-danger";
};

/** "today", "3 days ago", "2 weeks ago" */
export function timeAgo(iso?: string | null) {
  if (!iso) return "";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

/** yyyy-mm-dd for <input type="date"> */
export const toDateInput = (iso?: string) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");
