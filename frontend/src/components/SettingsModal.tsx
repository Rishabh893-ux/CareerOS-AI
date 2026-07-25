"use client";

import React, { useState, useEffect } from "react";
import { X, Save, User, Link as LinkIcon, GitBranch, Briefcase, AlertCircle, Copy, CheckCircle } from "lucide-react";
import { fetchWithAuth } from "@/app/api";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (user: any) => void;
}

export default function SettingsModal({ isOpen, onClose, onUpdate }: SettingsModalProps) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUserData();
    }
  }, [isOpen]);

  const loadUserData = async () => {
    try {
      const data = await fetchWithAuth("/auth/me", { method: "GET" });
      setName(data.name || "");
      setUsername(data.username || "");
      setGithubUsername(data.githubUsername || "");
      setLinkedinUrl(data.linkedinUrl || "");
    } catch (err: any) {
      console.error("Failed to load user data", err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await fetchWithAuth("/auth/settings", {
        method: "PUT",
        body: JSON.stringify({ name, username, githubUsername, linkedinUrl }),
      });
      onUpdate(data);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  const copyPortfolioLink = () => {
    if (!username) return;
    const url = `${window.location.origin}/p/${username}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-[rgba(15,20,35,0.95)] border border-white/10 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <User size={18} className="text-blue-400" /> Account Settings
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Full Name
              </label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-blue-500 transition-all">
                <User size={15} className="text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-transparent text-sm w-full text-slate-100 placeholder-slate-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Portfolio Username
              </label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-purple-500 transition-all">
                <LinkIcon size={15} className="text-slate-400" />
                <span className="text-slate-500 text-sm select-none">careeros.com/p/</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="your-name"
                  className="bg-transparent text-sm w-full text-slate-100 placeholder-slate-500 focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">
                Only letters, numbers, and hyphens allowed. This is required for your public portfolio link.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  GitHub Username
                </label>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-blue-500 transition-all">
                  <GitBranch size={15} className="text-slate-400" />
                  <input
                    type="text"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    placeholder="octocat"
                    className="bg-transparent text-sm w-full text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  LinkedIn URL
                </label>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-blue-500 transition-all">
                  <Briefcase size={15} className="text-slate-400" />
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="bg-transparent text-sm w-full text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-white/5">
            {username ? (
              <button
                type="button"
                onClick={copyPortfolioLink}
                className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
              >
                {copied ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? "Copied Link!" : "Copy Portfolio Link"}
              </button>
            ) : (
              <span className="text-[10px] text-slate-500">Set a username to get your public link</span>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:shadow-blue-500/20 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? "Saving..." : <><Save size={14} /> Save Changes</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
