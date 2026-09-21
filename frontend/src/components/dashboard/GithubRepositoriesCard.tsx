import { Code, GitBranch, Star } from "lucide-react";
import type { Profile } from "@/types/dashboard";

interface GithubRepositoriesCardProps {
  repos: NonNullable<NonNullable<Profile["githubAnalysis"]>["repos"]>;
}

export function GithubRepositoriesCard({ repos }: GithubRepositoriesCardProps) {
  return (
    <div className="premium-card p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="section-heading"><Code size={12} /> GitHub Repositories ({repos.length})</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {repos.map((repo, idx) => (
          <div key={idx} className="p-4 bg-surface-alt border border-line rounded-2xl hover:border-accent/40 transition-all flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-bold text-foreground break-words overflow-hidden">{repo.name}</h4>
              {repo.html_url && (
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer"
                  className="text-muted hover:text-accent transition-colors shrink-0">
                  <GitBranch size={13} />
                </a>
              )}
            </div>
            <p className="text-xs text-muted mt-1 leading-relaxed line-clamp-2 flex-1">{repo.description || "No description provided."}</p>
            <div className="flex items-center justify-between mt-3">
              {repo.language ? (
                <span className="skill-tag text-[10px] text-accent border-accent/20 bg-accent-soft px-1.5 py-0.5 rounded-md">{repo.language}</span>
              ) : <span />}
              <div className="flex items-center gap-1 text-[10px] font-semibold text-muted">
                <Star size={10} className="text-warning" /> {repo.stars}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
