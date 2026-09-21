import { Zap, ChevronUp, ChevronDown } from "lucide-react";
import { SkillPill } from "./SkillPill";

interface SkillsPanelProps {
  allSkills: string[];
  displaySkills: string[];
  skillsExpanded: boolean;
  onToggleExpanded: () => void;
}

export function SkillsPanel({ allSkills, displaySkills, skillsExpanded, onToggleExpanded }: SkillsPanelProps) {
  if (allSkills.length === 0) return null;

  return (
    <div className="premium-card p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="section-heading"><Zap size={12} className="text-accent" /> Your Skills ({allSkills.length})</span>
        {allSkills.length > 10 && (
          <button onClick={onToggleExpanded}
            className="text-xs text-muted hover:text-foreground flex items-center gap-1 transition-all">
            {skillsExpanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show all</>}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {displaySkills.map((skill, i) => (
          <SkillPill key={skill} skill={skill} delay={i * 30} />
        ))}
        {!skillsExpanded && allSkills.length > 10 && (
          <span className="skill-tag opacity-50">+{allSkills.length - 10} more</span>
        )}
      </div>
    </div>
  );
}
