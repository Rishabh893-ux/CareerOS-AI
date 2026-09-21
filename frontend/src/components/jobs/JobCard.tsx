"use client";

import React from "react";
import { Trash2, ExternalLink, RefreshCw, Sparkles } from "lucide-react";
import { Job } from "@/types/jobs";
import { getMatchColor } from "./jobUtils";

interface JobCardProps {
  job: Job;
  onDragStart: (e: React.DragEvent, jobId: string) => void;
  onDelete: (id: string) => void;
  onRefresh: (id: string) => void;
  onViewInsights: (job: Job) => void;
}

export default function JobCard({ job, onDragStart, onDelete, onRefresh, onViewInsights }: JobCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, job._id)}
      className="p-3 bg-surface hover:bg-surface-alt border border-line hover:border-accent/40 rounded-xl cursor-grab active:cursor-grabbing transition-all space-y-2 relative group"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h5 className="text-xs font-bold text-foreground line-clamp-1">{job.role}</h5>
          <p className="text-[10px] text-muted line-clamp-1">{job.company}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {job.jobUrl && (
            <a
              href={job.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-accent p-0.5 rounded transition-colors"
              title="Open Job Posting"
            >
              <ExternalLink size={12} />
            </a>
          )}
          <button
            onClick={() => onDelete(job._id)}
            className="text-muted hover:text-danger p-0.5 rounded opacity-0 group-hover:opacity-100 transition-all"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Display match scorecard */}
      {job.matchStatus === "pending" ? (
        <div className="flex items-center justify-between border-t border-line pt-2 text-[10px] text-accent font-semibold uppercase animate-pulse">
          <span>Analyzing Match...</span>
          <button onClick={() => onRefresh(job._id)} className="text-muted hover:text-foreground transition-colors" title="Refresh">
            <RefreshCw size={10} />
          </button>
        </div>
      ) : job.matchStatus === "completed" && job.matchPercentage !== undefined ? (
        <div className="flex items-center justify-between border-t border-line pt-2">
          <button
            onClick={() => onViewInsights(job)}
            className="text-[9px] text-accent hover:opacity-80 transition-colors font-semibold uppercase flex items-center gap-1 cursor-pointer"
          >
            <Sparkles size={10} /> View Insights
          </button>
          <span className={`text-[10px] font-black ${getMatchColor(job.matchPercentage)}`}>
            {job.matchPercentage}%
          </span>
        </div>
      ) : job.matchStatus === "failed" ? (
        <div className="flex items-center justify-between border-t border-line pt-2 text-[9px] text-danger">
          <span>Analysis Failed</span>
        </div>
      ) : null}
    </div>
  );
}
