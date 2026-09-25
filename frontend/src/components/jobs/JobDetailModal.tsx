"use client";

import React, { useState } from "react";
import { X, Check, RefreshCw, Trash2, Info, ExternalLink } from "lucide-react";
import { Job, JobStatus } from "@/types/jobs";
import { useModalDialog } from "@/lib/useModalDialog";
import { STATUSES, getMatchColor, toDateInput, timeAgo } from "./jobUtils";

interface JobDetailModalProps {
  job: Job;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Job>) => Promise<boolean>;
  onAnalyze: (id: string) => void;
  onDelete: (id: string) => void;
}

const LABEL = "block text-xs font-semibold text-muted mb-1.5";
const FIELD = "w-full bg-surface-alt border border-line rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted";

export default function JobDetailModal({ job, onClose, onSave, onAnalyze, onDelete }: JobDetailModalProps) {
  const dialogRef = useModalDialog<HTMLDivElement>(true, onClose);
  const [form, setForm] = useState({
    role: job.role,
    company: job.company,
    status: job.status,
    appliedOn: toDateInput(job.appliedOn),
    jobUrl: job.jobUrl || "",
    notes: job.notes || "",
    jobDescription: job.jobDescription || "",
  });
  const [saving, setSaving] = useState(false);
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const dirty =
    form.role !== job.role || form.company !== job.company || form.status !== job.status ||
    form.appliedOn !== toDateInput(job.appliedOn) || form.jobUrl !== (job.jobUrl || "") ||
    form.notes !== (job.notes || "") || form.jobDescription !== (job.jobDescription || "");
  const canSave = dirty && form.role.trim() !== "" && form.company.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    const ok = await onSave(job._id, {
      ...form,
      role: form.role.trim(),
      company: form.company.trim(),
      appliedOn: form.appliedOn ? new Date(form.appliedOn).toISOString() : undefined,
    });
    setSaving(false);
    if (ok) onClose();
  };

  const matched = job.matchedSkills || [];
  const missing = job.missingSkills || [];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="job-detail-title" tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="premium-card w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-4 p-5 border-b border-line">
          <div className="min-w-0">
            <h2 id="job-detail-title" className="text-lg font-bold text-foreground truncate">{job.role}</h2>
            <p className="text-sm text-muted truncate">
              {job.company}
              {job.jobUrl && (
                <a href={job.jobUrl} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 text-accent hover:underline">
                  Posting <ExternalLink size={12} aria-hidden />
                </a>
              )}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-surface-alt shrink-0">
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          {/* Details */}
          <form id="job-detail-form" onSubmit={handleSubmit} className="p-5 space-y-4 md:border-r border-line">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="jd-role" className={LABEL}>Role</label>
                <input id="jd-role" className={FIELD} value={form.role} onChange={set("role")} required />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="jd-company" className={LABEL}>Company</label>
                <input id="jd-company" className={FIELD} value={form.company} onChange={set("company")} required />
              </div>
              <div>
                <label htmlFor="jd-status" className={LABEL}>Status</label>
                <select id="jd-status" className={FIELD} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as JobStatus }))}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="jd-applied" className={LABEL}>Applied on</label>
                <input id="jd-applied" type="date" className={FIELD} value={form.appliedOn} onChange={set("appliedOn")} />
              </div>
              <div className="col-span-2">
                <label htmlFor="jd-url" className={LABEL}>Posting link</label>
                <input id="jd-url" type="url" inputMode="url" placeholder="https://" className={FIELD} value={form.jobUrl} onChange={set("jobUrl")} />
              </div>
            </div>
            <div>
              <label htmlFor="jd-notes" className={LABEL}>Notes</label>
              <textarea id="jd-notes" rows={3} placeholder="Recruiter name, interview dates, follow-ups…" className={`${FIELD} resize-y`} value={form.notes} onChange={set("notes")} />
            </div>
            <div>
              <label htmlFor="jd-desc" className={LABEL}>Job description</label>
              <textarea id="jd-desc" rows={5} placeholder="Paste the posting to see how well your resume matches" aria-describedby="jd-desc-hint"
                className={`${FIELD} resize-y`} value={form.jobDescription} onChange={set("jobDescription")} />
              <p id="jd-desc-hint" className="text-[11px] text-muted mt-1">Saving a changed description re-runs the match.</p>
            </div>
          </form>

          {/* Match */}
          <section aria-labelledby="jd-match-title" className="p-5 space-y-4 bg-surface-alt/40">
            <h3 id="jd-match-title" className="section-heading">Resume match</h3>

            {job.matchStatus === "pending" ? (
              <p className="flex items-center gap-2 text-sm text-muted" role="status">
                <RefreshCw size={14} className="animate-spin" aria-hidden /> Matching your resume against this job…
              </p>
            ) : job.matchStatus === "completed" && job.matchPercentage !== undefined ? (
              <>
                <div>
                  <p className={`text-4xl font-extrabold leading-none ${getMatchColor(job.matchPercentage)}`}>{job.matchPercentage}%</p>
                  <p className="text-xs text-muted mt-1.5">of this job&apos;s keywords appear in your resume (required skills count double)</p>
                </div>
                {matched.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1.5">You have</p>
                    <ul className="flex flex-wrap gap-1.5">
                      {matched.map((s) => (
                        <li key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-success/10 border border-success/30 text-success">
                          <Check size={11} aria-hidden />{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {missing.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1.5">Missing from your resume</p>
                    <ul className="flex flex-wrap gap-1.5">
                      {missing.map((s) => (
                        <li key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-danger/10 border border-danger/30 text-danger">
                          <X size={11} aria-hidden />{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(job.tips?.length || 0) > 0 && (
                  <ul className="space-y-2">
                    {job.tips!.map((t, i) => (
                      <li key={i} className="text-xs text-foreground leading-relaxed p-3 rounded-xl bg-surface border border-line">{t}</li>
                    ))}
                  </ul>
                )}
                {job.keywordSource === "fallback" && (
                  <p className="text-[11px] text-muted flex gap-1.5"><Info size={12} className="shrink-0 mt-0.5" aria-hidden />AI keyword extraction was unavailable, so only well-known skills were matched.</p>
                )}
                <div className="flex items-center justify-between gap-3">
                  {job.matchedAt && <span className="text-[11px] text-muted">Matched {timeAgo(job.matchedAt)}</span>}
                  <button type="button" onClick={() => onAnalyze(job._id)} className="text-xs font-semibold text-accent hover:underline flex items-center gap-1">
                    <RefreshCw size={12} aria-hidden /> Re-run match
                  </button>
                </div>
              </>
            ) : job.matchStatus === "failed" ? (
              <div className="space-y-3">
                <p className="text-sm text-danger">{job.matchError || "The match couldn't be completed."}</p>
                <button type="button" onClick={() => onAnalyze(job._id)} className="px-3.5 py-2 btn-ghost text-xs font-semibold flex items-center gap-1.5">
                  <RefreshCw size={12} aria-hidden /> Try again
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted">Paste the job description on the left and save to see which of its skills your resume covers.</p>
            )}
          </section>
        </div>

        <div className="flex items-center justify-between gap-3 p-4 border-t border-line">
          <button type="button" onClick={() => onDelete(job._id)} className="px-3 py-2 rounded-lg text-sm text-danger hover:bg-danger/10 flex items-center gap-1.5">
            <Trash2 size={14} aria-hidden /> Delete
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 btn-ghost text-sm">Cancel</button>
            <button type="submit" form="job-detail-form" disabled={!canSave || saving}
              className="px-4 py-2 btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
