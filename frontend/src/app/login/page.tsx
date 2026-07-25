"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { saveToken } from "@/app/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const BACKEND_URL = "https://careeros-backend-k7r1.onrender.com/api";

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      saveToken(data.token);
      router.push("/");
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message || "Something went wrong"); }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset link");
      }

      setMessage(data.message || "Password reset link sent to your email!");
      // Don't clear email so they can still see what they typed
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090c] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background radial highlights */}
      <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[140px]" />
      <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[140px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-xl shadow-blue-500/20 text-xl mb-4">
            C
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            {isForgotPassword ? "Forgot Password" : "Welcome to CareerOS AI"}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isForgotPassword ? "Enter your email to receive a password reset link" : "AI-Powered Career Intelligence Suite"}
          </p>
        </div>

        {/* Form panel */}
        <div className="glass-panel p-8 shadow-2xl">
          {isForgotPassword ? (
            <form onSubmit={handleForgotSubmit} className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Sparkles size={16} className="text-blue-400" />
                <span>Reset your password</span>
              </h3>

              {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              {message && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm break-all">
                  <CheckCircle2 size={18} className="shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Email Address
                </label>
                <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl px-4 py-3 focus-within:border-blue-500 transition-all">
                  <Mail size={16} className="text-slate-400" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                  "Send Reset Link"
                )}
              </button>

              <div className="mt-6 text-center text-sm">
                <button 
                  type="button" 
                  onClick={() => { setIsForgotPassword(false); setError(""); setMessage(""); }}
                  className="text-blue-400 hover:text-blue-300 font-semibold transition-all"
                >
                  Back to Login
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Sparkles size={16} className="text-blue-400" />
                <span>Login to your Account</span>
              </h3>

              {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Email Address
                </label>
                <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl px-4 py-3 focus-within:border-blue-500 transition-all">
                  <Mail size={16} className="text-slate-400" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-transparent text-sm w-full text-slate-100 placeholder-slate-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Password
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
                <div className="flex justify-end mt-1">
                  <button 
                    type="button"
                    onClick={() => { setIsForgotPassword(true); setError(""); setMessage(""); }}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-all cursor-pointer"
                  >
                    Forgot Password?
                  </button>
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
                  "Log In"
                )}
              </button>
            </form>
          )}

          {!isForgotPassword && (
            <div className="mt-8 text-center text-sm text-slate-400 border-t border-white/5 pt-6">
              New to CareerOS?{" "}
              <Link href="/register" className="text-blue-400 hover:text-blue-300 font-semibold transition-all">
                Create an account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
