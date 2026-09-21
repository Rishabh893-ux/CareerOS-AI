"use client";

import React from "react";
import { Sparkles, RefreshCw, Zap, FileText, X } from "lucide-react";
import { Profile, ACCEPTED_EXTENSIONS } from "@/types/resume";

interface AtsCheckerFormProps {
  profile: Profile | null;
  checkingAts: boolean;
  jobDescription: string;
  setJobDescription: (value: string) => void;
  atsDragOver: boolean;
  setAtsDragOver: (value: boolean) => void;
  atsSelectedFile: File | null;
  atsFileInputRef: React.RefObject<HTMLInputElement | null>;
  onAtsFileSelect: (file: File) => void;
  onClearAtsFile: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AtsCheckerForm({
  profile,
  checkingAts,
  jobDescription,
  setJobDescription,
  atsDragOver,
  setAtsDragOver,
  atsSelectedFile,
  atsFileInputRef,
  onAtsFileSelect,
  onClearAtsFile,
  onSubmit,
}: AtsCheckerFormProps) {
  return (
    <div className="premium-card p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-soft border border-accent/30 flex items-center justify-center">
            <Sparkles size={16} className="text-accent" />
          </div>
          <div>
            <span className="section-heading">Run ATS Check</span>
            <p className="text-[11px] text-muted mt-0.5">Score your resume against a real job description</p>
          </div>
        </div>
        <span className="premium-badge">AI Powered</span>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-line to-transparent" />

      <form onSubmit={onSubmit} className="flex flex-col gap-4 flex-1">
        {/* Optional targeted resume upload */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">1. Resume (Optional)</label>
          <div
            onDrop={(e) => {
              e.preventDefault(); setAtsDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) onAtsFileSelect(file);
            }}
            onDragOver={(e) => { e.preventDefault(); setAtsDragOver(true); }}
            onDragLeave={() => setAtsDragOver(false)}
            onClick={() => !atsSelectedFile && atsFileInputRef.current?.click()}
            className={`relative border border-dashed rounded-xl p-3 text-center cursor-pointer transition-all
              ${atsDragOver ? "border-accent bg-accent-soft" : atsSelectedFile ? "border-success/40 bg-success/10" : "border-line hover:border-accent/40 hover:bg-accent-soft"}
            `}
          >
            {atsSelectedFile ? (
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-success" />
                  <p className="text-xs font-semibold text-foreground truncate max-w-[150px]">{atsSelectedFile.name}</p>
                </div>
                <button type="button" onClick={(e) => { e.stopPropagation(); onClearAtsFile(); }} className="text-[10px] text-danger/70 hover:text-danger flex items-center gap-1">
                  <X size={12} /> Remove
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-muted">
                {profile?.resumeLastParsedAt
                  ? "Drop a specific PDF/Img here, or leave blank to use your profile resume"
                  : "Drop a PDF/Img here to check against the JD"}
              </p>
            )}
            <input ref={atsFileInputRef} type="file" accept={ACCEPTED_EXTENSIONS} onChange={(e) => e.target.files?.[0] && onAtsFileSelect(e.target.files[0])} className="hidden" />
          </div>
        </div>

        {/* Job Description Textarea */}
        <div className="space-y-1.5 flex-1 flex flex-col">
          <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">2. Job Description</label>
          <textarea
            placeholder="Paste the full job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full flex-1 bg-surface-alt border border-line rounded-xl px-4 py-3 text-xs text-foreground placeholder:text-muted resize-none leading-relaxed min-h-[160px] focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={checkingAts || (!profile?.resumeLastParsedAt && !atsSelectedFile)}
          className="w-full py-3 btn-primary text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {checkingAts ? (
            <><RefreshCw size={13} className="animate-spin" /><span>Scanning ATS Filters...</span></>
          ) : (
            <><Zap size={13} /><span>Run ATS Check</span></>
          )}
        </button>
      </form>
    </div>
  );
}
