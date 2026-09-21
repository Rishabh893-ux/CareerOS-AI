import { TrendingUp, CheckCircle2 } from "lucide-react";
import { ScoreRing } from "@/components/dashboard/ScoreRing";

interface CareerScoreSectionProps {
  careerScore?: {
    score: number;
    strengths: string[];
    // weaknesses are intentionally never shown here - that's private,
    // self-improvement-facing data, not something to publish for recruiters.
  };
}

export default function CareerScoreSection({ careerScore }: CareerScoreSectionProps) {
  if (!careerScore) return null;

  return (
    <div className="glass-panel-glow p-8 animate-fade-in-up flex flex-col sm:flex-row items-center gap-8">
      <div className="shrink-0">
        <ScoreRing score={careerScore.score} size={128} strokeWidth={8} />
      </div>

      <div className="flex-1 w-full">
        <h3 className="text-sm font-bold text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-accent" /> Career Readiness
        </h3>
        {careerScore.strengths && careerScore.strengths.length > 0 && (
          <ul className="space-y-2">
            {careerScore.strengths.map((strength, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-foreground leading-relaxed">
                <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" />
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
