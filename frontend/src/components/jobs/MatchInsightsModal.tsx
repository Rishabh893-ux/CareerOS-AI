"use client";

import React from "react";
import { Sparkles, X, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import { Job } from "@/types/jobs";
import { getMatchColor, getMatchBorderColor } from "./jobUtils";

interface MatchInsightsModalProps {
  job: Job;
  onClose: () => void;
}

export default function MatchInsightsModal({ job, onClose }: MatchInsightsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="premium-card p-6 w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="text-accent" />
            AI Job Insights: {job.role}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-alt rounded-lg text-muted hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">

          <div className="flex items-center gap-4 bg-surface-alt border border-line p-4 rounded-xl">
            <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center text-xl font-black bg-surface ${getMatchBorderColor(job.matchPercentage || 0)} ${getMatchColor(job.matchPercentage || 0)}`}>
              {job.matchPercentage}%
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground mb-1">Match Score</h4>
              <p className="text-xs text-muted leading-relaxed">
                Based on your skills, experience, and projects compared to the job description.
              </p>
            </div>
          </div>

          {job.strengths && job.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-success uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle size={16} /> Key Strengths
              </h4>
              <ul className="space-y-2">
                {job.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-muted bg-success/10 border border-success/30 p-3 rounded-lg leading-relaxed">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.weaknesses && job.weaknesses.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-danger uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertCircle size={16} /> Missing or Weak Areas
              </h4>
              <ul className="space-y-2">
                {job.weaknesses.map((w, i) => (
                  <li key={i} className="text-sm text-muted bg-danger/10 border border-danger/30 p-3 rounded-lg leading-relaxed">
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.tips && job.tips.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-accent uppercase tracking-wider mb-3 flex items-center gap-2">
                <TrendingUp size={16} /> Actionable Tips
              </h4>
              <ul className="space-y-2">
                {job.tips.map((t, i) => (
                  <li key={i} className="text-sm text-muted bg-accent-soft border border-accent/30 p-3 rounded-lg leading-relaxed">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
