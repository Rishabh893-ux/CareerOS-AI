"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="relative z-10 text-center">
        <div className="w-20 h-20 rounded-3xl bg-accent brand-mark flex items-center justify-center font-black text-accent-contrast text-3xl mx-auto mb-8">
          C
        </div>

        <div className="flex items-center justify-center gap-3 mb-4">
          <AlertCircle size={28} className="text-danger" />
          <h1 className="font-heading text-5xl font-black">404</h1>
        </div>

        <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
        <p className="text-sm text-muted mb-8 max-w-sm mx-auto">
          The route you requested doesn&apos;t exist in CareerOS AI. Head back to your dashboard.
        </p>

        <Link
          href="/"
          className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm"
        >
          <Home size={16} />
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
