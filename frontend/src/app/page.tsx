"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
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
import { mergeSkills } from "@/lib/skills";
import { linkProjectsToRepos } from "@/lib/projectRepos";

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userName, setUserName] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      const goal = data.careerGoal?.trim() || "";
      setCareerGoal(goal);
      setRoadmapTargetRole(data.roadmap?.targetRole || goal);
      // Edit the merged list so resume-extracted skills are visible and editable too.
      setSkillsText(mergeSkills(data).join(", "));
      setProjectsList(data.projects || []);
      fetchWithAuth("/auth/me").then(me => {
        setUserName(me.name || "");
        if (me.githubUsername) setGithubUsername(me.githubUsername);
      }).catch(() => {});
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
    setSaving(true);
    const skills = [...new Set(skillsText.split(",").map(s => s.trim()).filter(Boolean))];
    // Drop resume-extracted skills the person removed, so what they typed is what is saved.
    const resumeExtractedSkills = (profile?.resumeExtractedSkills || []).filter(s => skills.includes(s));
    // The form edits the first education entry only; keep any others untouched.
    const otherEducation = (profile?.education || []).slice(1);
    const cgpa = parseFloat(eduCgpa);
    const graduationYear = parseInt(eduYear, 10);
    const education = eduInstitute.trim() ? [{
      institute: eduInstitute.trim(), degree: eduDegree.trim(), branch: eduBranch.trim(),
      cgpa: Number.isFinite(cgpa) ? cgpa : undefined,
      graduationYear: Number.isFinite(graduationYear) ? graduationYear : undefined,
    }, ...otherEducation] : (profile?.education || []);
    try {
      const updatedProfile = await fetchWithAuth("/profile", {
        method: "PUT",
        body: JSON.stringify({ careerGoal: careerGoal.trim(), skills, resumeExtractedSkills, education, projects: projectsList }),
      });
      if (githubUsername) {
        await fetchWithAuth("/auth/settings", {
          method: "PUT",
          body: JSON.stringify({ githubUsername }),
        });
      }
      setProfile(updatedProfile);
      setEditMode(false);
      loadProfile();
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message || "Failed to save profile."); }
    } finally {
      setSaving(false);
    }
  };

  const handleAddProject = () => {
    if (!newProjTitle.trim() || !newProjDesc.trim()) return;
    setProjectsList(prev => [...prev, {
      title: newProjTitle.trim(), description: newProjDesc.trim(),
      techStack: newProjStack.split(",").map(s => s.trim()).filter(Boolean),
      repoUrl: newProjRepo.trim(),
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
      await fetchWithAuth("/auth/settings", { method: "PUT", body: JSON.stringify({ githubUsername }) });
      const data = await fetchWithAuth("/github/analyze?refresh=true");
      setProfile(prev => prev ? { ...prev, githubAnalysis: data } : null);
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message || "Failed to analyze GitHub profile."); }
    } finally {
      setRefreshingGithub(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    const role = roadmapTargetRole.trim() || profile?.careerGoal?.trim();
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
      // Start from the saved values so edits abandoned with Cancel don't reappear.
      setCareerGoal(profile.careerGoal || "");
      setSkillsText(mergeSkills(profile).join(", "));
      setProjectsList(profile.projects || []);
      setNewProjTitle(""); setNewProjDesc(""); setNewProjStack(""); setNewProjRepo("");
      setEduInstitute(profile.education?.[0]?.institute || "");
      setEduDegree(profile.education?.[0]?.degree || "");
      setEduBranch(profile.education?.[0]?.branch || "");
      setEduCgpa(profile.education?.[0]?.cgpa?.toString() || "");
      setEduYear(profile.education?.[0]?.graduationYear?.toString() || "");
    }
    setEditMode(true);
  };

  // All skills combined
  const allSkills = mergeSkills(profile);
  const { projects: linkedProjects, otherRepos } = linkProjectsToRepos(profile?.projects, profile?.githubAnalysis?.repos, githubUsername);
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
        <div role="alert" className="flex items-center gap-3 p-4 rounded-2xl bg-danger/10 border border-danger/30 text-danger text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error" className="ml-auto p-1 rounded-lg text-danger hover:bg-danger/10 text-xs">✕</button>
        </div>
      )}

      {editMode ? (
        /* ─── ONBOARDING / EDIT FORM ─── */
        <ProfileEditForm
          profile={profile}
          loading={saving}
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
          <HeroCard profile={profile} userName={userName} allSkills={allSkills} githubLinked={!!githubUsername} onEditProfile={handleEditProfile} />

          {/* ── SCORE + INSIGHTS ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

          {/* ── WORK: curated projects, then GitHub evidence that isn't already a project ── */}
          <ProjectsPanel projects={linkedProjects} />

          <GithubProfilerCard
            githubAnalysis={profile?.githubAnalysis}
            refreshingGithub={refreshingGithub}
            onSyncGithub={handleSyncGithub}
          />

          {otherRepos.length > 0 && <GithubRepositoriesCard repos={otherRepos} />}

          {/* ── GROWTH ── */}
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
      )}
    </div>
  );
}
