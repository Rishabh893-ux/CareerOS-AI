"use client";

import React from "react";
import { Job } from "@/types/jobs";
import { useModalDialog } from "@/lib/useModalDialog";

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

const LABEL = "block text-xs font-semibold text-muted mb-1.5";
const FIELD = "w-full bg-surface-alt border border-line rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted focus:outline-none";

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
  const dialogRef = useModalDialog<HTMLFormElement>(true, onCancel);
  const canAdd = company.trim() !== "" && role.trim() !== "";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onCancel}>
      <form
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-job-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); if (canAdd) onAdd(); }}
        className="premium-card p-6 w-full max-w-sm"
      >
        <h2 id="add-job-title" className="text-base font-bold text-foreground mb-4">Track an Application</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="add-job-company" className={LABEL}>Company</label>
            <input id="add-job-company" type="text" required autoComplete="organization"
              placeholder="e.g. Stripe" value={company}
              onChange={(e) => onCompanyChange(e.target.value)} className={FIELD} />
          </div>
          <div>
            <label htmlFor="add-job-role" className={LABEL}>Role</label>
            <input id="add-job-role" type="text" required autoComplete="organization-title"
              placeholder="e.g. Frontend Engineer" value={role}
              onChange={(e) => onRoleChange(e.target.value)} className={FIELD} />
          </div>
          <div>
            <label htmlFor="add-job-url" className={LABEL}>Job link <span className="font-normal">(optional)</span></label>
            <input id="add-job-url" type="url" inputMode="url"
              placeholder="https://" value={url}
              onChange={(e) => onUrlChange(e.target.value)} className={FIELD} />
          </div>
          <div>
            <label htmlFor="add-job-description" className={LABEL}>Job description <span className="font-normal">(optional)</span></label>
            <textarea id="add-job-description" rows={3} aria-describedby="add-job-description-hint"
              value={jobDescription}
              onChange={(e) => onJobDescriptionChange(e.target.value)}
              className={`${FIELD} resize-none leading-relaxed`} />
            <p id="add-job-description-hint" className="text-xs text-muted mt-1.5">Paste it to get an AI match score.</p>
          </div>
          <div>
            <label htmlFor="add-job-status" className={LABEL}>Status</label>
            <select id="add-job-status" value={status}
              onChange={(e) => onStatusChange(e.target.value as Job["status"])} className={FIELD}>
              <option value="Wishlist" className="bg-surface">Wishlist</option>
              <option value="Applied" className="bg-surface">Applied</option>
              <option value="Interviewing" className="bg-surface">Interviewing</option>
              <option value="Offer" className="bg-surface">Offer</option>
              <option value="Rejected" className="bg-surface">Rejected</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!canAdd}
              className="flex-1 py-2.5 btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to Tracker
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 btn-ghost text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
