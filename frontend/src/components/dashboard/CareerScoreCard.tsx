import { TrendingUp, RefreshCw, Sparkles } from "lucide-react";
import type { Profile } from "@/types/dashboard";
import { ScoreRing } from "./ScoreRing";

interface CareerScoreCardProps {
  careerScore: Profile["careerScore"];
  refreshingScore: boolean;
  onRecalculate: () => void;
}

export function CareerScoreCard({ careerScore, refreshingScore, onRecalculate }: CareerScoreCardProps) {
  return (
    <div className="metric-card p-6 flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-2">
        <span className="section-heading"><TrendingUp size={12} className="text-accent" /> Career Score</span>
        <button onClick={onRecalculate} disabled={refreshingScore}
          className="p-1.5 hover:bg-surface-alt rounded-lg text-muted hover:text-foreground transition-all"
          title="Recalculate">
          <RefreshCw size={13} className={refreshingScore ? "animate-spin text-accent" : ""} />
        </button>
      </div>

      {careerScore ? (
        <>
          <div className="my-3 animate-float">
            <ScoreRing score={careerScore.score} />
          </div>
          <div className="w-full mt-2 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted">Readiness</span>
              <span className={`font-bold ${careerScore.score >= 75 ? "text-success" : careerScore.score >= 50 ? "text-accent" : "text-warning"}`}>
                {careerScore.score >= 75 ? "Strong" : careerScore.score >= 50 ? "Growing" : "Early Stage"}
              </span>
            </div>
            <div className="w-full h-1 bg-surface-alt rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-1000"
                style={{ width: `${careerScore.score}%` }}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
          <div className="w-20 h-20 rounded-full border-2 border-dashed border-line flex items-center justify-center mb-4">
            <TrendingUp size={28} className="text-muted" />
          </div>
          <p className="text-xs text-muted mb-4">No score calculated yet</p>
          <button onClick={onRecalculate} disabled={refreshingScore}
            className="px-4 py-2 bg-accent-soft hover:bg-accent/20 border border-accent/30 text-accent text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5">
            {refreshingScore ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
            Calculate Score
          </button>
        </div>
      )}
    </div>
  );
}
