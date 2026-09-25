"use client";

import React from "react";
import { ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { Job, JobStatus } from "@/types/jobs";
import { STATUSES, getMatchColor, timeAgo } from "./jobUtils";

interface JobCardProps {
  job: Job;
  onDragStart: (e: React.DragEvent, jobId: string) => void;
  onStatusChange: (id: string, status: JobStatus) => void;
  onOpen: (job: Job) => void;
}

export default function JobCard({ job, onDragStart, onStatusChange, onOpen }: JobCardProps) {
  const dateLine = job.appliedOn ? `Applied ${timeAgo(job.appliedOn)}` : job.createdAt ? `Saved ${timeAgo(job.createdAt)}` : "";

  return (
    <li
      draggable
      onDragStart={(e) => onDragStart(e, job._id)}
      className="p-3 bg-surface border border-line hover:border-line-strong rounded-xl cursor-grab active:cursor-grabbing transition-colors space-y-2.5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {/* The role opens the details; drag works anywhere on the card */}
          <button type="button" onClick={() => onOpen(job)}
            className="text-left text-sm font-semibold text-foreground hover:text-accent transition-colors line-clamp-2">
            {job.role}
          </button>
          <p className="text-xs text-muted truncate">{job.company}</p>
        </div>
        {job.jobUrl && (
          <a href={job.jobUrl} target="_blank" rel="noopener noreferrer"
            className="text-muted hover:text-accent p-1 -m-1 rounded shrink-0"
            aria-label={`Open the ${job.role} posting (new tab)`} title="Open posting">
            <ExternalLink size={14} aria-hidden />
          </a>
        )}
      </div>

      {/* Match */}
      {job.matchStatus === "pending" ? (
        <p className="flex items-center gap-1.5 text-[11px] text-muted" role="status">
          <RefreshCw size={11} className="animate-spin" aria-hidden /> Matching your resume…
        </p>
      ) : job.matchStatus === "completed" && job.matchPercentage !== undefined ? (
        <button type="button" onClick={() => onOpen(job)} className="flex items-center gap-1.5 text-[11px] text-muted hover:text-foreground">
          <span className={`font-bold ${getMatchColor(job.matchPercentage)}`}>{job.matchPercentage}% match</span>
          {job.missingSkills?.length ? <span>· {job.missingSkills.length} skill{job.missingSkills.length === 1 ? "" : "s"} missing</span> : null}
        </button>
      ) : job.matchStatus === "failed" ? (
        <button type="button" onClick={() => onOpen(job)} className="flex items-center gap-1.5 text-[11px] text-danger">
          <AlertCircle size={11} aria-hidden /> Match failed. Open to retry
        </button>
      ) : null}

      {/* Status menu: the non-drag way to move a card (keyboard and touch) */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <label className="sr-only" htmlFor={`status-${job._id}`}>Status for {job.role} at {job.company}</label>
        <select id={`status-${job._id}`} value={job.status}
          onChange={(e) => onStatusChange(job._id, e.target.value as JobStatus)}
          className="text-xs bg-surface-alt border border-line rounded-lg px-2 py-1 text-foreground cursor-pointer">
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {dateLine && <span className="text-[11px] text-muted">{dateLine}</span>}
      </div>
    </li>
  );
}
