import { Code } from "lucide-react";

interface SkillsSectionProps {
  skills: string[];
}

export default function SkillsSection({ skills }: SkillsSectionProps) {
  if (!skills || skills.length === 0) return null;

  return (
    <div className="glass-panel p-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
      <h3 className="text-sm font-bold text-muted uppercase tracking-widest mb-6 flex items-center gap-2">
        <Code size={16} className="text-accent" /> Technical Skills
      </h3>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill: string) => (
          <span key={skill} className="px-3 py-1.5 rounded-lg bg-accent-soft border border-accent text-accent text-sm font-medium">
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}
