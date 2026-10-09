import { Code } from "lucide-react";
import SectionHeading from "./SectionHeading";

interface SkillsSectionProps {
  skills: string[];
}

export default function SkillsSection({ skills }: SkillsSectionProps) {
  if (!skills || skills.length === 0) return null;

  return (
    <section aria-labelledby="portfolio-skills" className="portfolio-section p-6 sm:p-8">
      <SectionHeading id="portfolio-skills" icon={Code} count={skills.length}>Skills</SectionHeading>
      <ul className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <li key={skill} className="px-3 py-1.5 rounded-lg bg-accent-soft border border-accent/40 text-accent text-sm font-medium">
            {skill}
          </li>
        ))}
      </ul>
    </section>
  );
}
