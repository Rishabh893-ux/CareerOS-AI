import { BookOpen } from "lucide-react";
import type { PortfolioEducation } from "@/types/portfolio";
import SectionHeading from "./SectionHeading";

interface EducationSectionProps {
  education: PortfolioEducation[];
}

export default function EducationSection({ education }: EducationSectionProps) {
  if (!education || education.length === 0) return null;

  return (
    <section aria-labelledby="portfolio-education" className="portfolio-section p-6 sm:p-8">
      <SectionHeading id="portfolio-education" icon={BookOpen}>Education</SectionHeading>
      <ul className="space-y-6">
        {education.map((edu, idx) => {
          const title = [edu.degree, edu.branch].filter(Boolean).join(" in ") || edu.institute;
          // `cgpa &&` would render a literal "0"; only show a real, positive value.
          const hasCgpa = typeof edu.cgpa === "number" && edu.cgpa > 0;
          return (
            <li key={idx} className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-soft flex items-center justify-center shrink-0" aria-hidden>
                <BookOpen size={20} className="text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold break-words">{title}</h3>
                {title !== edu.institute && edu.institute && (
                  <p className="text-sm text-muted mt-0.5 break-words">{edu.institute}</p>
                )}
                {(edu.graduationYear || hasCgpa) && (
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-semibold text-muted">
                    {edu.graduationYear ? <span className="px-2 py-1 bg-surface-alt rounded-md">Class of {edu.graduationYear}</span> : null}
                    {hasCgpa && <span className="px-2 py-1 bg-surface-alt rounded-md">CGPA {edu.cgpa}</span>}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
