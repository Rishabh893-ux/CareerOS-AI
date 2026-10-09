"use client";

import React from "react";
import { Briefcase, Search, MapPin, RefreshCw, Plus } from "lucide-react";

interface SearchPanelProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  locationTerm: string;
  onLocationTermChange: (value: string) => void;
  searching: boolean;
  onSearch: (e: React.FormEvent) => void;
  onShowAddForm: () => void;
}

const FIELD_WRAP = "flex items-center gap-2.5 bg-surface-alt border border-line rounded-xl px-3.5 py-2.5 focus-within:border-accent";

export default function SearchPanel({
  searchTerm,
  onSearchTermChange,
  locationTerm,
  onLocationTermChange,
  searching,
  onSearch,
  onShowAddForm,
}: SearchPanelProps) {
  return (
    <section aria-labelledby="search-title" className="premium-card p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 id="search-title" className="section-heading">
          <Search size={14} className="text-accent" aria-hidden /> Find openings
        </h2>
        <button type="button" onClick={onShowAddForm} className="text-xs font-semibold text-accent hover:underline flex items-center gap-1">
          <Plus size={13} aria-hidden /> Add a job manually
        </button>
      </div>
      <form onSubmit={onSearch} className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-end">
        <div>
          <label htmlFor="search-what" className="block text-xs font-semibold text-muted mb-1.5">Job title or skill</label>
          <div className={FIELD_WRAP}>
            <Briefcase size={16} className="text-muted shrink-0" aria-hidden />
            <input id="search-what" type="text" placeholder="e.g. Backend Developer, React" value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)} required
              className="bg-transparent text-sm w-full text-foreground placeholder:text-muted focus:outline-none" />
          </div>
        </div>
        <div>
          <label htmlFor="search-where" className="block text-xs font-semibold text-muted mb-1.5">Location <span className="font-normal">(optional)</span></label>
          <div className={FIELD_WRAP}>
            <MapPin size={16} className="text-muted shrink-0" aria-hidden />
            <input id="search-where" type="text" placeholder="e.g. Bengaluru, or Remote" value={locationTerm}
              onChange={(e) => onLocationTermChange(e.target.value)}
              className="bg-transparent text-sm w-full text-foreground placeholder:text-muted focus:outline-none" />
          </div>
        </div>
        <button type="submit" disabled={searching}
          className="h-[46px] px-5 btn-primary text-sm flex items-center justify-center gap-1.5 disabled:opacity-70">
          {searching ? <RefreshCw size={14} className="animate-spin" aria-hidden /> : <Search size={14} aria-hidden />}
          {searching ? "Searching…" : "Search"}
        </button>
      </form>
    </section>
  );
}
