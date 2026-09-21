"use client";

import React from "react";
import { Flame } from "lucide-react";
import { AtsResult } from "@/types/resume";

interface AtsScoreCardProps {
  atsResult: AtsResult | null;
  scoreColor: string;
}

export function AtsScoreCard({ atsResult, scoreColor }: AtsScoreCardProps) {
  return (
    <div className="premium-card p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl bg-warning/10 border border-warning/30 flex items-center justify-center">
          <Flame size={16} className="text-warning" />
        </div>
        <span className="section-heading">ATS Score</span>
      </div>
      <p className="text-xs text-muted mt-2 leading-relaxed">
        Overall compatibility rating.
      </p>

      {/* Big score display */}
      <div className="flex-1 flex flex-col items-center justify-center py-6">
        <div className={`text-6xl font-black ${scoreColor} leading-none`}>
          {atsResult ? `${atsResult.score}` : "--"}
        </div>
        <p className="text-xs text-muted mt-1">/ 100 match score</p>
        {atsResult && (
          <div className="w-full mt-4 h-2 bg-surface-alt rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                atsResult.score >= 70 ? "bg-success"
                : atsResult.score >= 45 ? "bg-accent"
                : "bg-danger"
              }`}
              style={{ width: `${atsResult.score}%` }}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-auto">
        <div className="p-3 bg-surface-alt border border-line rounded-xl text-center">
          <p className="text-lg font-bold text-foreground">{atsResult ? atsResult.missingKeywords.length : "--"}</p>
          <p className="text-[9px] text-muted uppercase tracking-wider mt-0.5">Missing Keywords</p>
        </div>
        <div className="p-3 bg-surface-alt border border-line rounded-xl text-center">
          <p className="text-lg font-bold text-foreground">{atsResult ? atsResult.suggestions.length : "--"}</p>
          <p className="text-[9px] text-muted uppercase tracking-wider mt-0.5">Suggestions</p>
        </div>
      </div>
    </div>
  );
}
