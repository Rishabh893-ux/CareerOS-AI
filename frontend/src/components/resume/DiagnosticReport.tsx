"use client";

import React, { useState } from "react";
import { Eye, Check, X, Minus, Sparkles, Flame, ChevronDown, ScanText, Info } from "lucide-react";
import { AtsResult, AtsKeyword } from "@/types/resume";

interface DiagnosticReportProps {
  atsResult: AtsResult | null;
}

const scoreTone = (score: number) => (score >= 75 ? "text-success" : score >= 50 ? "text-warning" : "text-danger");
const barTone = (score: number) => (score >= 75 ? "bg-success" : score >= 50 ? "bg-warning" : "bg-danger");

function KeywordGroup({ title, items }: { title: string; items: AtsKeyword[] }) {
  if (items.length === 0) return null;
  const found = items.filter((k) => k.found).length;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h4 className="text-xs font-semibold text-foreground">{title}</h4>
        <span className="text-[11px] text-muted tabular-nums">{found} of {items.length} found</span>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((k) => (
          <li key={k.term}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${
              k.found ? "bg-success/10 border-success/30 text-success" : "bg-danger/10 border-danger/30 text-danger"
            }`}>
            {k.found ? <Check size={11} aria-hidden /> : <X size={11} aria-hidden />}
            {k.term}
            <span className="sr-only">{k.found ? " (found)" : " (missing)"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DiagnosticReport({ atsResult }: DiagnosticReportProps) {
  const [showRawText, setShowRawText] = useState(false);
  // Results saved before this report format existed don't have checks; treat as no report.
  const result = atsResult?.checks ? atsResult : null;

  return (
    <div className="premium-card p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-accent-soft border border-accent/30 flex items-center justify-center">
          <Eye size={16} className="text-accent" aria-hidden />
        </div>
        <div className="min-w-0">
          <span className="section-heading">ATS Report</span>
          <p className="text-[11px] text-muted mt-0.5 truncate">
            {result
              ? result.mode === "match"
                ? `Matched against ${result.role ? `"${result.role}"` : "your job description"}`
                : "Resume health: format checks only (add a job description to match keywords)"
              : "Score, keywords and fixes"}
          </p>
        </div>
      </div>

      {result ? (
        <div className="flex-1 space-y-5">
          {/* Score + how it was built */}
          <div className="p-4 rounded-2xl bg-surface-alt border border-line">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs text-muted">{result.mode === "match" ? "Match score" : "Health score"}</p>
                <p className={`text-4xl font-extrabold tabular-nums leading-none mt-1 ${scoreTone(result.score)}`}>
                  {result.score}<span className="text-base text-muted font-semibold">/100</span>
                </p>
              </div>
              {result.checkedAt && (
                <p className="text-[11px] text-muted text-right">Checked {new Date(result.checkedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>
              )}
            </div>
            <div className="mt-4 space-y-2.5">
              {result.breakdown.keywords !== null && (
                <div>
                  <div className="flex justify-between text-xs"><span className="text-foreground font-medium">Keyword coverage</span><span className="text-muted tabular-nums">{result.breakdown.keywords}% · 70% of score</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-surface overflow-hidden"><div className={`h-full rounded-full ${barTone(result.breakdown.keywords)}`} style={{ width: `${result.breakdown.keywords}%` }} /></div>
                </div>
              )}
              <div>
                <div className="flex justify-between text-xs"><span className="text-foreground font-medium">Format &amp; content</span><span className="text-muted tabular-nums">{result.breakdown.format}%{result.mode === "match" ? " · 30% of score" : ""}</span></div>
                <div className="mt-1 h-1.5 rounded-full bg-surface overflow-hidden"><div className={`h-full rounded-full ${barTone(result.breakdown.format)}`} style={{ width: `${result.breakdown.format}%` }} /></div>
              </div>
            </div>
          </div>

          {/* Keywords */}
          {result.keywords && (
            <div className="space-y-3">
              <KeywordGroup title="Required keywords" items={result.keywords.required} />
              <KeywordGroup title="Nice to have" items={result.keywords.preferred} />
              {result.keywordSource === "fallback" && (
                <p className="text-[11px] text-muted flex items-start gap-1.5">
                  <Info size={12} className="shrink-0 mt-0.5" aria-hidden />
                  AI keyword extraction was unavailable, so only well-known skills in the job description were matched.
                </p>
              )}
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="section-heading"><Sparkles size={11} className="text-accent" aria-hidden /> What to fix</h4>
              <ol className="space-y-2">
                {result.suggestions.map((sug, i) => (
                  <li key={i} className="flex gap-2.5 text-xs text-foreground leading-relaxed p-3 rounded-xl bg-surface-alt border border-line">
                    <span className="text-accent font-bold tabular-nums shrink-0">{i + 1}</span>
                    <span>{sug}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Format checks */}
          <div className="space-y-2">
            <h4 className="section-heading">Format checks</h4>
            <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5">
              {result.checks.map((c) => (
                <li key={c.key} className="flex items-start gap-2 text-xs">
                  <span className={`mt-0.5 shrink-0 ${c.pass ? "text-success" : c.partial ? "text-warning" : "text-danger"}`} aria-hidden>
                    {c.pass ? <Check size={13} /> : c.partial ? <Minus size={13} /> : <X size={13} />}
                  </span>
                  <span className="min-w-0">
                    <span className="text-foreground">{c.label}</span>
                    <span className="sr-only">{c.pass ? ": passed" : c.partial ? ": partly" : ": missing"}</span>
                    {c.detail && <span className="block text-[11px] text-muted">{c.detail}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Raw extracted text ("what an ATS actually sees") */}
          {result.rawExtractedText && (
            <div className="space-y-2">
              <button type="button" onClick={() => setShowRawText(!showRawText)} aria-expanded={showRawText}
                className="section-heading w-full justify-between hover:text-accent transition-colors">
                <span className="flex items-center gap-1.5"><ScanText size={11} aria-hidden /> What an ATS actually sees</span>
                <ChevronDown size={12} aria-hidden className={`transition-transform ${showRawText ? "rotate-180" : ""}`} />
              </button>
              {showRawText && (
                <>
                  <p className="text-[11px] text-muted leading-relaxed">
                    This is the plain text an ATS parser extracts from your file, with no fonts, columns or icons. If something important looks missing or garbled here, an ATS likely can&apos;t read it either.
                  </p>
                  <pre className="text-[11px] text-foreground leading-relaxed bg-surface-alt border border-line rounded-xl p-3 whitespace-pre-wrap break-words max-h-[240px] overflow-y-auto font-mono">
                    {result.rawExtractedText}
                  </pre>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-line rounded-2xl py-12 text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-surface-alt border border-line flex items-center justify-center">
            <Flame size={24} className="text-muted" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">No report yet</p>
            <p className="text-xs text-muted max-w-xs mt-1 leading-relaxed">
              Paste a job description to see which of its keywords your resume covers, or run the check without one for a quick health score.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
