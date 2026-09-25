"use client";

import React, { useState, useEffect, useRef } from "react";
import { fetchWithAuth } from "@/lib/api";
import { ResumeData, TemplateId } from "@/components/resume/templates";
import { Toolbar } from "@/components/resume-builder/Toolbar";
import { EditorSidebar } from "@/components/resume-builder/EditorSidebar";
import { PreviewPane } from "@/components/resume-builder/PreviewPane";
import type { EnhancingState, ResumeBuilderTab } from "@/types/resume-builder";
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
      const [profileRes, authRes] = await Promise.all([
        fetchWithAuth("/profile", { method: "GET" }).catch(() => null),
        fetchWithAuth("/auth/me", { method: "GET" }).catch(() => null)
      ]);

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
    loadData();
  }, []);

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
