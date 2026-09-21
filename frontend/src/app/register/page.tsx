"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, Sparkles, AlertCircle, User } from "lucide-react";
import { saveToken, API_BASE } from "@/app/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) return;
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (!agreeTerms) {
      setError("You must agree to the Terms and Conditions");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      saveToken(data.token);
      router.push("/");
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
            Create an Account
          </h2>
          <p className="text-sm text-muted mt-1">Get started with CareerOS AI for free</p>
        </div>

        {/* Form panel */}
        <div className="glass-panel p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <Sparkles size={16} className="text-accent" />
              <span>Register</span>
            </h3>

            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider block">
                Full Name
              </label>
              <div className="flex items-center gap-3 bg-surface-alt border border-line rounded-xl px-4 py-3 focus-within:border-accent transition-all">
                <User size={16} className="text-muted" />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-transparent text-sm w-full text-foreground placeholder-muted focus:outline-none"
                  required
                />
              </div>
            </div>

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
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider block">
                Confirm Password
              </label>
              <div className="flex items-center gap-3 bg-surface-alt border border-line rounded-xl px-4 py-3 focus-within:border-accent transition-all">
                <Lock size={16} className="text-muted" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-transparent text-sm w-full text-foreground placeholder-muted focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 rounded border-line bg-surface-alt accent-[var(--accent)] cursor-pointer"
                required
              />
              <label htmlFor="terms" className="text-xs text-muted cursor-pointer">
                I agree to the <Link href="#" className="text-accent hover:underline">Terms and Conditions</Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 flex items-center justify-center"
            >
              {loading ? (
                <span className="w-5 h-5 rounded-full border-2 border-accent-contrast/30 border-t-accent-contrast animate-spin"></span>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-muted border-t border-line pt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-accent hover:opacity-80 font-semibold transition-all">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
