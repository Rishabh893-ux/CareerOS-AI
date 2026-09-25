import { Code, GitBranch } from "lucide-react";
import type { Profile } from "@/types/dashboard";

interface ProjectsPanelProps {
  projects: Profile["projects"] | undefined;
}

export function ProjectsPanel({ projects }: ProjectsPanelProps) {
  if (!projects || projects.length === 0) return null;

  return (
    <div className="premium-card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-accent-soft border border-accent/30 flex items-center justify-center">
          <Code size={16} className="text-accent" aria-hidden />
        </div>
        <span className="section-heading">Projects ({projects.length})</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {projects.map((proj, idx) => (
          <div key={idx} className="p-4 bg-surface-alt border border-line rounded-2xl hover:border-accent/40 transition-all">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-bold text-foreground">{proj.title}</h4>
              {proj.repoUrl && (
                <a href={proj.repoUrl} target="_blank" rel="noopener noreferrer"
                  aria-label={`${proj.title} repository (new tab)`} title="View repository"
                  className="text-muted hover:text-accent transition-colors shrink-0 p-1 -m-1">
                  <GitBranch size={14} aria-hidden />
                </a>
              )}
            </div>
            <p className="text-xs text-muted mt-1 leading-relaxed line-clamp-2">{proj.description}</p>
            {proj.techStack?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2.5">
                {proj.techStack.map(t => (
                  <span key={t} className="skill-tag">{t}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
