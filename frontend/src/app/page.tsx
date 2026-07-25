"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  GitBranch,
  GraduationCap,
  Code,
  Map,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  BookOpen,
  Target,
  Zap,
  Star,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { fetchWithAuth } from "./api";

interface Profile {
  careerGoal: string;
  skills: string[];
  resumeExtractedSkills: string[];
  education: Array<{ institute: string; degree: string; branch: string; cgpa: number; graduationYear: number }>;
  projects: Array<{ title: string; description: string; techStack: string[]; repoUrl: string }>;
  careerScore?: { score: number; strengths: string[]; weaknesses: string[] };
  githubAnalysis?: { 
    score: number; 
    summary: string; 
    topLanguages: string[];
    repos?: Array<{
      name: string;
      description: string;
      language: string;
      stars: number;
      updatedAt: string;
      html_url: string;
    }>;
  };
  skillGap?: { targetRole: string; missingSkills: string[] };
  roadmap?: { targetRole: string; steps: Array<{ title: string; description: string; resourceHint: string }> };
}

// Animated ring component
function ScoreRing({ score, size = 140, strokeWidth = 9 }: { score: number; size?: number; strokeWidth?: number }) {
  const [animated, setAnimated] = useState(0);
  const safeScore = isNaN(score) || score == null ? 0 : score;
  const r = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (circumference * animated) / 100;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(safeScore), 100);
    return () => clearTimeout(timer);
  }, [safeScore]);

  const color = safeScore >= 75 ? "#10b981" : safeScore >= 50 ? "#3b82f6" : "#f59e0b";
  const glowColor = safeScore >= 75 ? "rgba(16,185,129,0.4)" : safeScore >= 50 ? "rgba(59,130,246,0.4)" : "rgba(245,158,11,0.4)";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", filter: `drop-shadow(0 0 10px ${glowColor})` }}>
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} fill="transparent"
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold text-white leading-none">{safeScore}</span>
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">Score</span>
      </div>
    </div>
  );
}

// Skill pill with animated entrance
function SkillPill({ skill, delay = 0 }: { skill: string; delay?: number }) {
  return (
    <span
      className="skill-tag animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      {skill}
    </span>
  );
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [githubUsername, setGithubUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshingScore, setRefreshingScore] = useState(false);
  const [refreshingGithub, setRefreshingGithub] = useState(false);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [roadmapTargetRole, setRoadmapTargetRole] = useState("");
  const [skillsExpanded, setSkillsExpanded] = useState(false);

  // Form states
  const [editMode, setEditMode] = useState(false);
  const [careerGoal, setCareerGoal] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [eduInstitute, setEduInstitute] = useState("");
  const [eduDegree, setEduDegree] = useState("");
  const [eduBranch, setEduBranch] = useState("");
  const [eduCgpa, setEduCgpa] = useState("");
  const [eduYear, setEduYear] = useState("");
  const [projectsList, setProjectsList] = useState<Profile["projects"]>([]);
  const [newProjTitle, setNewProjTitle] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjStack, setNewProjStack] = useState("");
  const [newProjRepo, setNewProjRepo] = useState("");

  const loadProfile = async () => {
    setError("");
    try {
      const data = await fetchWithAuth("/profile");
      setProfile(data);
      setCareerGoal(data.careerGoal || "");
      setRoadmapTargetRole(data.roadmap?.targetRole || data.careerGoal || "");
      setSkillsText((data.skills || []).join(", "));
      setProjectsList(data.projects || []);
      const links = await fetchWithAuth("/profile/links");
      if (links.githubUsername) setGithubUsername(links.githubUsername);
    } catch (err: any) {
      if (err.message === "Profile not found") {
        setProfile(null);
        setEditMode(true);
      } else {
        setError(err.message || "Failed to load profile.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const skills = skillsText.split(",").map(s => s.trim()).filter(Boolean);
    const education = eduInstitute ? [{
      institute: eduInstitute, degree: eduDegree, branch: eduBranch,
      cgpa: parseFloat(eduCgpa) || 0, graduationYear: parseInt(eduYear) || 2026,
    }] : (profile?.education || []);
    try {
      const updatedProfile = await fetchWithAuth("/profile", {
        method: "PUT",
        body: JSON.stringify({ careerGoal, skills, education, projects: projectsList }),
      });
      if (githubUsername) {
        await fetchWithAuth("/profile/links", {
          method: "PUT",
          body: JSON.stringify({ githubUsername }),
        });
      }
      setProfile(updatedProfile);
      setEditMode(false);
      loadProfile();
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message || "Failed to save profile."); }
      setLoading(false);
    }
  };

  const handleAddProject = () => {
    if (!newProjTitle || !newProjDesc) return;
    setProjectsList(prev => [...prev, {
      title: newProjTitle, description: newProjDesc,
      techStack: newProjStack.split(",").map(s => s.trim()).filter(Boolean),
      repoUrl: newProjRepo,
    }]);
    setNewProjTitle(""); setNewProjDesc(""); setNewProjStack(""); setNewProjRepo("");
  };

  const handleRemoveProject = (index: number) => {
    setProjectsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleRecalculateScore = async () => {
    setRefreshingScore(true);
    try {
      const data = await fetchWithAuth("/career/score?refresh=true");
      setProfile(prev => prev ? { ...prev, careerScore: data } : null);
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message || "Failed to calculate career score."); }
    } finally {
      setRefreshingScore(false);
    }
  };

  const handleSyncGithub = async () => {
    if (!githubUsername) { setError("Please link a GitHub username first."); return; }
    setRefreshingGithub(true);
    try {
      await fetchWithAuth("/profile/links", { method: "PUT", body: JSON.stringify({ githubUsername }) });
      const data = await fetchWithAuth("/github/analyze?refresh=true");
      setProfile(prev => prev ? { ...prev, githubAnalysis: data } : null);
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message || "Failed to analyze GitHub profile."); }
    } finally {
      setRefreshingGithub(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    const role = roadmapTargetRole.trim() || profile?.careerGoal;
    if (!role) { setError("Please set a Target Role for your roadmap."); return; }
    setGeneratingRoadmap(true);
    try {
      const gapData = await fetchWithAuth("/growth/skill-gap", { method: "POST", body: JSON.stringify({ targetRole: role }) });
      const roadmapData = await fetchWithAuth("/growth/roadmap", { method: "POST", body: JSON.stringify({ targetRole: role }) });
      setProfile(prev => prev ? { ...prev, skillGap: gapData, roadmap: roadmapData } : null);
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message || "Failed to generate roadmap."); }
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  // All skills combined
  const allSkills = [...new Set([...(profile?.skills || []), ...(profile?.resumeExtractedSkills || [])])];
  const displaySkills = skillsExpanded ? allSkills : allSkills.slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.8s" }} />
          </div>
          <p className="text-slate-400 text-sm font-medium">Loading your career data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/8 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto text-red-500/60 hover:text-red-400 text-xs">✕</button>
        </div>
      )}

      {editMode ? (
        /* ─── ONBOARDING / EDIT FORM ─── */
        <div className="glass-panel p-8 max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {profile ? "Edit Developer Profile" : "Setup Developer Profile"}
              </h2>
              <p className="text-xs text-slate-400">
                {profile ? "Update your details below" : "Tell us about yourself to get started"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Career Goal */}
            <div className="space-y-2">
              <label className="section-heading">
                <Target size={12} />
                Career Goal
              </label>
              <input
                type="text"
                placeholder="e.g. Full Stack Developer, AI Engineer, SDE-1"
                value={careerGoal}
                onChange={(e) => setCareerGoal(e.target.value)}
                className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500"
                required
              />
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <label className="section-heading">
                <Zap size={12} />
                Skills (comma-separated)
              </label>
              <textarea
                placeholder="React, Node.js, Python, MongoDB, Docker, TypeScript..."
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                className="w-full h-24 bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 resize-none"
                required
              />
            </div>

            {/* GitHub & Year */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="section-heading"><GitBranch size={12} /> GitHub Username</label>
                <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-4 py-3">
                  <GitBranch size={14} className="text-slate-500 shrink-0" />
                  <input
                    type="text"
                    placeholder="your_github"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    className="bg-transparent text-sm w-full text-white placeholder-slate-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="section-heading">Graduation Year</label>
                <input
                  type="number"
                  placeholder="2026"
                  value={eduYear}
                  onChange={(e) => setEduYear(e.target.value)}
                  className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500"
                />
              </div>
            </div>

            {/* Education */}
            <div className="space-y-4 border-t border-white/5 pt-6">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <GraduationCap size={15} className="text-purple-400" /> Education
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Institute Name" value={eduInstitute} onChange={(e) => setEduInstitute(e.target.value)}
                  className="bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500" />
                <input type="text" placeholder="Degree (B.Tech)" value={eduDegree} onChange={(e) => setEduDegree(e.target.value)}
                  className="bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500" />
                <input type="text" placeholder="Branch (CSE)" value={eduBranch} onChange={(e) => setEduBranch(e.target.value)}
                  className="bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 col-span-2" />
                <input type="number" step="0.01" placeholder="CGPA (8.5)" value={eduCgpa} onChange={(e) => setEduCgpa(e.target.value)}
                  className="bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 col-span-2" />
              </div>
            </div>

            {/* Projects */}
            <div className="space-y-4 border-t border-white/5 pt-6">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Code size={15} className="text-emerald-400" /> Projects
              </h3>
              {projectsList.length > 0 && (
                <div className="space-y-2">
                  {projectsList.map((proj, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-white/4 border border-white/7 rounded-xl">
                      <div>
                        <p className="font-semibold text-sm text-white">{proj.title}</p>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{proj.description}</p>
                      </div>
                      <button type="button" onClick={() => handleRemoveProject(idx)}
                        className="text-red-400/60 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="p-4 bg-white/4 border border-dashed border-white/10 rounded-xl space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Project Title" value={newProjTitle} onChange={(e) => setNewProjTitle(e.target.value)}
                    className="bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500" />
                  <input type="text" placeholder="Repo URL" value={newProjRepo} onChange={(e) => setNewProjRepo(e.target.value)}
                    className="bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500" />
                  <input type="text" placeholder="Tech stack (React, Node...)" value={newProjStack} onChange={(e) => setNewProjStack(e.target.value)}
                    className="bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 col-span-2" />
                  <textarea placeholder="Brief description..." value={newProjDesc} onChange={(e) => setNewProjDesc(e.target.value)}
                    className="bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 col-span-2 resize-none h-16" />
                </div>
                <button type="button" onClick={handleAddProject}
                  className="w-full py-2 btn-ghost text-xs font-semibold flex items-center justify-center gap-1.5">
                  <Plus size={13} /> Add Project
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 border-t border-white/5 pt-6">
              <button type="submit"
                className="flex-1 py-3 btn-primary text-sm font-semibold">
                {loading ? "Saving..." : "Save Profile"}
              </button>
              {profile && (
                <button type="button" onClick={() => setEditMode(false)}
                  className="px-6 py-3 btn-ghost text-sm">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      ) : (
        /* ─── MAIN DASHBOARD ─── */
        <div className="space-y-6">

          {/* ── HERO BAR ── */}
          <div className="hero-card p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="relative z-10">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Hello, Developer 👋</h2>
                {profile?.careerGoal && (
                  <span className="stat-badge stat-badge-purple">
                    <Target size={11} />
                    {profile.careerGoal}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 mt-1.5 max-w-lg">
                Your AI-powered career intelligence platform — score, analyse, and grow toward your goals.
              </p>
              {/* Quick stats */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {profile?.education?.[0] && (
                  <span className="stat-badge stat-badge-blue">
                    <GraduationCap size={11} /> {profile.education[0].degree} · {profile.education[0].institute}
                  </span>
                )}
                {allSkills.length > 0 && (
                  <span className="stat-badge stat-badge-green">
                    <Zap size={11} /> {allSkills.length} skills
                  </span>
                )}
                {profile?.projects && profile.projects.length > 0 && (
                  <span className="stat-badge stat-badge-amber">
                    <Code size={11} /> {profile.projects.length} project{profile.projects.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                if (profile) {
                  setEduInstitute(profile.education?.[0]?.institute || "");
                  setEduDegree(profile.education?.[0]?.degree || "");
                  setEduBranch(profile.education?.[0]?.branch || "");
                  setEduCgpa(profile.education?.[0]?.cgpa?.toString() || "");
                  setEduYear(profile.education?.[0]?.graduationYear?.toString() || "");
                }
                setEditMode(true);
              }}
              className="relative z-10 px-5 py-2.5 btn-ghost text-sm font-semibold shrink-0"
            >
              Edit Profile
            </button>
          </div>

          {/* ── SCORE + INSIGHTS ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Career Score Ring */}
            <div className="metric-card p-6 flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-2">
                <span className="section-heading"><TrendingUp size={12} className="text-blue-400" /> Career Score</span>
                <button onClick={handleRecalculateScore} disabled={refreshingScore}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all"
                  title="Recalculate">
                  <RefreshCw size={13} className={refreshingScore ? "animate-spin text-blue-400" : ""} />
                </button>
              </div>

              {profile?.careerScore ? (
                <>
                  <div className="my-3 animate-float">
                    <ScoreRing score={profile.careerScore.score} />
                  </div>
                  <div className="w-full mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Readiness</span>
                      <span className={`font-bold ${profile.careerScore.score >= 75 ? "text-emerald-400" : profile.careerScore.score >= 50 ? "text-blue-400" : "text-amber-400"}`}>
                        {profile.careerScore.score >= 75 ? "Strong" : profile.careerScore.score >= 50 ? "Growing" : "Early Stage"}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
                        style={{ width: `${profile.careerScore.score}%` }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center mb-4">
                    <TrendingUp size={28} className="text-slate-600" />
                  </div>
                  <p className="text-xs text-slate-400 mb-4">No score calculated yet</p>
                  <button onClick={handleRecalculateScore} disabled={refreshingScore}
                    className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5">
                    {refreshingScore ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    Calculate Score
                  </button>
                </div>
              )}
            </div>

            {/* AI Insights */}
            <div className="metric-card p-6 col-span-2">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Sparkles size={14} className="text-blue-400" />
                </div>
                <span className="section-heading">AI Insights & Recommendations</span>
              </div>

              {profile?.careerScore ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Strengths */}
                  <div className="space-y-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                      <CheckCircle size={13} /> Strengths
                    </p>
                    <ul className="space-y-2">
                      {profile.careerScore.strengths.map((str, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          {str}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Recommendations */}
                  <div className="space-y-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      <AlertCircle size={13} /> Recommendations
                    </p>
                    <ul className="space-y-2">
                      {profile.careerScore.weaknesses.map((weak, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                          {weak}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="h-[120px] flex flex-col items-center justify-center border border-dashed border-white/8 rounded-2xl text-center gap-2">
                  <Star size={22} className="text-slate-600" />
                  <p className="text-xs text-slate-500">Calculate your career score to unlock AI insights</p>
                </div>
              )}
            </div>
          </div>

          {/* ── SKILLS PANEL ── */}
          {allSkills.length > 0 && (
            <div className="metric-card p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="section-heading"><Zap size={12} className="text-yellow-400" /> Your Skills ({allSkills.length})</span>
                {allSkills.length > 10 && (
                  <button onClick={() => setSkillsExpanded(!skillsExpanded)}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-all">
                    {skillsExpanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show all</>}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {displaySkills.map((skill, i) => (
                  <SkillPill key={skill} skill={skill} delay={i * 30} />
                ))}
                {!skillsExpanded && allSkills.length > 10 && (
                  <span className="skill-tag opacity-50">+{allSkills.length - 10} more</span>
                )}
              </div>
            </div>
          )}

          {/* ── GITHUB + ROADMAP ── */}
          <div className="grid grid-cols-1 gap-5">

            {/* GitHub Profiler */}
            <div className="metric-card p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="section-heading"><GitBranch size={12} /> GitHub Profiler</span>
                <button onClick={handleSyncGithub} disabled={refreshingGithub}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all">
                  <RefreshCw size={13} className={refreshingGithub ? "animate-spin text-emerald-400" : ""} />
                </button>
              </div>

              {profile?.githubAnalysis ? (
                <div className="flex-1 space-y-4">
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-extrabold text-white">{profile.githubAnalysis.score}</span>
                    <div className="mb-1">
                      <span className="text-xs text-slate-400">/ 100</span>
                      <p className="text-[10px] text-emerald-400 font-semibold">Code Score</p>
                    </div>
                  </div>
                  {/* Code score bar */}
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000"
                      style={{ width: `${profile.githubAnalysis.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{profile.githubAnalysis.summary}</p>
                  <div className="space-y-1.5">
                    <p className="section-heading">Top Languages</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.githubAnalysis.topLanguages.map(l => (
                        <span key={l} className="skill-tag text-emerald-300 border-emerald-500/20 bg-emerald-500/8">{l}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/8 rounded-2xl py-8 text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <GitBranch size={24} className="text-slate-500" />
                  </div>
                  <p className="text-xs text-slate-400">Connect your GitHub to analyse your code presence</p>
                  <button onClick={handleSyncGithub} disabled={refreshingGithub}
                    className="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5">
                    {refreshingGithub ? <RefreshCw size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    Sync GitHub Stats
                  </button>
                </div>
              )}
            </div>

            {/* GitHub Repositories (New Section) */}
            {profile?.githubAnalysis?.repos && profile.githubAnalysis.repos.length > 0 && (
              <div className="metric-card p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="section-heading"><Code size={12} /> GitHub Repositories ({profile.githubAnalysis.repos.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {profile.githubAnalysis.repos.map((repo, idx) => (
                    <div key={idx} className="p-4 bg-white/3 border border-white/7 rounded-2xl hover:border-white/12 transition-all flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-white break-words overflow-hidden">{repo.name}</h4>
                        {repo.html_url && (
                          <a href={repo.html_url} target="_blank" rel="noopener noreferrer"
                            className="text-slate-500 hover:text-emerald-400 transition-colors shrink-0">
                            <GitBranch size={13} />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2 flex-1">{repo.description || "No description provided."}</p>
                      <div className="flex items-center justify-between mt-3">
                        {repo.language ? (
                          <span className="skill-tag text-[10px] text-emerald-300 border-emerald-500/20 bg-emerald-500/8 px-1.5 py-0.5 rounded-md">{repo.language}</span>
                        ) : <span />}
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                          <Star size={10} className="text-amber-400" /> {repo.stars}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Growth Roadmap */}
            <div className="metric-card p-6 flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Map size={14} className="text-purple-400" />
                  </div>
                  <span className="section-heading">Growth Roadmap</span>
                </div>
                {profile?.roadmap && (
                  <div className="flex items-center gap-2">
                    <textarea 
                      rows={2}
                      placeholder="Target Role..."
                      value={roadmapTargetRole}
                      onChange={(e) => setRoadmapTargetRole(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 w-[450px] resize-none"
                    />
                    <button onClick={handleGenerateRoadmap} disabled={generatingRoadmap}
                      className="px-3 py-1.5 bg-purple-500/8 hover:bg-purple-500/15 border border-purple-500/25 text-purple-400 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5">
                      {generatingRoadmap ? <RefreshCw size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                      Regenerate
                    </button>
                  </div>
                )}
              </div>

              {profile?.roadmap ? (
                <div className="flex-1 space-y-4 overflow-y-auto max-h-[600px] pr-1 custom-scrollbar">
                  {/* Skill gaps */}
                  {profile.skillGap && profile.skillGap.missingSkills.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/12">
                      <p className="section-heading text-amber-400 mb-2">
                        <AlertCircle size={11} /> Skill Gaps to Close
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.skillGap.missingSkills.map(s => (
                          <span key={s} className="skill-tag text-amber-300 border-amber-500/25 bg-amber-500/8">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Steps */}
                  <div className="relative border-l border-white/8 ml-3 pl-6 space-y-5">
                    {profile.roadmap.steps.map((step, idx) => (
                      <div key={idx} className="relative group">
                        <div className="timeline-dot" />
                        <div className="group-hover:translate-x-1 transition-transform">
                          <h4 className="text-xs font-bold text-white">
                            <span className="text-purple-400 mr-1.5">Step {idx + 1}:</span>{step.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{step.description}</p>
                          <div className="mt-2 flex items-center gap-1.5 text-[9px] text-purple-400/70 font-semibold uppercase tracking-wider">
                            <BookOpen size={9} />
                            <span>{step.resourceHint}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/8 rounded-2xl py-10 text-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/8 border border-purple-500/20 flex items-center justify-center animate-float-slow">
                    <Map size={28} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">Generate your AI Roadmap</p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mb-3">
                      Get a personalised learning path designed to bridge skill gaps for your target role.
                    </p>
                    <textarea 
                      rows={2}
                      placeholder="e.g. Senior Frontend Engineer"
                      value={roadmapTargetRole}
                      onChange={(e) => setRoadmapTargetRole(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 w-full max-w-md text-center mx-auto block resize-none"
                    />
                  </div>
                  <button onClick={handleGenerateRoadmap} disabled={generatingRoadmap || !roadmapTargetRole.trim()}
                    className="px-6 py-3 btn-primary text-xs font-bold disabled:opacity-50">
                    {generatingRoadmap ? (
                      <span className="flex items-center gap-2"><RefreshCw size={12} className="animate-spin" /> Analysing Skills...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Sparkles size={12} /> Generate AI Roadmap</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── PROJECTS PANEL ── */}
          {profile?.projects && profile.projects.length > 0 && (
            <div className="metric-card p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Code size={14} className="text-emerald-400" />
                </div>
                <span className="section-heading">Projects ({profile.projects.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {profile.projects.map((proj, idx) => (
                  <div key={idx} className="p-4 bg-white/3 border border-white/7 rounded-2xl hover:border-white/12 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-white">{proj.title}</h4>
                      {proj.repoUrl && (
                        <a href={proj.repoUrl} target="_blank" rel="noopener noreferrer"
                          className="text-slate-500 hover:text-blue-400 transition-colors shrink-0">
                          <GitBranch size={13} />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">{proj.description}</p>
                    {proj.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {proj.techStack.map(t => (
                          <span key={t} className="skill-tag">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
