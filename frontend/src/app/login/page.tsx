"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, Sparkles, AlertCircle, CheckCircle2, PlayCircle } from "lucide-react";
import { API_BASE, saveToken } from "@/app/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const BACKEND_URL = API_BASE;

  const handleDemoLogin = async () => {
    setError("");
    setMessage("");
    setDemoLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/auth/demo`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Could not start the demo");
      }

      saveToken(data.token);
      router.push("/");
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message || "Something went wrong"); }
    } finally {
      setDemoLoading(false);
    }
  };

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md relative z-10">
        {/* Brand logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-accent brand-mark flex items-center justify-center font-bold text-accent-contrast text-xl mb-4">
            C
          </div>
          <h2 className="font-heading text-2xl font-bold">
            {isForgotPassword ? "Forgot Password" : "Welcome to CareerOS AI"}
          </h2>
          <p className="text-sm text-muted mt-1">
            {isForgotPassword ? "Enter your email to receive a password reset link" : "AI-Powered Career Intelligence Suite"}
          </p>
        </div>

        {!isForgotPassword && (
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={demoLoading}
            className="btn-ghost w-full py-3.5 mb-4 flex items-center justify-center gap-2 text-sm font-semibold"
          >
            {demoLoading ? (
              <span className="w-4 h-4 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
            ) : (
              <>
                <PlayCircle size={16} className="text-accent" />
                Try the Demo — no signup required
              </>
            )}
          </button>
        )}

        {/* Form panel */}
        <div className="glass-panel p-8 shadow-2xl">
          {isForgotPassword ? (
            <form onSubmit={handleForgotSubmit} className="space-y-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Sparkles size={16} className="text-accent" />
                <span>Reset your password</span>
              </h3>

              {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {message && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/30 text-success text-sm break-all">
                  <CheckCircle2 size={18} className="shrink-0" />
                  <span>
                    {message.includes("http") ? (
                      <>
                        {message.split("http")[0]}
                        <a href={`http${message.split("http")[1]}`} className="underline font-bold text-accent">
                          {`http${message.split("http")[1]}`}
                        </a>
                      </>
                    ) : (
                      message
                    )}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block">
                  Email Address
                </label>
                <div className="flex items-center gap-3 bg-surface-alt border border-line rounded-xl px-4 py-3 focus-within:border-accent transition-all">
                  <Mail size={16} className="text-muted" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                  "Send Reset Link"
                )}
              </button>

              <div className="mt-6 text-center text-sm">
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(false); setError(""); setMessage(""); }}
                  className="text-accent hover:opacity-80 font-semibold transition-all"
                >
                  Back to Login
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Sparkles size={16} className="text-accent" />
                <span>Login to your Account</span>
              </h3>

              {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block">
                  Email Address
                </label>
                <div className="flex items-center gap-3 bg-surface-alt border border-line rounded-xl px-4 py-3 focus-within:border-accent transition-all">
                  <Mail size={16} className="text-muted" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-transparent text-sm w-full text-foreground placeholder-muted focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block">
                  Password
                </label>
                <div className="flex items-center gap-3 bg-surface-alt border border-line rounded-xl px-4 py-3 focus-within:border-accent transition-all">
                  <Lock size={16} className="text-muted" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-transparent text-sm w-full text-foreground placeholder-muted focus:outline-none"
                    required
                  />
                </div>
                <div className="flex justify-end mt-1">
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(true); setError(""); setMessage(""); }}
                    className="text-xs text-accent hover:opacity-80 transition-all cursor-pointer"
                  >
                    Forgot Password?
                  </button>
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
                  "Log In"
                )}
              </button>
            </form>
          )}

          {!isForgotPassword && (
            <div className="mt-8 text-center text-sm text-muted border-t border-line pt-6">
              New to CareerOS?{" "}
              <Link href="/register" className="text-accent hover:opacity-80 font-semibold transition-all">
                Create an account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
