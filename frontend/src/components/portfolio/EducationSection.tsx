import { BookOpen } from "lucide-react";
import type { PortfolioEducation } from "@/types/portfolio";

interface EducationSectionProps {
  education: PortfolioEducation[];
}

export default function EducationSection({ education }: EducationSectionProps) {
  if (!education || education.length === 0) return null;

  return (
    <div className="glass-panel p-8 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
      <h3 className="text-sm font-bold text-muted uppercase tracking-widest mb-6 flex items-center gap-2">
        <BookOpen size={16} className="text-accent" /> Education
      </h3>
      <div className="space-y-6">
        {education.map((edu, idx) => (
          <div key={idx} className="flex gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-soft flex items-center justify-center shrink-0">
              <BookOpen size={20} className="text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-bold break-words">{edu.degree} in {edu.branch}</h4>
              <p className="text-sm text-muted mt-0.5 break-words">{edu.institute}</p>
              <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-muted">
                {edu.graduationYear && <span className="px-2 py-1 bg-surface-alt rounded-md">Class of {edu.graduationYear}</span>}
                {edu.cgpa && <span className="px-2 py-1 bg-surface-alt rounded-md text-accent">CGPA: {edu.cgpa}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
