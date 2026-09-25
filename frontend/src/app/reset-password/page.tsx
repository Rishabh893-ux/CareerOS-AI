"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { API_BASE } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = API_BASE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Invalid or missing reset token. Please request a new link.");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setMessage(data.message || "Password updated successfully!");
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md relative z-10">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-accent brand-mark flex items-center justify-center font-bold text-accent-contrast text-xl mb-4">
          C
        </div>
        <h1 className="font-heading text-2xl font-bold">
          Set New Password
        </h1>
        <p className="text-sm text-muted mt-1 text-center">
          Enter your new password below
        </p>
      </div>

      <div className="glass-panel p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Sparkles size={16} className="text-accent" />
            <span>Create Password</span>
          </h3>

          {error && (
            <div role="alert" className="flex items-center gap-3 p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm">
              <AlertCircle size={18} className="shrink-0" aria-hidden />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div role="status" className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/30 text-success text-sm">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="reset-password" className="text-xs font-semibold text-muted uppercase tracking-wider block">
              New Password
            </label>
            <div className="flex items-center gap-3 bg-surface-alt border border-line rounded-xl px-4 py-3 focus-within:border-accent transition-all">
              <Lock size={16} className="text-muted" />
              <input
                id="reset-password"
                autoComplete="new-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent text-sm w-full text-foreground placeholder-muted focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="reset-confirm" className="text-xs font-semibold text-muted uppercase tracking-wider block">
              Confirm New Password
            </label>
            <div className="flex items-center gap-3 bg-surface-alt border border-line rounded-xl px-4 py-3 focus-within:border-accent transition-all">
              <Lock size={16} className="text-muted" />
              <input
                id="reset-confirm"
                autoComplete="new-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-transparent text-sm w-full text-foreground placeholder-muted focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 flex items-center justify-center"
          >
            {loading ? (
              <span className="w-5 h-5 rounded-full border-2 border-accent-contrast/30 border-t-accent-contrast animate-spin"></span>
            ) : (
              "Update Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Suspense fallback={<div className="z-10 relative">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
