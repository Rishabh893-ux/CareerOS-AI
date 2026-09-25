import { Sparkles, CheckCircle2 } from "lucide-react";
import SectionHeading from "./SectionHeading";

interface CareerScoreSectionProps {
  careerScore?: {
    score: number;
    strengths: string[];
    // The numeric score and weaknesses are intentionally never shown here -
    // they're private, self-improvement-facing data. A visitor sees only the
    // strengths the analysis found, framed as highlights.
  };
}

export default function CareerScoreSection({ careerScore }: CareerScoreSectionProps) {
  const strengths = careerScore?.strengths?.filter(Boolean) || [];
  if (strengths.length === 0) return null;

  return (
    <section aria-labelledby="portfolio-highlights" className="portfolio-section p-6 sm:p-8">
      <SectionHeading id="portfolio-highlights" icon={Sparkles}>Highlights</SectionHeading>
      <ul className="grid sm:grid-cols-2 gap-3">
        {strengths.map((strength, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground leading-relaxed p-4 rounded-2xl bg-surface-alt border border-line">
            <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" aria-hidden />
            <span>{strength}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
