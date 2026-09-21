"use client";

import React, { useState, useEffect } from "react";
import { X, Save, User, Link as LinkIcon, GitBranch, Briefcase, AlertCircle, Copy, CheckCircle } from "lucide-react";
import { fetchWithAuth } from "@/app/api";

interface SettingsUser {
  name: string;
  username: string;
  githubUsername: string;
  linkedinUrl: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (user: SettingsUser) => void;
}

export default function SettingsModal({ isOpen, onClose, onUpdate }: SettingsModalProps) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const loadUserData = async () => {
    try {
      const data = await fetchWithAuth("/auth/me", { method: "GET" });
      setName(data.name || "");
      setUsername(data.username || "");
      setGithubUsername(data.githubUsername || "");
      setLinkedinUrl(data.linkedinUrl || "");
    } catch (err: unknown) {
      console.error("Failed to load user data", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUserData();
    }
  }, [isOpen]);

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update settings");
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
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-surface border border-line elevated-lg rounded-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        <div className="p-5 border-b border-line flex items-center justify-between bg-surface-alt">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <User size={18} className="text-accent" /> Account Settings
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">
                Full Name
              </label>
              <div className="flex items-center gap-2 bg-surface-alt border border-line rounded-xl px-3 py-2.5 focus-within:border-accent transition-all">
                <User size={15} className="text-muted" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-transparent text-sm w-full text-foreground placeholder-muted focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">
                Portfolio Username
              </label>
              <div className="flex items-center gap-2 bg-surface-alt border border-line rounded-xl px-3 py-2.5 focus-within:border-accent transition-all">
                <LinkIcon size={15} className="text-muted" />
                <span className="text-muted text-sm select-none">
                  {typeof window !== "undefined" ? window.location.host : ""}/p/
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="your-name"
                  className="bg-transparent text-sm w-full text-foreground placeholder-muted focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-muted mt-1.5">
                Only letters, numbers, and hyphens allowed. This is required for your public portfolio link.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">
                  GitHub Username
                </label>
                <div className="flex items-center gap-2 bg-surface-alt border border-line rounded-xl px-3 py-2.5 focus-within:border-accent transition-all">
                  <GitBranch size={15} className="text-muted" />
                  <input
                    type="text"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    placeholder="octocat"
                    className="bg-transparent text-sm w-full text-foreground placeholder-muted focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">
                  LinkedIn URL
                </label>
                <div className="flex items-center gap-2 bg-surface-alt border border-line rounded-xl px-3 py-2.5 focus-within:border-accent transition-all">
                  <Briefcase size={15} className="text-muted" />
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="bg-transparent text-sm w-full text-foreground placeholder-muted focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-line">
            {username ? (
              <button
                type="button"
                onClick={copyPortfolioLink}
                className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:opacity-80 transition-colors"
              >
                {copied ? <CheckCircle size={14} className="text-success" /> : <Copy size={14} />}
                {copied ? "Copied Link!" : "Copy Portfolio Link"}
              </button>
            ) : (
              <span className="text-[10px] text-muted">Set a username to get your public link</span>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-muted hover:bg-surface-alt transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-accent hover:opacity-90 text-accent-contrast text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2"
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
