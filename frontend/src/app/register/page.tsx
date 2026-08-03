"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, Sparkles, AlertCircle, User } from "lucide-react";
import { saveToken } from "@/app/api";

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/register`, {
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
            Create an Account
          </h2>
          <p className="text-sm text-slate-400 mt-1">Get started with CareerOS AI for free</p>
        </div>

        {/* Form panel */}
        <div className="glass-panel p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
              <Sparkles size={16} className="text-blue-400" />
              <span>Register</span>
            </h3>

            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Full Name
              </label>
              <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl px-4 py-3 focus-within:border-blue-500 transition-all">
                <User size={16} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-transparent text-sm w-full text-slate-100 placeholder-slate-500 focus:outline-none"
                  required
                />
              </div>
            </div>

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
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Confirm Password
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

            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 accent-blue-500 cursor-pointer"
                required
              />
              <label htmlFor="terms" className="text-xs text-slate-400 cursor-pointer">
                I agree to the <Link href="#" className="text-blue-400 hover:underline">Terms and Conditions</Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center"
            >
              {loading ? (
                <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-400 border-t border-white/5 pt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-all">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
