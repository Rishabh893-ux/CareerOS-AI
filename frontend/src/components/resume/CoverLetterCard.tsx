"use client";

import React, { useState } from "react";
import { fetchWithAuth } from "@/app/api";
import { Copy, Check, Sparkles, Building2, Briefcase, FileText } from "lucide-react";

type Tone = "warm" | "formal" | "confident";

export function CoverLetterCard() {
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState<Tone>("warm");
  const [loading, setLoading] = useState(false);
  const [letter, setLetter] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setCopied(false);
    try {
      const data = await fetchWithAuth("/resume/cover-letter", {
        method: "POST",
        body: JSON.stringify({ companyName, roleTitle, jobDescription, tone }),
      });
      setLetter(data.letter || "");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate cover letter.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tones: { key: Tone; label: string }[] = [
    { key: "warm", label: "Warm" },
    { key: "formal", label: "Formal" },
    { key: "confident", label: "Confident" },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-5">
      {/* Form */}
      <div className="metric-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-accent-soft border border-accent/20 flex items-center justify-center">
            <FileText size={14} className="text-accent" />
          </div>
          <span className="section-heading">Cover Letter Generator</span>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Company *</label>
              <div className="relative">
                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input required type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Google" className="w-full bg-surface-alt border border-line rounded-xl pl-8 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Role *</label>
              <div className="relative">
                <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input required type="text" value={roleTitle} onChange={e => setRoleTitle(e.target.value)} placeholder="e.g. Frontend Engineer" className="w-full bg-surface-alt border border-line rounded-xl pl-8 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Job Description (Optional)</label>
            <textarea rows={4} value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="Paste the job posting for a more tailored letter..." className="w-full bg-surface-alt border border-line rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent resize-none" />
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Tone</label>
            <div className="grid grid-cols-3 gap-2">
              {tones.map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTone(t.key)}
                  className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                    tone === t.key ? "bg-accent-soft border-accent text-accent" : "bg-surface-alt border-line text-muted hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-danger font-bold bg-danger/10 p-3 rounded-xl border border-danger/30">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            <Sparkles size={16} className={loading ? "animate-spin" : ""} />
            {loading ? "Writing..." : "Generate Cover Letter"}
          </button>
        </form>
      </div>

      {/* Result */}
      <div className="metric-card flex flex-col overflow-hidden relative min-h-[400px] p-0">
        <div className="p-4 border-b border-line bg-surface-alt flex items-center justify-between shrink-0">
          <h3 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
            <FileText size={14} className="text-accent" /> Draft
          </h3>
          {letter && (
            <button onClick={handleCopy} className="text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-accent-soft text-foreground transition-colors">
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          )}
        </div>
        <div className="flex-1 p-6 relative overflow-y-auto max-h-[500px]">
          {letter ? (
            <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-medium">{letter}</div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 opacity-50">
              <div className="w-16 h-16 rounded-full bg-surface-alt flex items-center justify-center mb-4 border border-line">
                <FileText size={24} className="text-muted" />
              </div>
              <p className="text-sm font-semibold text-muted max-w-[220px]">Fill in the company and role to draft a personalized cover letter from your profile.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
