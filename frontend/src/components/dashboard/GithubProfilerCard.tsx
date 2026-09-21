import { GitBranch, RefreshCw } from "lucide-react";
import type { Profile } from "@/types/dashboard";

interface GithubProfilerCardProps {
  githubAnalysis: Profile["githubAnalysis"];
  refreshingGithub: boolean;
  onSyncGithub: () => void;
}

export function GithubProfilerCard({ githubAnalysis, refreshingGithub, onSyncGithub }: GithubProfilerCardProps) {
  return (
    <div className="premium-card p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="section-heading"><GitBranch size={12} /> GitHub Profiler</span>
        <button onClick={onSyncGithub} disabled={refreshingGithub}
          className="p-1.5 hover:bg-surface-alt rounded-lg text-muted hover:text-foreground transition-all">
          <RefreshCw size={13} className={refreshingGithub ? "animate-spin text-accent" : ""} />
        </button>
      </div>

      {githubAnalysis ? (
        <div className="flex-1 space-y-4">
          <div className="flex items-end gap-2">
            <span className="text-4xl font-extrabold text-foreground">{githubAnalysis.score}</span>
            <div className="mb-1">
              <span className="text-xs text-muted">/ 100</span>
              <p className="text-[10px] text-accent font-semibold">Code Score</p>
            </div>
          </div>
          {/* Code score bar */}
          <div className="w-full h-1.5 bg-surface-alt rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-1000"
              style={{ width: `${githubAnalysis.score}%` }}
            />
          </div>
          <p className="text-xs text-muted leading-relaxed">{githubAnalysis.summary}</p>
          <div className="space-y-1.5">
            <p className="section-heading">Top Languages</p>
            <div className="flex flex-wrap gap-1.5">
              {githubAnalysis.topLanguages.map(l => (
                <span key={l} className="skill-tag text-accent border-accent/20 bg-accent-soft">{l}</span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-line rounded-2xl py-8 text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-accent-soft flex items-center justify-center">
            <GitBranch size={24} className="text-muted" />
          </div>
          <p className="text-xs text-muted">Connect your GitHub to analyse your code presence</p>
          <button onClick={onSyncGithub} disabled={refreshingGithub}
            className="px-4 py-2 bg-accent-soft hover:bg-accent/20 border border-accent/30 text-accent text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5">
            {refreshingGithub ? <RefreshCw size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Sync GitHub Stats
          </button>
        </div>
      )}
    </div>
  );
}
