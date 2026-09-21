"use client";

import React, { useEffect, useState } from "react";
import { User, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { API_BASE } from "@/app/api";
import { PortfolioData } from "@/types/portfolio";
import Hero from "@/components/portfolio/Hero";
import CareerScoreSection from "@/components/portfolio/CareerScoreSection";
import GithubProfilerSection from "@/components/portfolio/GithubProfilerSection";
import ExperienceSection from "@/components/portfolio/ExperienceSection";
import SkillsSection from "@/components/portfolio/SkillsSection";
import ProjectsSection from "@/components/portfolio/ProjectsSection";
import CertificationsSection from "@/components/portfolio/CertificationsSection";
import EducationSection from "@/components/portfolio/EducationSection";

interface PortfolioViewProps {
  username: string;
}

export default function PortfolioView({ username }: PortfolioViewProps) {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username) return;

    fetch(`${API_BASE}/profile/public/${username}`)
      .then(res => {
        if (!res.ok) throw new Error("Portfolio not found");
        return res.json();
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex gap-2 items-center">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-3 h-3 rounded-full bg-accent animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground">
        <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center mb-4">
          <User size={32} className="text-danger" />
        </div>
        <h1 className="font-heading text-2xl font-bold mb-2">Portfolio Not Found</h1>
        <p className="text-muted mb-6 text-sm">{error}</p>
        <Link href="/" className="px-5 py-2.5 rounded-xl bg-accent-soft text-accent font-semibold hover:opacity-80 transition-all flex items-center gap-2 text-sm">
          <LayoutDashboard size={16} /> Go to CareerOS
        </Link>
      </div>
    );
  }

  const { user, profile } = data;

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden font-sans">
      {/* Powered by CareerOS Header */}
      <div className="absolute top-6 right-4 sm:right-20 z-50">
        <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-alt border border-line hover:border-accent transition-all text-[10px] text-muted uppercase tracking-wider font-semibold shadow-xl whitespace-nowrap">
          Powered by <span className="text-accent font-bold">CareerOS AI</span>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-20 relative z-10">

        {/* HERO SECTION */}
        <Hero
          name={user.name}
          email={user.email}
          githubUsername={user.githubUsername}
          linkedinUrl={user.linkedinUrl}
          careerGoal={profile.careerGoal}
          portfolioUrl={profile.portfolioUrl}
          location={profile.location}
          resumeUrl={profile.resumeUrl}
        />

        <div className="space-y-8">
          <CareerScoreSection careerScore={profile.careerScore} />
          <ExperienceSection experience={profile.experience} />
          <ProjectsSection projects={profile.projects} />
          <SkillsSection skills={profile.skills} />
          <GithubProfilerSection githubAnalysis={profile.githubAnalysis} githubUsername={user.githubUsername} />
          <EducationSection education={profile.education} />
          <CertificationsSection certifications={profile.certifications} />
        </div>
      </div>
    </div>
  );
}
