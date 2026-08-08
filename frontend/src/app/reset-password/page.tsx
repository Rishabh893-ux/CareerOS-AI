"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { API_BASE } from "@/app/api";

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
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-xl shadow-blue-500/20 text-xl mb-4">
          C
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Set New Password
        </h2>
        <p className="text-sm text-slate-400 mt-1 text-center">
          Enter your new password below
        </p>
      </div>

      <div className="glass-panel p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <Sparkles size={16} className="text-blue-400" />
            <span>Create Password</span>
          </h3>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {message && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              New Password
            </label>
            <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl px-4 py-3 focus-within:border-blue-500 transition-all">
              <Lock size={16} className="text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent text-sm w-full text-slate-100 placeholder-slate-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Confirm New Password
            </label>
            <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl px-4 py-3 focus-within:border-blue-500 transition-all">
              <Lock size={16} className="text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-transparent text-sm w-full text-slate-100 placeholder-slate-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center"
          >
            {loading ? (
              <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
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
    <div className="min-h-screen bg-[#08090c] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[140px]" />
      <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[140px]" />
      
      <Suspense fallback={<div className="text-white z-10 relative">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
