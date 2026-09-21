"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { fetchWithAuth } from "./api";
import type { Profile } from "@/types/dashboard";
import { HeroCard } from "@/components/dashboard/HeroCard";
import { CareerScoreCard } from "@/components/dashboard/CareerScoreCard";
import { AiInsightsCard } from "@/components/dashboard/AiInsightsCard";
import { SkillsPanel } from "@/components/dashboard/SkillsPanel";
import { GithubProfilerCard } from "@/components/dashboard/GithubProfilerCard";
import { GithubRepositoriesCard } from "@/components/dashboard/GithubRepositoriesCard";
import { GrowthRoadmapCard } from "@/components/dashboard/GrowthRoadmapCard";
import { ProjectsPanel } from "@/components/dashboard/ProjectsPanel";
import { ProfileEditForm } from "@/components/dashboard/ProfileEditForm";

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userName, setUserName] = useState("");
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
      fetchWithAuth("/auth/me").then(me => setUserName(me.name || "")).catch(() => {});
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message === "Profile not found") {
        setProfile(null);
        setEditMode(true);
      } else {
        setError(message || "Failed to load profile.");
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
      const [roadmapData, careerPathData] = await Promise.all([
        fetchWithAuth("/growth/roadmap", { method: "POST", body: JSON.stringify({ targetRole: role }) }),
        fetchWithAuth("/growth/career-path", { method: "POST", body: JSON.stringify({ targetRole: role }) }),
      ]);
      setProfile(prev => prev ? { ...prev, skillGap: gapData, roadmap: roadmapData, careerPath: careerPathData } : null);
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message || "Failed to generate roadmap."); }
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  const handleEditProfile = () => {
    if (profile) {
      setEduInstitute(profile.education?.[0]?.institute || "");
      setEduDegree(profile.education?.[0]?.degree || "");
      setEduBranch(profile.education?.[0]?.branch || "");
      setEduCgpa(profile.education?.[0]?.cgpa?.toString() || "");
      setEduYear(profile.education?.[0]?.graduationYear?.toString() || "");
    }
    setEditMode(true);
  };

  // All skills combined
  const allSkills = [...new Set([...(profile?.skills || []), ...(profile?.resumeExtractedSkills || [])])];
  const displaySkills = skillsExpanded ? allSkills : allSkills.slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-accent animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.8s" }} />
          </div>
          <p className="text-muted text-sm font-medium">Loading your career data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-danger/10 border border-danger/30 text-danger text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto text-danger/60 hover:text-danger text-xs">✕</button>
        </div>
      )}

      {editMode ? (
        /* ─── ONBOARDING / EDIT FORM ─── */
        <ProfileEditForm
          profile={profile}
          loading={loading}
          careerGoal={careerGoal}
          setCareerGoal={setCareerGoal}
          skillsText={skillsText}
          setSkillsText={setSkillsText}
          githubUsername={githubUsername}
          setGithubUsername={setGithubUsername}
          eduInstitute={eduInstitute}
          setEduInstitute={setEduInstitute}
          eduDegree={eduDegree}
          setEduDegree={setEduDegree}
          eduBranch={eduBranch}
          setEduBranch={setEduBranch}
          eduCgpa={eduCgpa}
          setEduCgpa={setEduCgpa}
          eduYear={eduYear}
          setEduYear={setEduYear}
          projectsList={projectsList}
          newProjTitle={newProjTitle}
          setNewProjTitle={setNewProjTitle}
          newProjDesc={newProjDesc}
          setNewProjDesc={setNewProjDesc}
          newProjStack={newProjStack}
          setNewProjStack={setNewProjStack}
          newProjRepo={newProjRepo}
          setNewProjRepo={setNewProjRepo}
          onSubmit={handleSaveProfile}
          onAddProject={handleAddProject}
          onRemoveProject={handleRemoveProject}
          onCancel={() => setEditMode(false)}
        />
      ) : (
        /* ─── MAIN DASHBOARD ─── */
        <div className="space-y-6">

          {/* ── HERO BAR ── */}
          <HeroCard profile={profile} userName={userName} allSkills={allSkills} onEditProfile={handleEditProfile} />

          {/* ── SCORE + INSIGHTS ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <CareerScoreCard
              careerScore={profile?.careerScore}
              refreshingScore={refreshingScore}
              onRecalculate={handleRecalculateScore}
            />
            <AiInsightsCard careerScore={profile?.careerScore} />
          </div>

          {/* ── SKILLS PANEL ── */}
          <SkillsPanel
            allSkills={allSkills}
            displaySkills={displaySkills}
            skillsExpanded={skillsExpanded}
            onToggleExpanded={() => setSkillsExpanded(!skillsExpanded)}
          />

          {/* ── GITHUB + ROADMAP ── */}
          <div className="grid grid-cols-1 gap-5">

            {/* GitHub Profiler */}
            <GithubProfilerCard
              githubAnalysis={profile?.githubAnalysis}
              refreshingGithub={refreshingGithub}
              onSyncGithub={handleSyncGithub}
            />

            {/* GitHub Repositories (New Section) */}
            {profile?.githubAnalysis?.repos && profile.githubAnalysis.repos.length > 0 && (
              <GithubRepositoriesCard repos={profile.githubAnalysis.repos} />
            )}

            {/* Growth Roadmap */}
            <GrowthRoadmapCard
              roadmap={profile?.roadmap}
              skillGap={profile?.skillGap}
              careerPath={profile?.careerPath}
              roadmapTargetRole={roadmapTargetRole}
              generatingRoadmap={generatingRoadmap}
              onRoadmapTargetRoleChange={setRoadmapTargetRole}
              onGenerateRoadmap={handleGenerateRoadmap}
            />
          </div>

          {/* ── PROJECTS PANEL ── */}
          <ProjectsPanel projects={profile?.projects} />

        </div>
      )}
    </div>
  );
}
