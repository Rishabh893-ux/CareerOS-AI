"use client";

import React, { useState, useEffect, useRef } from "react";
import { Download, ChevronLeft, Save, LayoutTemplate, X, Sparkles } from "lucide-react";
import Link from "next/link";
import { fetchWithAuth } from "@/app/api";
import { ResumeData, TemplateId, ClassicAtsTemplate, ModernTemplate } from "@/components/resume/templates";

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
  const [activeTab, setActiveTab] = useState<"basics" | "summary" | "experience" | "certifications" | "projects" | "education" | "skills">("basics");
  const [isCompact, setIsCompact] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState<{type: 'experience' | 'project' | 'summary', index: number} | null>(null);
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

  useEffect(() => {
    loadData();
  }, []);

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
        skills: [...new Set([...(profileRes?.skills || []), ...(profileRes?.resumeExtractedSkills || [])])] as string[],
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

  const updateData = (key: keyof ResumeData, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="min-h-screen bg-[#07080b] flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#07080b] flex flex-col font-sans overflow-hidden">
      
      {/* Top Navbar */}
      <header className="h-16 shrink-0 border-b border-white/10 bg-[rgba(10,14,25,0.8)] flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4">
          <Link href="/resume" className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <div>
            <h1 className="font-bold text-white text-sm">Resume Builder</h1>
            <p className="text-[10px] text-slate-400">Live Preview Mode</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1 rounded-lg">
            <button
              onClick={() => setTemplate("classic")}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${template === "classic" ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"}`}
            >
              Classic ATS
            </button>
            <button
              onClick={() => setTemplate("modern")}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${template === "modern" ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"}`}
            >
              Modern Pro
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 cursor-pointer hover:text-white transition-colors mr-2">
            <input type="checkbox" checked={isCompact} onChange={e => setIsCompact(e.target.checked)} className="accent-blue-500 rounded" />
            Compact Mode
          </label>
          
          <button onClick={handleExport} className="btn-primary px-4 py-2 text-xs font-bold flex items-center gap-2">
            <Download size={14} /> Export PDF
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT: Editor */}
        <div className="w-[400px] border-r border-white/10 bg-[rgba(10,14,25,0.5)] flex flex-col z-10 shrink-0">
          
          {/* Tabs */}
          <div className="flex overflow-x-auto p-2 gap-1 border-b border-white/5 scrollbar-hide">
            {(["basics", "summary", "experience", "certifications", "education", "projects", "skills"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize whitespace-nowrap transition-all ${activeTab === tab ? "bg-blue-600/20 text-blue-400" : "text-slate-400 hover:bg-white/5"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ATS Warnings */}
          {warnings.length > 0 && (
            <div className="m-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <h3 className="text-red-400 text-xs font-bold mb-2 flex items-center gap-2">
                ⚠️ ATS Warnings ({warnings.length})
              </h3>
              <ul className="list-disc pl-4 text-[10px] text-red-300 space-y-1">
                {warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          {/* Form Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
            
            {activeTab === "basics" && (
              <div className="space-y-4 animate-fade-in-up">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Full Name</label>
                  <input type="text" value={data.name || ""} onChange={e => updateData("name", e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Email</label>
                  <input type="email" value={data.email || ""} onChange={e => updateData("email", e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Phone</label>
                  <input type="text" value={data.phone || ""} onChange={e => updateData("phone", e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">LinkedIn URL</label>
                  <input type="text" value={data.linkedin || ""} onChange={e => updateData("linkedin", e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">GitHub URL</label>
                  <input type="text" value={data.github || ""} onChange={e => updateData("github", e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
            )}

            {activeTab === "summary" && (
              <div className="space-y-4 animate-fade-in-up">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Professional Summary</label>
                    <button onClick={() => handleEnhanceBullet(0, 'summary')} disabled={isEnhancing?.type === 'summary'} className="text-[10px] flex items-center gap-1 font-bold text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50">
                      <Sparkles size={12} /> {isEnhancing?.type === 'summary' ? 'Enhancing...' : 'Enhance with AI'}
                    </button>
                  </div>
                  <textarea rows={6} value={data.summary || ""} onChange={e => updateData("summary", e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none leading-relaxed" />
                </div>
              </div>
            )}

            {activeTab === "experience" && (
              <div className="space-y-6 animate-fade-in-up">
                {data.experience.map((exp, index) => (
                  <div key={index} className="p-4 bg-white/5 border border-white/10 rounded-xl relative group">
                    <button onClick={() => updateData("experience", data.experience.filter((_, i) => i !== index))} className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={14} />
                    </button>
                    <div className="space-y-3">
                      <input type="text" placeholder="Job Title" value={exp.role || ""} onChange={e => { const newExp = [...data.experience]; newExp[index].role = e.target.value; updateData("experience", newExp); }} className="w-full bg-transparent border-b border-white/10 px-1 py-1 text-sm text-white focus:outline-none focus:border-blue-500 font-bold" />
                      <input type="text" placeholder="Company Name" value={exp.company || ""} onChange={e => { const newExp = [...data.experience]; newExp[index].company = e.target.value; updateData("experience", newExp); }} className="w-full bg-transparent border-b border-white/10 px-1 py-1 text-sm text-white focus:outline-none focus:border-blue-500" />
                      <div className="flex gap-2">
                        <input type="text" placeholder="Start Date" value={exp.startDate || ""} onChange={e => { const newExp = [...data.experience]; newExp[index].startDate = e.target.value; updateData("experience", newExp); }} className="w-1/2 bg-transparent border-b border-white/10 px-1 py-1 text-sm text-white focus:outline-none focus:border-blue-500" />
                        <input type="text" placeholder="End Date" value={exp.endDate || ""} onChange={e => { const newExp = [...data.experience]; newExp[index].endDate = e.target.value; updateData("experience", newExp); }} className="w-1/2 bg-transparent border-b border-white/10 px-1 py-1 text-sm text-white focus:outline-none focus:border-blue-500" />
                      </div>
                      <textarea placeholder="Description (bullet points separated by new lines)" rows={4} value={exp.description || ""} onChange={e => { const newExp = [...data.experience]; newExp[index].description = e.target.value; updateData("experience", newExp); }} className="w-full bg-black/20 border border-white/10 rounded-lg px-2 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 resize-none leading-relaxed" />
                      <div className="flex justify-end">
                        <button onClick={() => handleEnhanceBullet(index, 'experience')} disabled={isEnhancing?.type === 'experience' && isEnhancing.index === index} className="text-[10px] flex items-center gap-1 font-bold text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50">
                          <Sparkles size={12} /> {isEnhancing?.type === 'experience' && isEnhancing.index === index ? 'Enhancing...' : 'Enhance with AI'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => updateData("experience", [...data.experience, { company: "", role: "", startDate: "", endDate: "", description: "" }])} className="w-full py-2 border border-dashed border-blue-500/50 rounded-xl text-blue-400 text-xs font-bold hover:bg-blue-500/10 transition-colors">
                  + Add Experience
                </button>
              </div>
            )}

            {/* Similarly, we'd add full inputs for Education, Projects, Skills here... For brevity I'll add simple versions */}
            
            {activeTab === "skills" && (
              <div className="space-y-4 animate-fade-in-up">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Skills (comma separated)</label>
                  <textarea rows={4} value={data.skills?.join(", ") || ""} onChange={e => updateData("skills", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none leading-relaxed" />
                </div>
              </div>
            )}

            {activeTab === "projects" && (
              <div className="space-y-6 animate-fade-in-up">
                {data.projects.map((proj, index) => (
                  <div key={index} className="p-4 bg-white/5 border border-white/10 rounded-xl relative group">
                    <button onClick={() => updateData("projects", data.projects.filter((_, i) => i !== index))} className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={14} />
                    </button>
                    <div className="space-y-3">
                      <input type="text" placeholder="Project Title" value={proj.title || ""} onChange={e => { const newP = [...data.projects]; newP[index].title = e.target.value; updateData("projects", newP); }} className="w-full bg-transparent border-b border-white/10 px-1 py-1 text-sm text-white focus:outline-none focus:border-blue-500 font-bold" />
                      <input type="text" placeholder="Repository URL" value={proj.repoUrl || ""} onChange={e => { const newP = [...data.projects]; newP[index].repoUrl = e.target.value; updateData("projects", newP); }} className="w-full bg-transparent border-b border-white/10 px-1 py-1 text-sm text-white focus:outline-none focus:border-blue-500" />
                      <input type="text" placeholder="Tech Stack (comma separated)" value={proj.techStack?.join(", ") || ""} onChange={e => { const newP = [...data.projects]; newP[index].techStack = e.target.value.split(",").map(s=>s.trim()); updateData("projects", newP); }} className="w-full bg-transparent border-b border-white/10 px-1 py-1 text-sm text-white focus:outline-none focus:border-blue-500" />
                      <textarea placeholder="Description (bullet points)" rows={3} value={proj.description || ""} onChange={e => { const newP = [...data.projects]; newP[index].description = e.target.value; updateData("projects", newP); }} className="w-full bg-black/20 border border-white/10 rounded-lg px-2 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 resize-none leading-relaxed" />
                      <div className="flex justify-end">
                        <button onClick={() => handleEnhanceBullet(index, 'project')} disabled={isEnhancing?.type === 'project' && isEnhancing.index === index} className="text-[10px] flex items-center gap-1 font-bold text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50">
                          <Sparkles size={12} /> {isEnhancing?.type === 'project' && isEnhancing.index === index ? 'Enhancing...' : 'Enhance with AI'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => updateData("projects", [...data.projects, { title: "", repoUrl: "", techStack: [], description: "" }])} className="w-full py-2 border border-dashed border-purple-500/50 rounded-xl text-purple-400 text-xs font-bold hover:bg-purple-500/10 transition-colors">
                  + Add Project
                </button>
              </div>
            )}

            {activeTab === "certifications" && (
              <div className="space-y-6 animate-fade-in-up">
                {data.certifications && data.certifications.map((cert, index) => (
                  <div key={index} className="p-4 bg-white/5 border border-white/10 rounded-xl relative group">
                    <button onClick={() => updateData("certifications", data.certifications!.filter((_, i) => i !== index))} className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={14} />
                    </button>
                    <div className="space-y-3">
                      <input type="text" placeholder="Certification Name" value={cert.name || ""} onChange={e => { const newCerts = [...data.certifications!]; newCerts[index].name = e.target.value; updateData("certifications", newCerts); }} className="w-full bg-transparent border-b border-white/10 px-1 py-1 text-sm text-white focus:outline-none focus:border-blue-500 font-bold" />
                      <input type="text" placeholder="Issuer" value={cert.issuer || ""} onChange={e => { const newCerts = [...data.certifications!]; newCerts[index].issuer = e.target.value; updateData("certifications", newCerts); }} className="w-full bg-transparent border-b border-white/10 px-1 py-1 text-sm text-white focus:outline-none focus:border-blue-500" />
                      <input type="text" placeholder="Date" value={cert.date || ""} onChange={e => { const newCerts = [...data.certifications!]; newCerts[index].date = e.target.value; updateData("certifications", newCerts); }} className="w-full bg-transparent border-b border-white/10 px-1 py-1 text-sm text-white focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                ))}
                <button onClick={() => updateData("certifications", [...(data.certifications || []), { name: "", issuer: "", date: "", link: "" }])} className="w-full py-2 border border-dashed border-white/20 text-white/50 hover:text-white hover:border-white/40 rounded-xl text-xs font-bold transition-colors">
                  + Add Certification
                </button>
              </div>
            )}

            {activeTab === "education" && (
              <div className="space-y-6 animate-fade-in-up">
                {data.education.map((edu, index) => (
                  <div key={index} className="p-4 bg-white/5 border border-white/10 rounded-xl relative group">
                    <button onClick={() => updateData("education", data.education.filter((_, i) => i !== index))} className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={14} />
                    </button>
                    <div className="space-y-3">
                      <input type="text" placeholder="Institute" value={edu.institute || ""} onChange={e => { const newE = [...data.education]; newE[index].institute = e.target.value; updateData("education", newE); }} className="w-full bg-transparent border-b border-white/10 px-1 py-1 text-sm text-white focus:outline-none focus:border-blue-500 font-bold" />
                      <div className="flex gap-2">
                        <input type="text" placeholder="Degree" value={edu.degree || ""} onChange={e => { const newE = [...data.education]; newE[index].degree = e.target.value; updateData("education", newE); }} className="w-1/2 bg-transparent border-b border-white/10 px-1 py-1 text-sm text-white focus:outline-none focus:border-blue-500" />
                        <input type="text" placeholder="Branch" value={edu.branch || ""} onChange={e => { const newE = [...data.education]; newE[index].branch = e.target.value; updateData("education", newE); }} className="w-1/2 bg-transparent border-b border-white/10 px-1 py-1 text-sm text-white focus:outline-none focus:border-blue-500" />
                      </div>
                      <div className="flex gap-2">
                        <input type="number" placeholder="Grad Year" value={edu.graduationYear || ""} onChange={e => { const newE = [...data.education]; newE[index].graduationYear = Number(e.target.value); updateData("education", newE); }} className="w-1/2 bg-transparent border-b border-white/10 px-1 py-1 text-sm text-white focus:outline-none focus:border-blue-500" />
                        <input type="number" placeholder="CGPA" value={edu.cgpa || ""} onChange={e => { const newE = [...data.education]; newE[index].cgpa = Number(e.target.value); updateData("education", newE); }} className="w-1/2 bg-transparent border-b border-white/10 px-1 py-1 text-sm text-white focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => updateData("education", [...data.education, { institute: "", degree: "", branch: "", cgpa: 0, graduationYear: new Date().getFullYear() }])} className="w-full py-2 border border-dashed border-emerald-500/50 rounded-xl text-emerald-400 text-xs font-bold hover:bg-emerald-500/10 transition-colors">
                  + Add Education
                </button>
              </div>
            )}

          </div>
        </div>

        {/* RIGHT: Live Preview Pane */}
        <div className="flex-1 bg-slate-900 overflow-y-auto p-10 flex justify-center custom-scrollbar shadow-inner relative">
          
          <div ref={printRef} className="bg-white shadow-2xl transition-all duration-300" style={{ transformOrigin: "top center", transform: "scale(0.85)" }}>
            {template === "classic" && <ClassicAtsTemplate data={data} isCompact={isCompact} />}
            {template === "modern" && <ModernTemplate data={data} isCompact={isCompact} />}
          </div>

        </div>
      </div>

    </div>
  );
}
