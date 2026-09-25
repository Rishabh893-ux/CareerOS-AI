import { X, Sparkles } from "lucide-react";
import type { ResumeData } from "@/components/resume/templates";
import type { OnChangeField } from "@/types/resume-builder";

interface ProjectsTabProps {
  projects: ResumeData["projects"];
  isEnhancingIndex: number | null;
  onChangeField: OnChangeField;
  onEnhance: (index: number) => void;
}

export function ProjectsTab({ projects, isEnhancingIndex, onChangeField, onEnhance }: ProjectsTabProps) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {projects.map((proj, index) => (
        <div key={index} className="p-4 bg-surface-alt border border-line rounded-xl relative group">
          <button onClick={() => onChangeField("projects", projects.filter((_, i) => i !== index))} type="button" aria-label={`Remove project ${index + 1}`} title="Remove"
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-lg text-danger hover:bg-danger/10 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 focus-visible:opacity-100 transition-opacity">
            <X size={14} aria-hidden />
          </button>
          <div className="space-y-3">
            <input type="text" placeholder="Project Title" value={proj.title || ""} onChange={e => { const newP = [...projects]; newP[index].title = e.target.value; onChangeField("projects", newP); }} className="w-full bg-transparent border-b border-line px-1 py-1 text-sm text-foreground focus:outline-none focus:border-accent font-bold" />
            <input type="text" placeholder="Repository URL" value={proj.repoUrl || ""} onChange={e => { const newP = [...projects]; newP[index].repoUrl = e.target.value; onChangeField("projects", newP); }} className="w-full bg-transparent border-b border-line px-1 py-1 text-sm text-foreground focus:outline-none focus:border-accent" />
            <input type="text" placeholder="Tech Stack (comma separated)" value={proj.techStack?.join(", ") || ""} onChange={e => { const newP = [...projects]; newP[index].techStack = e.target.value.split(",").map(s=>s.trim()); onChangeField("projects", newP); }} className="w-full bg-transparent border-b border-line px-1 py-1 text-sm text-foreground focus:outline-none focus:border-accent" />
            <textarea placeholder="Description (bullet points)" rows={3} value={proj.description || ""} onChange={e => { const newP = [...projects]; newP[index].description = e.target.value; onChangeField("projects", newP); }} className="w-full bg-surface border border-line rounded-lg px-2 py-2 text-xs text-muted focus:outline-none focus:border-accent resize-none leading-relaxed" />
            <div className="flex justify-end">
              <button onClick={() => onEnhance(index)} disabled={isEnhancingIndex === index} className="text-[11px] flex items-center gap-1 font-bold text-accent hover:opacity-75 transition-colors disabled:opacity-50">
                <Sparkles size={12} /> {isEnhancingIndex === index ? 'Enhancing...' : 'Enhance with AI'}
              </button>
            </div>
          </div>
        </div>
      ))}
      <button onClick={() => onChangeField("projects", [...projects, { title: "", repoUrl: "", techStack: [], description: "" }])} className="w-full py-2 border border-dashed border-accent/50 rounded-xl text-accent text-xs font-bold hover:bg-accent-soft transition-colors">
        + Add Project
      </button>
    </div>
  );
}
