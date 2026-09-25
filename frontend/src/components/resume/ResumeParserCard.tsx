"use client";

import React from "react";
import { FileText, Upload, RefreshCw, ImageIcon, X } from "lucide-react";
import { Profile, ACCEPTED_EXTENSIONS } from "@/types/resume";

interface ResumeParserCardProps {
  profile: Profile | null;
  uploading: boolean;
  removing: boolean;
  uploadProgress: string;
  dragOver: boolean;
  setDragOver: (value: boolean) => void;
  selectedFile: File | null;
  previewUrl: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (file: File) => void;
  onClearFile: () => void;
  onUpload: () => void;
  onRemoveResume: () => void;
}

export function ResumeParserCard({
  profile,
  uploading,
  removing,
  uploadProgress,
  dragOver,
  setDragOver,
  selectedFile,
  previewUrl,
  fileInputRef,
  onFileSelect,
  onClearFile,
  onUpload,
  onRemoveResume,
}: ResumeParserCardProps) {
  return (
    <div className="premium-card p-6 flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-soft border border-accent/30 flex items-center justify-center">
              <FileText size={16} className="text-accent" />
            </div>
            <span className="section-heading">Resume Parser</span>
          </div>
          <span className="premium-badge">AI Powered</span>
        </div>
        <p className="text-xs text-muted mt-2 leading-relaxed">
          Upload to save to your profile. AI extracts your skills automatically.
        </p>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-line to-transparent" />

      {/* Status */}
      {profile?.resumeLastParsedAt && (
        <div className="p-3 bg-success/10 border border-success/30 rounded-xl flex items-start justify-between">
          <div>
            <p className="text-[11px] text-success font-bold uppercase tracking-wider">✅ Profile Resume Active</p>
            <p className="text-[11px] text-muted mt-0.5">
              Parsed: {new Date(profile.resumeLastParsedAt).toLocaleDateString()} · {profile.resumeExtractedSkills?.length || 0} skills extracted
            </p>
          </div>
          <button
            onClick={onRemoveResume}
            disabled={removing}
            className="text-[11px] bg-danger/10 hover:bg-danger/20 text-danger px-2 py-1 rounded-md transition-colors disabled:opacity-50"
          >
            {removing ? "Removing..." : "Remove"}
          </button>
        </div>
      )}

      {/* Drop Zone for Profile */}
      <div
        onDrop={(e) => {
          e.preventDefault(); setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onFileSelect(file);
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all
          ${dragOver
            ? "border-accent bg-accent-soft scale-[1.01]"
            : selectedFile
              ? "border-success/40 bg-success/10"
              : "border-line hover:border-accent/40 hover:bg-accent-soft"
          }`}
      >
        {selectedFile ? (
          <div className="space-y-2">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-full max-h-24 object-contain rounded-lg mx-auto" />
            ) : (
              <div className="w-10 h-10 mx-auto rounded-xl bg-accent-soft border border-accent/20 flex items-center justify-center">
                <FileText size={20} className="text-accent" />
              </div>
            )}
            <p className="text-xs font-semibold text-foreground truncate px-2">{selectedFile.name}</p>
            <p className="text-[11px] text-muted">{(selectedFile.size / 1024).toFixed(0)} KB</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClearFile(); }}
              className="text-[11px] text-danger/70 hover:text-danger flex items-center gap-1 mx-auto"
            >
              <X size={10} /> Remove
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-muted">
              <FileText size={18} />
              <span className="text-muted font-medium">or</span>
              <ImageIcon size={18} />
            </div>
            <p className="text-xs font-semibold text-foreground">Drop your resume here</p>
            <p className="text-[11px] text-muted">PDF · JPG · PNG · WEBP</p>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept={ACCEPTED_EXTENSIONS} onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])} className="hidden" />
      </div>

      {/* Upload Button */}
      <button onClick={onUpload} disabled={!selectedFile || uploading} className="w-full py-2.5 btn-primary text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
        {uploading ? <><RefreshCw size={13} className="animate-spin" /><span>{uploadProgress || "Uploading..."}</span></> : <><Upload size={13} /><span>Parse to Profile</span></>}
      </button>
    </div>
  );
}
