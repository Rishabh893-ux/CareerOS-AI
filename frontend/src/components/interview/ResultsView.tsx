import React from "react";
import { CheckCircle2 } from "lucide-react";
import { InterviewSession } from "@/types/interview";

interface ResultsViewProps {
  session: InterviewSession;
}

export default function ResultsView({ session }: ResultsViewProps) {
  return (
    <div className="glass-panel p-8 space-y-6">
      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <CheckCircle2 size={22} className="text-success" />
        <span>Evaluation Results</span>
      </h2>

      <div className="p-4 rounded-xl bg-accent-soft border border-accent/30 text-foreground">
        <p className="text-sm font-semibold">{session.feedback}</p>
      </div>

      {session.improvementAreas && session.improvementAreas.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Review Insights</h4>
          <ul className="space-y-2">
            {session.improvementAreas.map((area, idx) => (
              <li key={idx} className="text-xs text-foreground bg-surface-alt border border-line p-3 rounded-xl leading-relaxed">
                {area}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
