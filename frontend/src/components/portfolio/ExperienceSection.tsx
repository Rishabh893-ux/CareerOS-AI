import { Briefcase } from "lucide-react";
import type { PortfolioExperience } from "@/types/portfolio";
import SectionHeading from "./SectionHeading";

interface ExperienceSectionProps {
  experience: PortfolioExperience[];
}

function dateRange(start?: string, end?: string) {
  const s = start?.trim();
  const e = end?.trim();
  if (s && e) return `${s} – ${e}`;
  return s || e || "";
}

export default function ExperienceSection({ experience }: ExperienceSectionProps) {
  if (!experience || experience.length === 0) return null;

  return (
    <section aria-labelledby="portfolio-experience" className="portfolio-section p-6 sm:p-8">
      <SectionHeading id="portfolio-experience" icon={Briefcase}>Experience</SectionHeading>
      <ol className="relative border-l border-line ml-2 space-y-8">
        {experience.map((exp, idx) => {
          const dates = dateRange(exp.startDate, exp.endDate);
          const bullets = (exp.description || "")
            .split("\n")
            .map((line) => line.replace(/^\s*[-*•]\s*/, "").trim())
            .filter(Boolean);
          return (
            <li key={idx} className="pl-6 relative">
              <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-accent ring-4 ring-surface" aria-hidden />
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4">
                <h3 className="font-bold text-base text-foreground break-words">
                  {exp.role}
                  {exp.company && <span className="text-muted font-semibold"> · {exp.company}</span>}
                </h3>
                {dates && <p className="text-xs font-semibold text-muted shrink-0 tabular-nums">{dates}</p>}
              </div>
              {bullets.length > 0 && (
                <ul className="mt-3 space-y-1.5 text-sm text-muted leading-relaxed">
                  {bullets.map((line, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-accent" aria-hidden>•</span>
                      <span className="break-words min-w-0">{line}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
