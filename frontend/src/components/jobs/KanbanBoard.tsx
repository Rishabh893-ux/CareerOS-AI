"use client";

import React, { useState } from "react";
import { TrendingUp } from "lucide-react";
import { Job, JobStatus } from "@/types/jobs";
import { STATUSES, getStatusColor } from "./jobUtils";
import JobCard from "./JobCard";

interface KanbanBoardProps {
  jobs: Job[];
  onStatusChange: (id: string, status: JobStatus) => void;
  onOpen: (job: Job) => void;
}

export default function KanbanBoard({ jobs, onStatusChange, onOpen }: KanbanBoardProps) {
  const [dropTarget, setDropTarget] = useState<JobStatus | null>(null);

  const handleDrop = (e: React.DragEvent, status: JobStatus) => {
    e.preventDefault();
    setDropTarget(null);
    const id = e.dataTransfer.getData("jobId");
    const job = jobs.find((j) => j._id === id);
    if (job && job.status !== status) onStatusChange(id, status);
  };

  return (
    <section aria-labelledby="kanban-title" className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 id="kanban-title" className="section-heading">
          <TrendingUp size={14} className="text-accent" aria-hidden /> Applications
        </h2>
        <p className="text-xs text-muted hidden sm:block">Drag cards between columns, or change a card&apos;s status</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {STATUSES.map((status) => {
          const columnJobs = jobs.filter((j) => j.status === status);
          return (
            <div
              key={status}
              onDragOver={(e) => { e.preventDefault(); setDropTarget(status); }}
              onDragLeave={() => setDropTarget((t) => (t === status ? null : t))}
              onDrop={(e) => handleDrop(e, status)}
              className={`glass-panel p-3 flex flex-col lg:min-h-[200px] transition-colors ${dropTarget === status ? "outline-2 outline-dashed outline-accent" : ""}`}
            >
              <h3 className={`px-2.5 py-1.5 rounded-lg border font-bold text-xs text-center uppercase tracking-wider mb-3 ${getStatusColor(status)}`}>
                {status} <span className="font-semibold">({columnJobs.length})</span>
              </h3>

              {columnJobs.length > 0 ? (
                <ul className="flex-1 space-y-2.5">
                  {columnJobs.map((job) => (
                    <JobCard key={job._id} job={job} onDragStart={(e, id) => e.dataTransfer.setData("jobId", id)} onStatusChange={onStatusChange} onOpen={onOpen} />
                  ))}
                </ul>
              ) : (
                <p className="flex-1 flex items-center justify-center text-center text-[11px] text-muted border border-dashed border-line rounded-xl px-3 py-4 lg:py-8">
                  {status === "Wishlist" ? "Track a job from search, or add one" : "Nothing here yet"}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
