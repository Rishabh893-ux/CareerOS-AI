"use client";

import React, { useState, useEffect, useRef } from "react";
import { fetchWithAuth } from "@/lib/api";
import { ResumeData, TemplateId } from "@/features/resume-builder/templates";
import { Toolbar } from "@/features/resume-builder/components/Toolbar";
import { EditorSidebar } from "@/features/resume-builder/components/EditorSidebar";
import { PreviewPane } from "@/features/resume-builder/components/PreviewPane";
import { TailorBar } from "@/features/resume-builder/components/TailorBar";
import { resumeText } from "@/features/resume-builder/resumeText";
import type { EnhancingState, KeywordCoverage, ResumeBuilderTab, TailoredResume, TailoringJob } from "@/features/resume-builder/types";
import { mergeSkills } from "@/lib/skills";

export default function ResumeBuilder() {
  const [data, setData] = useState<ResumeData>({
    name: "",
    email: "",
    phone: "",
    github: "",
    linkedin: "",
    summary: "",
    skills: [],
    education: [],
    projects: [],
    experience: [],
    certifications: []
  });

  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<TemplateId>("modern");
  const [activeTab, setActiveTab] = useState<ResumeBuilderTab>("basics");
  const [isCompact, setIsCompact] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState<EnhancingState | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Tailoring mode: opened from a tracked job as /resume/builder?job=<id>
  const [job, setJob] = useState<TailoringJob | null>(null);
  const [keywords, setKeywords] = useState<KeywordCoverage[] | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [savingTailored, setSavingTailored] = useState(false);

  const getAtsWarnings = () => {
    const warnings = [];
    if (!data.phone) warnings.push("Missing phone number.");
    if (!data.email) warnings.push("Missing email address.");
    if (data.experience.some(exp => !exp.startDate || !exp.endDate)) warnings.push("Missing dates in Experience.");
    if (data.education.some(edu => !edu.graduationYear)) warnings.push("Missing graduation year in Education.");
    return warnings;
  };

  const warnings = getAtsWarnings();

  const handleEnhanceBullet = async (index: number, type: 'experience' | 'project' | 'summary') => {
    const text = type === 'summary' ? data.summary : type === 'experience' ? data.experience[index].description : data.projects[index].description;
    if (!text) return;
    setIsEnhancing({ type, index });
    try {
      const res = await fetchWithAuth("/resume/enhance-bullet", {
        method: "POST",
        body: JSON.stringify({ text, type })
      });
      if (res && res.enhancedText) {
        if (type === 'summary') {
          updateData("summary", res.enhancedText);
        } else if (type === 'experience') {
          const newExp = [...data.experience];
          newExp[index].description = res.enhancedText;
          updateData("experience", newExp);
        } else {
          const newProj = [...data.projects];
          newProj[index].description = res.enhancedText;
          updateData("projects", newProj);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEnhancing(null);
    }
  };

  const loadData = async () => {
    try {
      const jobId = new URLSearchParams(window.location.search).get("job");
      const [profileRes, authRes, jobRes] = await Promise.all([
        fetchWithAuth("/profile", { method: "GET" }).catch(() => null),
        fetchWithAuth("/auth/me", { method: "GET" }).catch(() => null),
        jobId ? fetchWithAuth(`/jobs/${jobId}`, { method: "GET" }).catch(() => null) : null,
      ]);

      if (jobRes) {
        setJob({ id: jobRes._id, role: jobRes.role, company: jobRes.company, tailoredAt: jobRes.tailoredAt });
        // A version already tailored for this job takes priority over the profile
        const saved: TailoredResume | undefined = jobRes.tailoredResume;
        if (saved) {
          const savedData = { ...saved.data, certifications: saved.data.certifications || [] };
          setData(savedData);
          setTemplate(saved.template);
          setIsCompact(!!saved.isCompact);
          setSavedSnapshot(JSON.stringify({ template: saved.template, isCompact: !!saved.isCompact, data: savedData }));
          return;
        }
      }

      setData({
        name: authRes?.name || "",
        email: authRes?.email || "",
        phone: profileRes?.phone || "",
        location: profileRes?.location || "",
        portfolio: profileRes?.portfolioUrl || "",
        github: authRes?.githubUsername || "",
        linkedin: authRes?.linkedinUrl || "",
        summary: profileRes?.careerGoal || "",
        skills: mergeSkills(profileRes),
        education: profileRes?.education || [],
        projects: profileRes?.projects || [],
        experience: profileRes?.experience || [], // Now populated from AI parsing!
        certifications: profileRes?.certifications || []
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  // Re-check the job's skills as the draft changes (debounced; no AI call)
  useEffect(() => {
    if (!job) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetchWithAuth(`/jobs/${job.id}/keyword-check`, {
          method: "POST",
          body: JSON.stringify({ text: resumeText(data) }),
        });
        setKeywords(res.keywords);
      } catch (err) {
        console.error(err);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [job, data]);

  const tailoredSnapshot = JSON.stringify({ template, isCompact, data });
  const tailoredDirty = tailoredSnapshot !== savedSnapshot;

  const handleSaveTailored = async () => {
    if (!job) return;
    setSavingTailored(true);
    try {
      const updated = await fetchWithAuth(`/jobs/${job.id}`, {
        method: "PUT",
        body: JSON.stringify({ tailoredResume: { template, isCompact, data } }),
      });
      setSavedSnapshot(tailoredSnapshot);
      setJob((j) => (j ? { ...j, tailoredAt: updated.tailoredAt } : j));
    } catch (err) {
      console.error(err);
    } finally {
      setSavingTailored(false);
    }
  };

  const handleExport = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML;
      const originalContents = document.body.innerHTML;

      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); // Reload to restore React state cleanly after DOM manipulation
    }
  };

  const updateData = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden">

      <Toolbar
        template={template}
        onTemplateChange={setTemplate}
        isCompact={isCompact}
        onCompactChange={setIsCompact}
        onExport={handleExport}
      />

      {job && (
        <TailorBar
          job={job}
          keywords={keywords}
          saving={savingTailored}
          dirty={tailoredDirty}
          savedAt={job.tailoredAt}
          onSave={handleSaveTailored}
        />
      )}

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">

        <EditorSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          warnings={warnings}
          data={data}
          isEnhancing={isEnhancing}
          onChangeField={updateData}
          onEnhanceBullet={handleEnhanceBullet}
        />

        <PreviewPane
          template={template}
          data={data}
          isCompact={isCompact}
          printRef={printRef}
        />
      </div>

    </div>
  );
}
