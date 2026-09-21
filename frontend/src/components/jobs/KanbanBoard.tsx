"use client";

import React from "react";
import { TrendingUp } from "lucide-react";
import { Job } from "@/types/jobs";
import { getStatusColor } from "./jobUtils";
import JobCard from "./JobCard";

interface KanbanBoardProps {
  jobs: Job[];
  columns: Job["status"][];
  onDragStart: (e: React.DragEvent, jobId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetStatus: Job["status"]) => void;
  onDelete: (id: string) => void;
  onRefresh: (id: string) => void;
  onViewInsights: (job: Job) => void;
}

export default function KanbanBoard({
  jobs,
  columns,
  onDragStart,
  onDragOver,
  onDrop,
  onDelete,
  onRefresh,
  onViewInsights,
}: KanbanBoardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <TrendingUp size={16} className="text-accent" />
          <span>Applications Kanban Board</span>
        </h3>
        <p className="text-xs text-muted">Drag & drop cards to progress status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
        {columns.map(status => {
          const columnJobs = jobs.filter(j => j.status === status);
          return (
            <div
              key={status}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, status)}
              className="glass-panel p-4 flex flex-col min-h-[400px] bg-surface-alt rounded-2xl"
            >
              <div className={`px-2.5 py-1.5 rounded-lg border font-bold text-xs text-center uppercase tracking-wider mb-4 ${getStatusColor(status)}`}>
                {status} ({columnJobs.length})
              </div>

              <div className="flex-1 space-y-3">
                {columnJobs.map(job => (
                  <JobCard
                    key={job._id}
                    job={job}
                    onDragStart={onDragStart}
                    onDelete={onDelete}
                    onRefresh={onRefresh}
                    onViewInsights={onViewInsights}
                  />
                ))}
                {columnJobs.length === 0 && (
                  <div className="h-full flex items-center justify-center text-[10px] text-muted py-20 border border-dashed border-line rounded-xl">
                    Empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
