import type { OnChangeField } from "@/types/resume-builder";

interface SkillsTabProps {
  skills: string[];
  onChangeField: OnChangeField;
}

export function SkillsTab({ skills, onChangeField }: SkillsTabProps) {
  return (
    <div className="space-y-4 animate-fade-in-up">
      <div>
        <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Skills (comma separated)</label>
        <textarea rows={4} value={skills?.join(", ") || ""} onChange={e => onChangeField("skills", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} className="w-full bg-surface-alt border border-line rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent resize-none leading-relaxed" />
      </div>
    </div>
  );
}
