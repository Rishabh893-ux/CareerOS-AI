"use client";

import React, { useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import { Copy, Mail, Send, Check, Sparkles, Building2, User, Briefcase } from "lucide-react";
import { CompanyResearchCard } from "@/components/dashboard/CompanyResearchCard";

export default function OutreachPage() {
  const [recipientName, setRecipientName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [platform, setPlatform] = useState<"LinkedIn" | "Email">("Email");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setCopied(false);

    try {
      const res = await fetchWithAuth("/outreach/generate", {
        method: "POST",
        body: JSON.stringify({
          recipientName,
          companyName,
          targetRole,
          platform,
          context
        })
      });
      if (res && res.message) {
        setResult(res.message);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate message.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">

        {/* Header */}
        <div className="glass-panel p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-soft border border-accent text-accent text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles size={14} /> AI Outreach
            </div>
            <h1 className="font-heading text-2xl font-black tracking-tight">Networking Assistant</h1>
            <p className="text-sm text-muted mt-2 max-w-lg leading-relaxed">
              Generate highly personalized, non-spammy outreach messages based on your real resume data. Use this for cold emails.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Form */}
          <div className="glass-panel p-6">
            <form onSubmit={handleGenerate} className="space-y-5">

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="outreach-recipient-name" className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Recipient Name (Optional)</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input id="outreach-recipient-name" type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="e.g. Sarah Connor" className="w-full bg-surface-alt border border-line rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent" />
                  </div>
                </div>
                <div>
                  <label htmlFor="outreach-company-name" className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Company Name *</label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input id="outreach-company-name" required type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Google" className="w-full bg-surface-alt border border-line rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="outreach-target-role" className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Target Role *</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input id="outreach-target-role" required type="text" value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. Senior Frontend Engineer" className="w-full bg-surface-alt border border-line rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Platform</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPlatform("Email")}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      platform === "Email" ? "bg-accent-soft border-accent text-accent" : "bg-surface-alt border-line text-muted hover:text-foreground"
                    }`}
                  >
                    <Mail size={14} /> Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlatform("LinkedIn")}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      platform === "LinkedIn" ? "bg-accent-soft border-accent text-accent" : "bg-surface-alt border-line text-muted hover:text-foreground"
                    }`}
                  >
                    <Briefcase size={14} /> LinkedIn
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="outreach-additional-context" className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Additional Context (Optional)</label>
                <textarea id="outreach-additional-context" rows={3} value={context} onChange={e => setContext(e.target.value)} placeholder="e.g. I saw their post about launching a new product..." className="w-full bg-surface-alt border border-line rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent resize-none" />
              </div>

              {error && <p className="text-xs text-danger font-bold bg-danger/10 p-3 rounded-xl border border-danger/30">{error}</p>}

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                {loading ? <Sparkles size={16} className="animate-spin" /> : <Send size={16} />}
                {loading ? "Drafting..." : "Generate Message"}
              </button>
            </form>
          </div>

          {/* Result */}
          <div className="glass-panel flex flex-col overflow-hidden relative min-h-[400px]">
            <div className="p-4 border-b border-line bg-surface-alt flex items-center justify-between shrink-0">
              <h3 className="section-heading">
                <Mail size={14} className="text-accent" /> Drafted Message
              </h3>
              {result && (
                <button onClick={handleCopy} className="text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-accent-soft text-foreground transition-colors">
                  {copied ? <Check size={14} className="text-success"/> : <Copy size={14}/>}
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
            <div className="flex-1 p-6 relative">
              {result ? (
                <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-medium">
                  {result}
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-surface-alt flex items-center justify-center mb-4 border border-line">
                    <Sparkles size={24} className="text-muted" aria-hidden />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Your draft will appear here</p>
                  <p className="text-sm text-muted max-w-[240px] mt-1">Fill in the company and role, then select Generate Message.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Company Research Brief */}
        <CompanyResearchCard companyName={companyName} targetRole={targetRole} />

      </div>
  );
}
