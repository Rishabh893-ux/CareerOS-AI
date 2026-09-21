import { Job } from "@/types/jobs";

export const getStatusColor = (status: Job["status"]) => {
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

export const getMatchBorderColor = (pct: number) => {
  if (pct >= 75) return "border-success";
  if (pct >= 50) return "border-warning";
  return "border-danger";
};
