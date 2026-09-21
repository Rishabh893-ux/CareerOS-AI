"use client";

import React from "react";
import { Job } from "@/types/jobs";

interface AddJobModalProps {
  company: string;
  onCompanyChange: (value: string) => void;
  role: string;
  onRoleChange: (value: string) => void;
  url: string;
  onUrlChange: (value: string) => void;
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  status: Job["status"];
  onStatusChange: (value: Job["status"]) => void;
  onAdd: () => void;
  onCancel: () => void;
}

export default function AddJobModal({
  company,
  onCompanyChange,
  role,
  onRoleChange,
  url,
  onUrlChange,
  jobDescription,
  onJobDescriptionChange,
  status,
  onStatusChange,
  onAdd,
  onCancel,
}: AddJobModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="premium-card p-6 w-full max-w-sm">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Track Custom Application</h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Company Name"
            value={company}
            onChange={(e) => onCompanyChange(e.target.value)}
            className="w-full bg-surface-alt border border-line rounded-xl px-4 py-3 text-xs text-foreground focus:outline-none"
          />
          <input
            type="text"
            placeholder="Role / Title"
            value={role}
            onChange={(e) => onRoleChange(e.target.value)}
            className="w-full bg-surface-alt border border-line rounded-xl px-4 py-3 text-xs text-foreground focus:outline-none"
          />
          <input
            type="text"
            placeholder="Job URL (Optional)"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            className="w-full bg-surface-alt border border-line rounded-xl px-4 py-3 text-xs text-foreground focus:outline-none"
          />
          <textarea
            placeholder="Job Description (Optional - required for AI Match)"
            value={jobDescription}
            onChange={(e) => onJobDescriptionChange(e.target.value)}
            rows={3}
            className="w-full bg-surface-alt border border-line rounded-xl px-4 py-3 text-xs text-foreground focus:outline-none resize-none leading-relaxed"
          />
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as Job["status"])}
            className="w-full bg-surface-alt border border-line rounded-xl px-4 py-3 text-xs text-foreground focus:outline-none"
          >
            <option value="Wishlist" className="bg-surface">Wishlist</option>
            <option value="Applied" className="bg-surface">Applied</option>
            <option value="Interviewing" className="bg-surface">Interviewing</option>
            <option value="Offer" className="bg-surface">Offer</option>
            <option value="Rejected" className="bg-surface">Rejected</option>
          </select>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onAdd}
              className="flex-1 py-2 bg-accent text-accent-contrast text-xs font-bold rounded-lg cursor-pointer"
            >
              Add Job
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-line text-muted text-xs font-bold rounded-lg cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
