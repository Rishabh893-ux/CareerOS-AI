import { X } from "lucide-react";
import type { ResumeData } from "@/components/resume/templates";
import type { OnChangeField } from "@/types/resume-builder";

interface EducationTabProps {
  education: ResumeData["education"];
  onChangeField: OnChangeField;
}

export function EducationTab({ education, onChangeField }: EducationTabProps) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {education.map((edu, index) => (
        <div key={index} className="p-4 bg-surface-alt border border-line rounded-xl relative group">
          <button onClick={() => onChangeField("education", education.filter((_, i) => i !== index))} className="absolute top-2 right-2 text-danger opacity-0 group-hover:opacity-100 transition-opacity">
            <X size={14} />
          </button>
          <div className="space-y-3">
            <input type="text" placeholder="Institute" value={edu.institute || ""} onChange={e => { const newE = [...education]; newE[index].institute = e.target.value; onChangeField("education", newE); }} className="w-full bg-transparent border-b border-line px-1 py-1 text-sm text-foreground focus:outline-none focus:border-accent font-bold" />
            <div className="flex gap-2">
              <input type="text" placeholder="Degree" value={edu.degree || ""} onChange={e => { const newE = [...education]; newE[index].degree = e.target.value; onChangeField("education", newE); }} className="w-1/2 bg-transparent border-b border-line px-1 py-1 text-sm text-foreground focus:outline-none focus:border-accent" />
              <input type="text" placeholder="Branch" value={edu.branch || ""} onChange={e => { const newE = [...education]; newE[index].branch = e.target.value; onChangeField("education", newE); }} className="w-1/2 bg-transparent border-b border-line px-1 py-1 text-sm text-foreground focus:outline-none focus:border-accent" />
            </div>
            <div className="flex gap-2">
              <input type="number" placeholder="Grad Year" value={edu.graduationYear || ""} onChange={e => { const newE = [...education]; newE[index].graduationYear = Number(e.target.value); onChangeField("education", newE); }} className="w-1/2 bg-transparent border-b border-line px-1 py-1 text-sm text-foreground focus:outline-none focus:border-accent" />
              <input type="number" placeholder="CGPA" value={edu.cgpa || ""} onChange={e => { const newE = [...education]; newE[index].cgpa = Number(e.target.value); onChangeField("education", newE); }} className="w-1/2 bg-transparent border-b border-line px-1 py-1 text-sm text-foreground focus:outline-none focus:border-accent" />
            </div>
          </div>
        </div>
      ))}
      <button onClick={() => onChangeField("education", [...education, { institute: "", degree: "", branch: "", cgpa: 0, graduationYear: new Date().getFullYear() }])} className="w-full py-2 border border-dashed border-accent/50 rounded-xl text-accent text-xs font-bold hover:bg-accent-soft transition-colors">
        + Add Education
      </button>
    </div>
  );
}
