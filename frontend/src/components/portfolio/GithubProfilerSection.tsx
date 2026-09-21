import { GitBranch, Star, ExternalLink } from "lucide-react";
import type { PortfolioRepo } from "@/types/portfolio";

interface GithubAnalysis {
  score: number;
  summary: string;
  topLanguages: string[];
  repos: PortfolioRepo[];
}

interface GithubProfilerSectionProps {
  githubAnalysis?: GithubAnalysis;
  githubUsername: string;
}

export default function GithubProfilerSection({ githubAnalysis, githubUsername }: GithubProfilerSectionProps) {
  if (!githubAnalysis || !(githubAnalysis.score > 0)) return null;

  return (
    <div className="glass-panel p-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <h3 className="text-sm font-bold text-muted uppercase tracking-widest flex items-center gap-2">
          <GitBranch size={16} className="text-accent" /> GitHub Profiler
        </h3>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-accent-soft flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin-slow" />
            <span className="text-sm font-bold">{githubAnalysis.score}</span>
          </div>
          <div className="text-xs font-semibold text-muted uppercase">Code<br/>Score</div>
        </div>
      </div>
      <p className="text-sm text-muted leading-relaxed italic mb-6">&ldquo;{githubAnalysis.summary}&rdquo;</p>

      {githubAnalysis.topLanguages && githubAnalysis.topLanguages.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {githubAnalysis.topLanguages.map((lang, idx) => (
            <span key={idx} className="px-3 py-1 bg-surface-alt border border-line rounded-full text-xs font-semibold">{lang}</span>
          ))}
        </div>
      )}

      {githubAnalysis.repos && githubAnalysis.repos.length > 0 && (
        <div className="mb-8">
          <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Top Repositories</h4>
          <div className="grid md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            {githubAnalysis.repos.slice(0, 10).map((repo, idx) => (
              <div key={idx} className="p-4 bg-surface-alt border border-line rounded-2xl flex flex-col hover:border-accent transition-all cursor-pointer relative group/repo" onClick={() => repo.html_url && window.open(repo.html_url, '_blank')}>
                <div className="flex justify-between items-start gap-2">
                  <h5 className="text-sm font-bold overflow-hidden break-words group-hover/repo:text-accent transition-colors">{repo.name}</h5>
                  {repo.html_url && (
                    <div className="text-muted group-hover/repo:text-accent transition-colors shrink-0">
                      <ExternalLink size={14} />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted mt-1 line-clamp-2 flex-1">{repo.description}</p>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-[10px] text-accent bg-accent-soft px-2 py-0.5 rounded-md font-semibold">{repo.language || "Code"}</span>
                  <span className="text-[10px] font-bold text-muted flex items-center gap-1"><Star size={10} className="text-warning"/> {repo.stars}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contribution Graph */}
      {githubUsername && (
        <div>
          <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">GitHub Activity</h4>
          <div className="p-4 bg-surface-alt rounded-2xl border border-line overflow-x-auto flex justify-center custom-scrollbar">
            <img
              src={`https://ghchart.rshah.org/${githubUsername}`}
              alt="GitHub Contribution Chart"
              className="opacity-90 w-full sm:min-w-[600px] pointer-events-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
