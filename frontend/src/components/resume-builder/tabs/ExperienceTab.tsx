import { X, Sparkles } from "lucide-react";
import type { ResumeData } from "@/components/resume/templates";
import type { OnChangeField } from "@/types/resume-builder";

interface ExperienceTabProps {
  experience: ResumeData["experience"];
  isEnhancingIndex: number | null;
  onChangeField: OnChangeField;
  onEnhance: (index: number) => void;
}

export function ExperienceTab({ experience, isEnhancingIndex, onChangeField, onEnhance }: ExperienceTabProps) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {experience.map((exp, index) => (
        <div key={index} className="p-4 bg-surface-alt border border-line rounded-xl relative group">
          <button onClick={() => onChangeField("experience", experience.filter((_, i) => i !== index))} className="absolute top-2 right-2 text-danger opacity-0 group-hover:opacity-100 transition-opacity">
            <X size={14} />
          </button>
          <div className="space-y-3">
            <input type="text" placeholder="Job Title" value={exp.role || ""} onChange={e => { const newExp = [...experience]; newExp[index].role = e.target.value; onChangeField("experience", newExp); }} className="w-full bg-transparent border-b border-line px-1 py-1 text-sm text-foreground focus:outline-none focus:border-accent font-bold" />
            <input type="text" placeholder="Company Name" value={exp.company || ""} onChange={e => { const newExp = [...experience]; newExp[index].company = e.target.value; onChangeField("experience", newExp); }} className="w-full bg-transparent border-b border-line px-1 py-1 text-sm text-foreground focus:outline-none focus:border-accent" />
            <div className="flex gap-2">
              <input type="text" placeholder="Start Date" value={exp.startDate || ""} onChange={e => { const newExp = [...experience]; newExp[index].startDate = e.target.value; onChangeField("experience", newExp); }} className="w-1/2 bg-transparent border-b border-line px-1 py-1 text-sm text-foreground focus:outline-none focus:border-accent" />
              <input type="text" placeholder="End Date" value={exp.endDate || ""} onChange={e => { const newExp = [...experience]; newExp[index].endDate = e.target.value; onChangeField("experience", newExp); }} className="w-1/2 bg-transparent border-b border-line px-1 py-1 text-sm text-foreground focus:outline-none focus:border-accent" />
            </div>
            <textarea placeholder="Description (bullet points separated by new lines)" rows={4} value={exp.description || ""} onChange={e => { const newExp = [...experience]; newExp[index].description = e.target.value; onChangeField("experience", newExp); }} className="w-full bg-surface border border-line rounded-lg px-2 py-2 text-xs text-muted focus:outline-none focus:border-accent resize-none leading-relaxed" />
            <div className="flex justify-end">
              <button onClick={() => onEnhance(index)} disabled={isEnhancingIndex === index} className="text-[10px] flex items-center gap-1 font-bold text-accent hover:opacity-75 transition-colors disabled:opacity-50">
                <Sparkles size={12} /> {isEnhancingIndex === index ? 'Enhancing...' : 'Enhance with AI'}
              </button>
            </div>
          </div>
        </div>
      ))}
      <button onClick={() => onChangeField("experience", [...experience, { company: "", role: "", startDate: "", endDate: "", description: "" }])} className="w-full py-2 border border-dashed border-accent/50 rounded-xl text-accent text-xs font-bold hover:bg-accent-soft transition-colors">
        + Add Experience
      </button>
    </div>
  );
}
