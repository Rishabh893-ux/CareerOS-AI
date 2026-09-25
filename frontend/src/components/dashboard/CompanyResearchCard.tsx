"use client";

import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/api";
import { Search, Sparkles, Compass, MessageCircleQuestion, ClipboardList, Target, Building2 } from "lucide-react";

interface ResearchBrief {
  companyName: string;
  industryContext: string;
  likelyPriorities: string[];
  talkingPoints: string[];
  smartQuestions: string[];
  verifyBeforeYouGo: string[];
}

interface CompanyResearchCardProps {
  companyName: string;
  targetRole: string;
}

export function CompanyResearchCard({ companyName, targetRole }: CompanyResearchCardProps) {
  const [localCompanyName, setLocalCompanyName] = useState(companyName);
  const [localTargetRole, setLocalTargetRole] = useState(targetRole);
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<ResearchBrief | null>(null);
  const [error, setError] = useState("");

  // Keep in sync if the user fills the form above first (only while this card is still untouched/empty)
  useEffect(() => {
    if (companyName && !localCompanyName) setLocalCompanyName(companyName);
  }, [companyName, localCompanyName]);
  useEffect(() => {
    if (targetRole && !localTargetRole) setLocalTargetRole(targetRole);
  }, [targetRole, localTargetRole]);

  const handleResearch = async () => {
    if (!localCompanyName.trim()) {
      setError("Enter a company name first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await fetchWithAuth("/outreach/research", {
        method: "POST",
        body: JSON.stringify({ companyName: localCompanyName, targetRole: localTargetRole }),
      });
      setBrief(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate research brief.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-soft border border-accent/30 flex items-center justify-center">
            <Compass size={16} className="text-accent" />
          </div>
          <div>
            <span className="section-heading">Company Research Brief</span>
            <p className="text-[11px] text-muted mt-0.5">AI-generated prep talking points</p>
          </div>
        </div>
        <span className="premium-badge">AI Powered</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={localCompanyName}
            onChange={(e) => setLocalCompanyName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleResearch(); }}
            placeholder="Company name, e.g. Stripe"
            className="w-full bg-surface-alt border border-line rounded-xl pl-8 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
          />
        </div>
        <div className="relative flex-1">
          <Target size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={localTargetRole}
            onChange={(e) => setLocalTargetRole(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleResearch(); }}
            placeholder="Target role (optional)"
            className="w-full bg-surface-alt border border-line rounded-xl pl-8 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
          />
        </div>
        <button
          onClick={handleResearch}
          disabled={loading}
          className="px-4 py-2.5 bg-transparent hover:bg-accent-soft border border-accent/45 text-accent text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
        >
          {loading ? <Sparkles size={11} className="animate-spin" /> : <Search size={11} />}
          {loading ? "Researching..." : brief ? "Refresh" : "Research"}
        </button>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-line to-transparent mb-4" />

      {error && <p className="text-xs text-danger font-bold bg-danger/10 p-3 rounded-xl border border-danger/30 mb-3">{error}</p>}

      {brief ? (
        <div className="space-y-4">
          <p className="text-xs text-foreground leading-relaxed bg-surface-alt border border-line rounded-xl p-3">{brief.industryContext}</p>

          <div className="space-y-2">
            <h4 className="section-heading"><Target size={11} className="text-accent" /> Likely Priorities</h4>
            <ul className="space-y-1.5">
              {brief.likelyPriorities.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />{p}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="section-heading"><Sparkles size={11} className="text-accent" /> Talking Points</h4>
            <ul className="space-y-1.5">
              {brief.talkingPoints.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />{p}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="section-heading"><MessageCircleQuestion size={11} className="text-accent" /> Smart Questions to Ask</h4>
            <ul className="space-y-1.5">
              {brief.smartQuestions.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />{p}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3.5 rounded-2xl bg-warning/10 border border-warning/30">
            <h4 className="section-heading text-warning mb-2"><ClipboardList size={11} /> Verify Before You Go</h4>
            <ul className="space-y-1.5">
              {brief.verifyBeforeYouGo.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-warning leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 shrink-0" />{p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border border-dashed border-line rounded-2xl py-8 text-center gap-2 min-h-[160px]">
          <Compass size={22} className="text-muted" />
          <p className="text-xs text-muted max-w-[240px]">Type a company name above and click Research for prep talking points and smart questions.</p>
        </div>
      )}
    </div>
  );
}
