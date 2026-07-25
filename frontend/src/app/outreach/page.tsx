"use client";

import React, { useState } from "react";
import { fetchWithAuth } from "@/app/api";
import { Copy, Mail, Send, Check, Sparkles, Building2, User, Briefcase } from "lucide-react";

export default function OutreachPage() {
  const [recipientName, setRecipientName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [platform, setPlatform] = useState<"LinkedIn" | "Email">("LinkedIn");
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
    } catch (err: any) {
      setError(err.message || "Failed to generate message.");
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
    <div className="max-w-4xl mx-auto space-y-6 p-6">
        
        {/* Header */}
        <div className="bg-[rgba(15,20,35,0.6)] backdrop-blur-xl border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles size={14} /> AI Outreach
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Networking Assistant</h1>
            <p className="text-sm text-slate-400 mt-2 max-w-lg leading-relaxed">
              Generate highly personalized, non-spammy outreach messages based on your real resume data. Use this for cold emails or LinkedIn connection requests.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-[rgba(15,20,35,0.6)] backdrop-blur-xl border border-white/5 rounded-3xl p-6">
            <form onSubmit={handleGenerate} className="space-y-5">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Recipient Name (Optional)</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="e.g. Sarah Connor" className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Company Name *</label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input required type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Google" className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Target Role *</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input required type="text" value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. Senior Frontend Engineer" className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Platform</label>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                  <button type="button" onClick={() => setPlatform("LinkedIn")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${platform === 'LinkedIn' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                    LinkedIn
                  </button>
                  <button type="button" onClick={() => setPlatform("Email")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${platform === 'Email' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                    Cold Email
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Additional Context (Optional)</label>
                <textarea rows={3} value={context} onChange={e => setContext(e.target.value)} placeholder="e.g. I saw their post about launching a new product..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" />
              </div>

              {error && <p className="text-xs text-red-400 font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}

              <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-opacity disabled:opacity-50">
                {loading ? <Sparkles size={16} className="animate-spin" /> : <Send size={16} />}
                {loading ? "Drafting..." : "Generate Message"}
              </button>
            </form>
          </div>

          {/* Result */}
          <div className="bg-[rgba(15,20,35,0.6)] backdrop-blur-xl border border-white/5 rounded-3xl flex flex-col overflow-hidden relative min-h-[400px]">
            <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between shrink-0">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Mail size={14} className="text-blue-400" /> Drafted Message
              </h3>
              {result && (
                <button onClick={handleCopy} className="text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                  {copied ? <Check size={14} className="text-emerald-400"/> : <Copy size={14}/>} 
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
            <div className="flex-1 p-6 relative">
              {result ? (
                <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
                  {result}
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 opacity-50">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                    <Sparkles size={24} className="text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-400 max-w-[200px]">Fill out the details on the left and click Generate to see the magic!</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
  );
}
