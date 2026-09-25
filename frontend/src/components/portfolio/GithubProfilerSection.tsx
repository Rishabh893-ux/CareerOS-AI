import { GitBranch, Star, ExternalLink, ArrowUpRight } from "lucide-react";
import type { PortfolioRepo } from "@/types/portfolio";
import SectionHeading from "./SectionHeading";

interface GithubAnalysis {
  score: number;
  summary: string;
  topLanguages: string[];
  repos: PortfolioRepo[];
}

interface GithubProfilerSectionProps {
  githubAnalysis?: GithubAnalysis;
  /** Repos not already shown as a project (see linkProjectsToRepos). */
  otherRepos: PortfolioRepo[];
  githubUsername: string;
}

const MAX_REPOS = 6;

export default function GithubProfilerSection({ githubAnalysis, otherRepos, githubUsername }: GithubProfilerSectionProps) {
  if (!githubAnalysis) return null;
  const { summary, topLanguages = [], repos = [] } = githubAnalysis;
  if (!summary && otherRepos.length === 0) return null;

  // Most-starred first; the numeric code score stays private (see CareerScoreSection).
  const topRepos = [...otherRepos].sort((a, b) => (b.stars || 0) - (a.stars || 0)).slice(0, MAX_REPOS);
  const profileUrl = githubUsername ? `https://github.com/${encodeURIComponent(githubUsername)}` : "";

  return (
    <section aria-labelledby="portfolio-github" className="portfolio-section p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <SectionHeading id="portfolio-github" icon={GitBranch}>Open Source</SectionHeading>
        {profileUrl && (
          <a href={profileUrl} target="_blank" rel="noreferrer"
            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 shrink-0">
            @{githubUsername} <ArrowUpRight size={12} aria-hidden />
          </a>
        )}
      </div>

      {summary && <p className="text-sm text-muted leading-relaxed mb-5 max-w-3xl">{summary}</p>}

      {topLanguages.length > 0 && (
        <ul className="flex flex-wrap gap-2 mb-6" aria-label="Top languages">
          {topLanguages.map((lang) => (
            <li key={lang} className="px-3 py-1 bg-surface-alt border border-line rounded-full text-xs font-semibold">{lang}</li>
          ))}
        </ul>
      )}

      {topRepos.length > 0 && (
        <>
          <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">More on GitHub</h3>
          <ul className="grid md:grid-cols-2 gap-3">
            {topRepos.map((repo) => {
              const body = (
                <>
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-sm font-bold break-words min-w-0 group-hover:text-accent transition-colors">
                      {repo.name}
                      {repo.html_url && <span className="sr-only"> (opens on GitHub)</span>}
                    </h4>
                    {repo.html_url && <ExternalLink size={14} className="text-muted group-hover:text-accent transition-colors shrink-0" aria-hidden />}
                  </div>
                  {repo.description && <p className="text-xs text-muted mt-1 line-clamp-2 flex-1">{repo.description}</p>}
                  <div className="flex justify-between items-center mt-3 gap-2">
                    {repo.language ? (
                      <span className="text-[11px] text-accent bg-accent-soft px-2 py-0.5 rounded-md font-semibold">{repo.language}</span>
                    ) : <span />}
                    <span className="text-[11px] font-bold text-muted flex items-center gap-1">
                      <Star size={11} className="text-warning" aria-hidden />
                      {repo.stars || 0}<span className="sr-only"> stars</span>
                    </span>
                  </div>
                </>
              );
              const card = "p-4 bg-surface-alt border border-line rounded-2xl flex flex-col h-full";
              return (
                <li key={repo.name}>
                  {repo.html_url ? (
                    <a href={repo.html_url} target="_blank" rel="noreferrer" className={`${card} group hover:border-accent transition-colors`}>
                      {body}
                    </a>
                  ) : (
                    <div className={card}>{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
          {otherRepos.length > MAX_REPOS && profileUrl && (
            <a href={`${profileUrl}?tab=repositories`} target="_blank" rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
              View all {repos.length} repositories <ArrowUpRight size={14} aria-hidden />
            </a>
          )}
        </>
      )}

      {/* Contribution graph */}
      {githubUsername && (
        <div className="mt-8">
          <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Contribution Activity</h3>
          <div className="p-4 bg-surface-alt rounded-2xl border border-line overflow-x-auto custom-scrollbar">
            {/* eslint-disable-next-line @next/next/no-img-element -- third-party SVG chart */}
            <img
              src={`https://ghchart.rshah.org/${encodeURIComponent(githubUsername)}`}
              alt={`${githubUsername}'s GitHub contributions over the past year`}
              loading="lazy"
              width={663}
              height={104}
              // The chart service can take several seconds; reserve its space so the page doesn't jump.
              className="w-full min-w-[600px] h-auto aspect-[663/104]"
            />
          </div>
        </div>
      )}
    </section>
  );
}
