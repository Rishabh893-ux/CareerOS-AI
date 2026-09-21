"use client";

import React, { useState } from "react";
import { Eye, AlertCircle, CheckCircle, Sparkles, Flame, ChevronDown, ScanText } from "lucide-react";
import { AtsResult } from "@/types/resume";

interface DiagnosticReportProps {
  atsResult: AtsResult | null;
  scoreColor: string;
}

export function DiagnosticReport({ atsResult, scoreColor }: DiagnosticReportProps) {
  const [showRawText, setShowRawText] = useState(false);

  return (
    <div className="metric-card p-6 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-accent-soft border border-accent/20 flex items-center justify-center">
          <Eye size={14} className="text-accent" />
        </div>
        <span className="section-heading">Diagnostic Report</span>
      </div>

      {atsResult ? (
        <div className="flex-1 space-y-4 overflow-y-auto max-h-[340px] pr-1">
          {/* Score banner */}
          <div className="p-4 rounded-2xl bg-accent-soft border border-accent/20 flex justify-between items-center">
            <div>
              <h4 className="text-xs font-bold text-foreground">Match Score</h4>
              <p className="text-[10px] text-muted mt-0.5">ATS compatibility rating</p>
            </div>
            <div className={`text-3xl font-black ${scoreColor}`}>{atsResult.score}%</div>
          </div>

          {/* Missing keywords */}
          <div className="space-y-2">
            <h4 className="section-heading"><AlertCircle size={11} className="text-danger" /> Missing Keywords</h4>
            {atsResult.missingKeywords.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {atsResult.missingKeywords.map(key => (
                  <span key={key} className="skill-tag text-danger border-danger/30 bg-danger/10">{key}</span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-success flex items-center gap-1"><CheckCircle size={12} /> All keywords covered!</p>
            )}
          </div>

          {/* Formatting */}
          <div className="space-y-2">
            <h4 className="section-heading">Formatting Feedback</h4>
            <p className="text-xs text-foreground leading-relaxed bg-surface-alt border border-line rounded-xl p-3">{atsResult.formattingFeedback}</p>
          </div>

          {/* Suggestions */}
          <div className="space-y-2">
            <h4 className="section-heading"><Sparkles size={11} className="text-accent" /> Suggestions</h4>
            <ul className="space-y-2">
              {atsResult.suggestions.map((sug, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  {sug}
                </li>
              ))}
            </ul>
          </div>

          {/* Raw extracted text ("what an ATS actually sees") */}
          {atsResult.rawExtractedText && (
            <div className="space-y-2">
              <button
                onClick={() => setShowRawText(!showRawText)}
                className="section-heading w-full justify-between hover:text-accent transition-colors"
              >
                <span className="flex items-center gap-1.5"><ScanText size={11} /> What an ATS Actually Sees</span>
                <ChevronDown size={12} className={`transition-transform ${showRawText ? "rotate-180" : ""}`} />
              </button>
              {showRawText && (
                <>
                  <p className="text-[10px] text-muted leading-relaxed">
                    This is the plain text an ATS parser extracts from your file — no fonts, columns, or icons. If something important looks missing or garbled here, an ATS likely can&apos;t read it either.
                  </p>
                  <pre className="text-[10px] text-foreground/80 leading-relaxed bg-surface-alt border border-line rounded-xl p-3 whitespace-pre-wrap break-words max-h-[240px] overflow-y-auto font-mono">
                    {atsResult.rawExtractedText}
                  </pre>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-line rounded-2xl py-14 text-center gap-3 min-h-[340px]">
          <div className="w-14 h-14 rounded-2xl bg-surface-alt border border-line flex items-center justify-center">
            <Flame size={24} className="text-muted" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted">No report yet</p>
            <p className="text-xs text-muted max-w-xs mt-1 leading-relaxed">
              Paste a job description and click Run ATS Check to see your compatibility score, missing keywords, and tailored suggestions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
