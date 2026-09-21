"use client";

import React from "react";
import { ShieldCheck, CheckCircle, Sparkles } from "lucide-react";
import Link from "next/link";

interface ResumeBuilderCardProps {
  allExtractedSkills: string[];
}

export function ResumeBuilderCard({ allExtractedSkills }: ResumeBuilderCardProps) {
  return (
    <div className="metric-card p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-success/10 border border-success/30 flex items-center justify-center">
            <ShieldCheck size={14} className="text-success" />
          </div>
          <span className="section-heading">Resume Builder</span>
        </div>
        <p className="text-xs text-muted mt-1 leading-relaxed">
          Create a perfectly formatted, ATS-compliant PDF resume from your profile. Live preview included.
        </p>

        <div className="space-y-1.5 bg-surface-alt border border-line p-3.5 rounded-xl mt-4 text-xs text-muted">
          <p className="flex items-center gap-1.5"><CheckCircle size={11} className="text-success" /> Multiple ATS Templates</p>
          <p className="flex items-center gap-1.5"><CheckCircle size={11} className="text-success" /> Live Interactive Preview</p>
          <p className="flex items-center gap-1.5"><CheckCircle size={11} className="text-success" /> Standard section headings</p>
        </div>

        {/* Skills count */}
        {allExtractedSkills.length > 0 && (
          <div className="mt-4 p-3 bg-surface-alt border border-line rounded-xl">
            <p className="text-[10px] text-muted mb-1.5 uppercase tracking-wider font-semibold">Includes {allExtractedSkills.length} skills</p>
            <div className="flex flex-wrap gap-1">
              {allExtractedSkills.slice(0, 6).map(s => (
                <span key={s} className="skill-tag">{s}</span>
              ))}
              {allExtractedSkills.length > 6 && (
                <span className="skill-tag opacity-50">+{allExtractedSkills.length - 6}</span>
              )}
            </div>
          </div>
        )}
      </div>

      <Link href="/resume/builder" className="w-full py-2.5 btn-primary text-xs font-bold flex items-center justify-center gap-2 mt-4 transition-all hover:scale-[1.02]">
        <Sparkles size={13} /> Open Builder
      </Link>
    </div>
  );
}
