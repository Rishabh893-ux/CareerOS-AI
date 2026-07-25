"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#08090c] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background radial highlights */}
      <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[140px]" />
      <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[140px]" />

      <div className="relative z-10 text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-black text-white shadow-2xl shadow-blue-500/20 text-3xl mx-auto mb-8">
          C
        </div>

        <div className="flex items-center justify-center gap-3 mb-4">
          <AlertCircle size={28} className="text-red-400" />
          <h1 className="text-5xl font-black text-white">404</h1>
        </div>

        <h2 className="text-xl font-semibold text-slate-200 mb-2">Page Not Found</h2>
        <p className="text-sm text-slate-400 mb-8 max-w-sm mx-auto">
          The route you requested doesn&apos;t exist in CareerOS AI. Head back to your dashboard.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all"
        >
          <Home size={16} />
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
