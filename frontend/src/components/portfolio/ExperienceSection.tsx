import { Briefcase, Calendar } from "lucide-react";
import type { PortfolioExperience } from "@/types/portfolio";

interface ExperienceSectionProps {
  experience: PortfolioExperience[];
}

export default function ExperienceSection({ experience }: ExperienceSectionProps) {
  if (!experience || experience.length === 0) return null;

  return (
    <div className="glass-panel p-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <h3 className="text-sm font-bold text-muted uppercase tracking-widest mb-6 flex items-center gap-2">
        <Briefcase size={16} className="text-accent" /> Professional Experience
      </h3>
      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-line">
        {experience.map((exp, idx) => (
          <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-line bg-surface group-[.is-active]:bg-accent-soft text-muted group-[.is-active]:text-accent shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors">
              <Briefcase size={16} />
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] min-w-0 p-5 rounded-2xl bg-surface-alt border border-line hover:border-accent transition-all">
              <div className="flex items-center justify-between mb-1 gap-2">
                <h4 className="font-bold text-base break-words min-w-0">{exp.role}</h4>
                <div className="text-[10px] font-semibold text-accent bg-accent-soft px-2 py-1 rounded-lg shrink-0 flex items-center gap-1"><Calendar size={10} /> {exp.startDate} - {exp.endDate}</div>
              </div>
              <div className="text-sm font-semibold text-muted mb-3 break-words">{exp.company}</div>
              <div className="text-sm text-muted leading-relaxed space-y-1">
                {exp.description && exp.description.split('\n').filter((l: string) => l.trim()).map((line: string, i: number) => (
                  <div key={i} className="flex gap-2"><span className="text-accent mt-1">•</span> <span className="break-words min-w-0">{line.replace(/^- /, '')}</span></div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
