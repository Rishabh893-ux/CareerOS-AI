"use client";

import React from "react";
import { Briefcase, ExternalLink } from "lucide-react";
import { SearchResult } from "@/types/jobs";

interface SearchResultsPanelProps {
  searchResults: SearchResult[];
  onTrackJob: (company: string, role: string, url: string, jobDescription: string) => void;
}

export default function SearchResultsPanel({ searchResults, onTrackJob }: SearchResultsPanelProps) {
  return (
    <div className="glass-panel p-6 flex flex-col min-h-[500px] max-h-[700px]">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
        Available Postings ({searchResults.length})
      </h3>

      {searchResults.length > 0 ? (
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {searchResults.map((job, idx) => (
            <div key={idx} className="p-4 bg-surface-alt border border-line rounded-xl hover:border-accent/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 space-y-1">
                <h4 className="text-sm font-bold text-foreground leading-snug">{job.title}</h4>
                <p className="text-xs text-muted">{job.company} • {job.location}</p>
                <p className="text-[10px] text-muted font-semibold">{job.salary}</p>
              </div>
              <div className="flex gap-2">
                <a
                  href={job.redirect_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 border border-line hover:bg-surface text-muted hover:text-foreground rounded-lg transition-all"
                >
                  <ExternalLink size={14} />
                </a>
                <button
                  onClick={() => onTrackJob(job.company, job.title, job.redirect_url, job.description)}
                  className="px-3.5 py-2 bg-accent-soft hover:opacity-90 border border-accent/30 text-accent text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  Track Job
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center border border-line border-dashed rounded-xl text-center py-12">
          <Briefcase size={28} className="text-muted mb-2" />
          <p className="text-xs text-muted">No vacancies loaded yet. Type a title and search above.</p>
        </div>
      )}
    </div>
  );
}
