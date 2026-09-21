import { LayoutDashboard, ExternalLink } from "lucide-react";
import type { PortfolioProject } from "@/types/portfolio";

interface ProjectsSectionProps {
  projects: PortfolioProject[];
}

export default function ProjectsSection({ projects }: ProjectsSectionProps) {
  if (!projects || projects.length === 0) return null;

  return (
    <div className="glass-panel p-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
      <h3 className="text-sm font-bold text-muted uppercase tracking-widest mb-6 flex items-center gap-2">
        <LayoutDashboard size={16} className="text-accent" /> Featured Projects
      </h3>

      <div className="grid md:grid-cols-2 gap-4">
        {projects.map((proj, idx) => (
          <div key={idx} className="p-5 rounded-2xl bg-surface-alt border border-line hover:border-accent transition-all group cursor-pointer relative" onClick={() => proj.repoUrl && window.open(proj.repoUrl, '_blank')}>
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-base font-bold group-hover:text-accent transition-colors">{proj.title}</h4>
              {proj.repoUrl && (
                <div className="text-muted group-hover:text-accent transition-colors">
                  <ExternalLink size={16} />
                </div>
              )}
            </div>
            <p className="text-sm text-muted leading-relaxed mb-4 line-clamp-3">
              {proj.description}
            </p>
            {proj.techStack && proj.techStack.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-auto">
                {proj.techStack.map((tech: string) => (
                  <span key={tech} className="px-2 py-1 rounded bg-surface text-[10px] font-semibold text-muted border border-line">
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
