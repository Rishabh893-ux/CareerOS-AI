"use client";

import React from "react";
import { Briefcase, ExternalLink, Check, Plus, Info } from "lucide-react";
import { SearchResponse } from "@/types/jobs";
import { timeAgo } from "./jobUtils";

interface SearchResultsPanelProps {
  search: SearchResponse | null;
  trackedUrls: Set<string>;
  trackingUrl: string | null;
  onTrackJob: (company: string, role: string, url: string, jobDescription: string) => void;
}

export default function SearchResultsPanel({ search, trackedUrls, trackingUrl, onTrackJob }: SearchResultsPanelProps) {
  const results = search?.results || [];

  return (
    <section aria-labelledby="results-title" className="premium-card p-6 flex flex-col max-h-[720px]">
      <h2 id="results-title" className="section-heading mb-4">
        {search ? `Openings (${results.length}${search.total && search.total > results.length ? ` of ${search.total.toLocaleString()}` : ""})` : "Openings"}
      </h2>

      {search?.source === "sample" && (
        <p role="status" className="mb-4 p-3 rounded-xl bg-warning/10 border border-warning/30 text-xs text-foreground flex gap-2">
          <Info size={14} className="text-warning shrink-0 mt-0.5" aria-hidden />
          <span><strong className="font-semibold">Sample listings, not real openings.</strong> {search.notice}</span>
        </p>
      )}

      {results.length > 0 ? (
        <ul className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
          {results.map((job) => {
            const tracked = trackedUrls.has(job.redirect_url);
            return (
              <li key={job.redirect_url} className="p-4 bg-surface-alt border border-line rounded-xl flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="text-sm font-bold text-foreground leading-snug">{job.title}</h3>
                  <p className="text-xs text-muted">
                    {job.company} · {job.location}
                    {job.postedAt ? ` · posted ${timeAgo(job.postedAt)}` : ""}
                  </p>
                  {job.salary && <p className="text-xs font-semibold text-foreground">{job.salary}</p>}
                  {job.description && <p className="text-xs text-muted line-clamp-2 leading-relaxed">{job.description}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <a href={job.redirect_url} target="_blank" rel="noopener noreferrer"
                    aria-label={`View ${job.title} at ${job.company} (new tab)`}
                    className="w-9 h-9 flex items-center justify-center border border-line hover:bg-surface text-muted hover:text-foreground rounded-lg">
                    <ExternalLink size={14} aria-hidden />
                  </a>
                  {tracked ? (
                    <span className="px-3.5 py-2 text-xs font-semibold text-success flex items-center gap-1">
                      <Check size={13} aria-hidden /> Tracked
                    </span>
                  ) : (
                    <button type="button" disabled={trackingUrl === job.redirect_url}
                      onClick={() => onTrackJob(job.company, job.title, job.redirect_url, job.description)}
                      className="px-3.5 py-2 btn-ghost text-xs font-semibold flex items-center gap-1 disabled:opacity-60">
                      <Plus size={13} aria-hidden /> {trackingUrl === job.redirect_url ? "Tracking…" : "Track"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center border border-line border-dashed rounded-xl text-center py-12">
          <Briefcase size={28} className="text-muted mb-2" aria-hidden />
          <p className="text-sm text-muted">{search ? "No openings matched. Try a broader title or another city." : "Search by title and city to see live openings."}</p>
        </div>
      )}
    </section>
  );
}
