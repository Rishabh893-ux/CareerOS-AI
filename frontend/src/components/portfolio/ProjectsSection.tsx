import { LayoutDashboard, ExternalLink } from "lucide-react";
import type { PortfolioProject } from "@/types/portfolio";
import SectionHeading from "./SectionHeading";

interface ProjectsSectionProps {
  projects: PortfolioProject[];
}

const CARD = "p-5 rounded-2xl bg-surface-alt border border-line flex flex-col h-full";

function ProjectBody({ proj, linked }: { proj: PortfolioProject; linked: boolean }) {
  return (
    <>
      <div className="flex justify-between items-start gap-3 mb-2">
        <h3 className={`text-base font-bold break-words ${linked ? "group-hover:text-accent transition-colors" : ""}`}>
          {proj.title}
          {linked && <span className="sr-only"> (opens repository in a new tab)</span>}
        </h3>
        {linked && <ExternalLink size={16} className="text-muted group-hover:text-accent transition-colors shrink-0 mt-0.5" aria-hidden />}
      </div>
      {proj.description && (
        <p className="text-sm text-muted leading-relaxed mb-4">{proj.description}</p>
      )}
      {proj.techStack && proj.techStack.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 mt-auto" aria-label="Tech stack">
          {proj.techStack.map((tech) => (
            <li key={tech} className="px-2 py-1 rounded bg-surface text-[11px] font-semibold text-muted border border-line">
              {tech}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function ProjectsSection({ projects }: ProjectsSectionProps) {
  if (!projects || projects.length === 0) return null;

  return (
    <section aria-labelledby="portfolio-projects" className="portfolio-section p-6 sm:p-8">
      <SectionHeading id="portfolio-projects" icon={LayoutDashboard}>Projects</SectionHeading>
      <ul className="grid md:grid-cols-2 gap-4">
        {projects.map((proj, idx) => (
          <li key={idx}>
            {proj.repoUrl ? (
              <a
                href={proj.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${CARD} group hover:border-accent transition-colors`}
              >
                <ProjectBody proj={proj} linked />
              </a>
            ) : (
              <div className={CARD}>
                <ProjectBody proj={proj} linked={false} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
