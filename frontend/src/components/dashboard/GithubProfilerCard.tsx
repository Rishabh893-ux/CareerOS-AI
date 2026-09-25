import { GitBranch, RefreshCw, ListChecks, CheckCircle2 } from "lucide-react";
import type { Profile } from "@/types/dashboard";

interface GithubProfilerCardProps {
  githubAnalysis: Profile["githubAnalysis"];
  refreshingGithub: boolean;
  onSyncGithub: () => void;
}

function timeAgo(iso?: string) {
  if (!iso) return "";
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function GithubProfilerCard({ githubAnalysis, refreshingGithub, onSyncGithub }: GithubProfilerCardProps) {
  const signals = githubAnalysis?.signals || [];
  const recommendations = githubAnalysis?.recommendations || [];
  const languages = githubAnalysis?.metrics?.languages?.length
    ? githubAnalysis.metrics.languages.slice(0, 5)
    : (githubAnalysis?.topLanguages || []).map((name) => ({ name, share: 0 }));

  return (
    <div className="premium-card p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4 gap-3">
        <span className="section-heading"><GitBranch size={12} aria-hidden /> GitHub Profiler</span>
        <div className="flex items-center gap-2">
          {githubAnalysis?.computedAt && (
            <span className="text-[11px] text-muted hidden sm:inline">Analyzed {timeAgo(githubAnalysis.computedAt)}</span>
          )}
          <button type="button" onClick={onSyncGithub} disabled={refreshingGithub}
            aria-label={refreshingGithub ? "Analyzing GitHub" : "Re-analyze GitHub"} title="Re-analyze GitHub"
            className="w-8 h-8 flex items-center justify-center hover:bg-surface-alt rounded-lg text-muted hover:text-foreground transition-all">
            <RefreshCw size={14} aria-hidden className={refreshingGithub ? "animate-spin text-accent" : ""} />
          </button>
        </div>
      </div>

      {githubAnalysis ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* Left: score and how it was built */}
          <div className="space-y-5">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-extrabold text-foreground tabular-nums">{githubAnalysis.score}</span>
              <div className="mb-1">
                <span className="text-xs text-muted">/ 100</span>
                <p className="text-[11px] text-accent font-semibold">Code Score</p>
              </div>
            </div>
            <p className="text-sm text-muted leading-relaxed">{githubAnalysis.summary}</p>

            {signals.length > 0 ? (
              <ul className="space-y-3" aria-label="Score breakdown">
                {signals.map((s) => (
                  <li key={s.key}>
                    <div className="flex items-baseline justify-between gap-3 text-xs">
                      <span className="font-semibold text-foreground">{s.label}</span>
                      <span className="text-muted tabular-nums">{s.score}/{s.max}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full bg-surface-alt rounded-full overflow-hidden"
                      role="meter" aria-label={`${s.label} score`} aria-valuenow={s.score} aria-valuemin={0} aria-valuemax={s.max}>
                      <div className="h-full rounded-full bg-accent" style={{ width: `${(s.score / s.max) * 100}%` }} />
                    </div>
                    <p className="text-[11px] text-muted mt-1">{s.detail}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted">Re-analyze to see how this score breaks down.</p>
            )}
          </div>

          {/* Right: languages and what to do next */}
          <div className="space-y-5">
            {languages.length > 0 && (
              <div>
                <p className="section-heading mb-2">Languages</p>
                {languages[0].share > 0 ? (
                  <>
                    {/* One stacked bar: share of original repos by primary language */}
                    <div className="flex h-2 w-full rounded-full overflow-hidden bg-surface-alt" aria-hidden>
                      {languages.map((l, i) => (
                        <div key={l.name} style={{ width: `${l.share}%`, opacity: 1 - i * 0.17 }} className="h-full bg-accent border-r border-surface last:border-r-0" />
                      ))}
                    </div>
                    <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
                      {languages.map((l) => (
                        <li key={l.name} className="text-foreground">{l.name} <span className="text-muted tabular-nums">{l.share}%</span></li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {languages.map((l) => <span key={l.name} className="skill-tag">{l.name}</span>)}
                  </div>
                )}
              </div>
            )}

            {signals.length > 0 && (
              <div>
                <p className="section-heading mb-2"><ListChecks size={12} aria-hidden /> Next steps</p>
                {recommendations.length > 0 ? (
                  <ol className="space-y-2">
                    {recommendations.map((r, i) => (
                      <li key={i} className="flex gap-2.5 text-xs text-foreground leading-relaxed p-3 rounded-xl bg-surface-alt border border-line">
                        <span className="text-accent font-bold tabular-nums shrink-0">{i + 1}</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="flex items-center gap-2 text-xs text-success">
                    <CheckCircle2 size={14} aria-hidden /> Nothing to fix. Your GitHub covers every signal.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-line rounded-2xl py-8 text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-accent-soft flex items-center justify-center">
            <GitBranch size={24} className="text-muted" aria-hidden />
          </div>
          <p className="text-sm font-semibold text-foreground">See what your GitHub says about you</p>
          <p className="text-xs text-muted max-w-sm">We check READMEs, activity, live demos and more, then tell you exactly what to improve.</p>
          <button type="button" onClick={onSyncGithub} disabled={refreshingGithub}
            className="px-4 py-2 btn-primary text-xs flex items-center gap-1.5">
            <RefreshCw size={12} aria-hidden className={refreshingGithub ? "animate-spin" : ""} />
            {refreshingGithub ? "Analyzing…" : "Analyze GitHub"}
          </button>
        </div>
      )}
    </div>
  );
}
