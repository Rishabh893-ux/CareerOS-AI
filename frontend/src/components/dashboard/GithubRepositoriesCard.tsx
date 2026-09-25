"use client";

import { useState } from "react";
import { Code, ExternalLink, Star, ChevronDown, ChevronUp } from "lucide-react";
import type { Profile } from "@/types/dashboard";

interface GithubRepositoriesCardProps {
  repos: NonNullable<NonNullable<Profile["githubAnalysis"]>["repos"]>;
}

const INITIAL = 6;

export function GithubRepositoriesCard({ repos }: GithubRepositoriesCardProps) {
  const [expanded, setExpanded] = useState(false);
  // Most-starred first; no inner scroll box, so cards are never cut off mid-row.
  const sorted = [...repos].sort((a, b) => (b.stars || 0) - (a.stars || 0));
  const visible = expanded ? sorted : sorted.slice(0, INITIAL);

  return (
    <div className="premium-card p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="section-heading"><Code size={12} aria-hidden /> More on GitHub ({repos.length})</span>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {visible.map((repo) => {
          const body = (
            <>
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-bold text-foreground break-words min-w-0 group-hover:text-accent transition-colors">
                  {repo.name}
                  {repo.html_url && <span className="sr-only"> (opens on GitHub)</span>}
                </h4>
                {repo.html_url && <ExternalLink size={13} className="text-muted group-hover:text-accent transition-colors shrink-0" aria-hidden />}
              </div>
              <p className="text-xs text-muted mt-1 leading-relaxed line-clamp-2 flex-1">{repo.description || "No description provided."}</p>
              <div className="flex items-center justify-between mt-3">
                {repo.language ? (
                  <span className="skill-tag text-[11px] px-1.5 py-0.5 rounded-md">{repo.language}</span>
                ) : <span />}
                <span className="flex items-center gap-1 text-[11px] font-semibold text-muted">
                  <Star size={11} className="text-warning" aria-hidden /> {repo.stars || 0}<span className="sr-only"> stars</span>
                </span>
              </div>
            </>
          );
          const card = "p-4 bg-surface-alt border border-line rounded-2xl flex flex-col h-full";
          return (
            <li key={repo.name}>
              {repo.html_url ? (
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className={`${card} group hover:border-accent/40 transition-colors`}>
                  {body}
                </a>
              ) : (
                <div className={card}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
      {repos.length > INITIAL && (
        <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}
          className="mt-4 self-start text-xs font-semibold text-muted hover:text-foreground flex items-center gap-1 transition-colors">
          {expanded
            ? <><ChevronUp size={12} aria-hidden /> Show fewer</>
            : <><ChevronDown size={12} aria-hidden /> Show all {repos.length}</>}
        </button>
      )}
    </div>
  );
}
