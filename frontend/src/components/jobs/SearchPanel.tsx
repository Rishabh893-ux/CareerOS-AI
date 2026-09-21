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
    <div className="glass-panel p-6 h-fit">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
        <Search size={18} className="text-accent animate-float" />
        <span>Search Live Vacancies</span>
      </h3>
      <form onSubmit={onSearch} className="space-y-4">
        <div className="flex items-center gap-3 bg-surface-alt border border-line rounded-xl px-4 py-3 focus-within:border-accent">
          <Briefcase size={16} className="text-muted" />
          <input
            type="text"
            placeholder="Developer, Backend, MERN..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="bg-transparent text-sm w-full text-foreground focus:outline-none"
            required
          />
        </div>
        <div className="flex items-center gap-3 bg-surface-alt border border-line rounded-xl px-4 py-3 focus-within:border-accent">
          <MapPin size={16} className="text-muted" />
          <input
            type="text"
            placeholder="Bengaluru, Noida, Remote..."
            value={locationTerm}
            onChange={(e) => onLocationTermChange(e.target.value)}
            className="bg-transparent text-sm w-full text-foreground focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="w-full py-3 bg-accent hover:opacity-90 text-accent-contrast text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          {searching ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>Searching Listings...</span>
            </>
          ) : (
            <>
              <Search size={14} />
              <span>Fetch Live Jobs</span>
            </>
          )}
        </button>
      </form>

      {/* Add Job manually button */}
      <button
        onClick={onShowAddForm}
        className="w-full mt-4 py-3 border border-dashed border-line hover:border-accent bg-surface-alt hover:bg-accent-soft text-muted hover:text-accent text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <Plus size={14} />
        <span>Add Custom Application</span>
      </button>
    </div>
  );
}
