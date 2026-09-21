import { Sparkles, CheckCircle, AlertCircle, Star } from "lucide-react";
import type { Profile } from "@/types/dashboard";

interface AiInsightsCardProps {
  careerScore: Profile["careerScore"];
}

export function AiInsightsCard({ careerScore }: AiInsightsCardProps) {
  return (
    <div className="premium-card p-6 col-span-2">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-soft border border-accent/30 flex items-center justify-center">
            <Sparkles size={16} className="text-accent" />
          </div>
          <span className="section-heading">AI Insights & Recommendations</span>
        </div>
        <span className="premium-badge">AI Powered</span>
      </div>

      {careerScore ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="space-y-3">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-success uppercase tracking-wider">
              <CheckCircle size={13} /> Strengths
            </p>
            <ul className="space-y-2">
              {careerScore.strengths.map((str, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                  {str}
                </li>
              ))}
            </ul>
          </div>
          {/* Recommendations */}
          <div className="space-y-3">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-warning uppercase tracking-wider">
              <AlertCircle size={13} /> Recommendations
            </p>
            <ul className="space-y-2">
              {careerScore.weaknesses.map((weak, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 shrink-0" />
                  {weak}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="h-[120px] flex flex-col items-center justify-center border border-dashed border-line rounded-2xl text-center gap-2">
          <Star size={22} className="text-muted" />
          <p className="text-xs text-muted">Calculate your career score to unlock AI insights</p>
        </div>
      )}
    </div>
  );
}
