"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Upload,
  RefreshCw,
  Sparkles,
  CheckCircle,
  Download,
  AlertCircle,
  ShieldCheck,
  Flame,
  ImageIcon,
  X,
  Eye,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { fetchWithAuth } from "@/app/api";

interface Profile {
  careerGoal: string;
  skills: string[];
  resumeExtractedSkills: string[];
  resumeUrl?: string;
  resumeLastParsedAt?: string;
  education: Array<{ institute: string; degree: string; branch: string; cgpa: number; graduationYear: number }>;
  projects: Array<{ title: string; description: string; techStack: string[]; repoUrl: string }>;
}

interface AtsResult {
  score: number;
  missingKeywords: string[];
  formattingFeedback: string;
  suggestions: string[];
}

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
const ACCEPTED_EXTENSIONS = ".pdf,.jpg,.jpeg,.png,.webp";

export default function ResumePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  
  // States for main resume parser
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for ATS Checker
  const [checkingAts, setCheckingAts] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [atsResult, setAtsResult] = useState<AtsResult | null>(null);
  const [atsDragOver, setAtsDragOver] = useState(false);
  const [atsSelectedFile, setAtsSelectedFile] = useState<File | null>(null);
  const atsFileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadProfile = async () => {
    try {
      const data = await fetchWithAuth("/profile");
      setProfile(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to load profile.");
      }
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Only PDF, JPG, PNG, or WEBP files are accepted.";
    }
    if (file.size > 8 * 1024 * 1024) {
      return "File must be under 8MB.";
    }
    return null;
  };

  // --- Main Resume Upload Handlers ---
  const handleFileSelect = (file: File) => {
    const err = validateFile(file);
    if (err) { setError(err); return; }
    setError("");
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError("");
    setSuccessMsg("");
    setAtsResult(null);

    const isImage = selectedFile.type.startsWith("image/");
    setUploadProgress(isImage ? "📷 Reading image via AI Vision..." : "📄 Parsing PDF...");

    const formData = new FormData();
    formData.append("resume", selectedFile);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch("https://careeros-backend-k7r1.onrender.com/api/resume/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setProfile(data.profile);
      setSuccessMsg(`✅ Resume parsed! ${data.extractedSkills?.length || 0} skills extracted.`);
      clearFile();
      loadProfile();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to parse resume.");
      }
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  const handleRemoveResume = async () => {
    if (!confirm("Are you sure you want to remove your saved resume?")) return;
    setRemoving(true);
    setError("");
    setSuccessMsg("");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch("https://careeros-backend-k7r1.onrender.com/api/resume", {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove resume");
      
      setProfile(data.profile);
      setSuccessMsg("✅ Saved resume removed successfully.");
      clearFile();
      loadProfile();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to remove resume.");
      }
    } finally {
      setRemoving(false);
    }
  };

  // --- ATS Checker File Handlers ---
  const handleAtsFileSelect = (file: File) => {
    const err = validateFile(file);
    if (err) { setError(err); return; }
    setError("");
    setAtsSelectedFile(file);
  };

  const clearAtsFile = () => {
    setAtsSelectedFile(null);
    if (atsFileInputRef.current) atsFileInputRef.current.value = "";
  };

  const handleCheckAts = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckingAts(true);
    setError("");
    setAtsResult(null);

    const formData = new FormData();
    formData.append("jobDescription", jobDescription);
    if (atsSelectedFile) {
      formData.append("resume", atsSelectedFile);
    }

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch("https://careeros-backend-k7r1.onrender.com/api/resume/ats-check", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ATS Check failed");

      setAtsResult(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to complete ATS review.");
      }
    } finally {
      setCheckingAts(false);
    }
  };

  // --- ATS Friendly PDF Export ---
  const handleExportResume = () => {
    if (!profile) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const skills = [...new Set([...(profile.skills || []), ...(profile.resumeExtractedSkills || [])])];
    const edu = profile.education?.[0] || { institute: "University Name", degree: "Bachelor of Technology", branch: "Computer Science", cgpa: 8.0, graduationYear: 2026 };

    // STRICT ATS-FRIENDLY HTML
    // No grid, no flex, standard fonts, clear headings, single column
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>${profile.careerGoal || "Developer"} Resume</title>
  <style>
    body { 
      font-family: Arial, Helvetica, sans-serif; 
      color: #000000; 
      line-height: 1.5; 
      padding: 30px; 
      max-width: 800px; 
      margin: 0 auto; 
      background: white;
    }
    h1 { 
      font-size: 24px; 
      margin-bottom: 5px; 
      text-transform: uppercase; 
      text-align: center; 
    }
    h2 {
      font-size: 16px;
      text-transform: uppercase;
      border-bottom: 1px solid #000;
      padding-bottom: 3px;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    h3 {
      font-size: 14px;
      margin: 0;
      margin-bottom: 2px;
    }
    .subtitle { 
      font-size: 14px; 
      text-align: center; 
      margin-bottom: 20px; 
    }
    .item-header {
      font-weight: bold;
      margin-bottom: 2px;
    }
    .item-meta {
      font-style: italic;
      font-size: 14px;
      margin-bottom: 5px;
    }
    .item-desc {
      font-size: 14px;
      margin-bottom: 15px;
    }
    p { margin-top: 0; }
    ul { margin-top: 5px; padding-left: 20px; }
    li { margin-bottom: 5px; }
  </style>
</head>
<body>
  <h1>JOHN DOE</h1>
  <div class="subtitle">Target Role: ${profile.careerGoal || "Software Engineer"} | Email: contact@example.com | Phone: (123) 456-7890</div>
  
  <h2>EDUCATION</h2>
  <div class="item-header">${edu.institute}</div>
  <div class="item-meta">${edu.degree} in ${edu.branch} | Graduated: ${edu.graduationYear}</div>
  <div class="item-desc">CGPA: ${edu.cgpa} / 10.00</div>

  <h2>TECHNICAL SKILLS</h2>
  <div class="item-desc">
    <strong>Languages & Tools:</strong> ${skills.join(", ")}
  </div>

  <h2>PROJECTS</h2>
  ${profile.projects?.length > 0 ? profile.projects.map(p => `
    <div>
      <h3>${p.title} ${p.repoUrl ? `| ${p.repoUrl}` : ""}</h3>
      <div class="item-meta">Technologies used: ${p.techStack.join(", ")}</div>
      <div class="item-desc">
        <ul>
          <li>${p.description}</li>
        </ul>
      </div>
    </div>
  `).join("") : "<p>No projects listed.</p>"}

  <script>
    window.onload = function() { window.print(); setTimeout(() => window.close(), 500); };
  </script>
</body>
</html>`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const scoreColor = atsResult
    ? atsResult.score >= 70 ? "text-emerald-400" : atsResult.score >= 45 ? "text-blue-400" : "text-red-400"
    : "text-slate-400";

  const allExtractedSkills = [...new Set([...(profile?.skills || []), ...(profile?.resumeExtractedSkills || [])])];

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/8 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle size={15} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")}><X size={14} /></button>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/8 border border-emerald-500/20 text-emerald-400 text-sm">
          <CheckCircle size={15} className="shrink-0" />
          <span className="flex-1">{successMsg}</span>
          <button onClick={() => setSuccessMsg("")}><X size={14} /></button>
        </div>
      )}

      {/* ── TOP 3 CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Resume Upload Card (Saves to Profile) */}
        <div className="metric-card p-6 flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <FileText size={14} className="text-blue-400" />
              </div>
              <span className="section-heading">Resume Parser</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Upload to save to your profile. AI extracts your skills automatically.
            </p>
          </div>

          {/* Status */}
          {profile?.resumeLastParsedAt && (
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl flex items-start justify-between">
              <div>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">✅ Profile Resume Active</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Parsed: {new Date(profile.resumeLastParsedAt).toLocaleDateString()} · {profile.resumeExtractedSkills?.length || 0} skills extracted
                </p>
              </div>
              <button 
                onClick={handleRemoveResume} 
                disabled={removing}
                className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
              >
                {removing ? "Removing..." : "Remove"}
              </button>
            </div>
          )}

          {/* Drop Zone for Profile */}
          <div
            onDrop={(e) => {
              e.preventDefault(); setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFileSelect(file);
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => !selectedFile && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all
              ${dragOver
                ? "border-blue-500 bg-blue-500/8 scale-[1.01]"
                : selectedFile
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-white/10 hover:border-blue-500/40 hover:bg-blue-500/4"
              }`}
          >
            {selectedFile ? (
              <div className="space-y-2">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full max-h-24 object-contain rounded-lg mx-auto" />
                ) : (
                  <div className="w-10 h-10 mx-auto rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <FileText size={20} className="text-blue-400" />
                  </div>
                )}
                <p className="text-xs font-semibold text-white truncate px-2">{selectedFile.name}</p>
                <p className="text-[10px] text-slate-500">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); clearFile(); }}
                  className="text-[10px] text-red-400/70 hover:text-red-400 flex items-center gap-1 mx-auto"
                >
                  <X size={10} /> Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-slate-500">
                  <FileText size={18} />
                  <span className="text-slate-400 font-medium">or</span>
                  <ImageIcon size={18} />
                </div>
                <p className="text-xs font-semibold text-slate-300">Drop your resume here</p>
                <p className="text-[10px] text-slate-500">PDF · JPG · PNG · WEBP</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept={ACCEPTED_EXTENSIONS} onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} className="hidden" />
          </div>

          {/* Upload Button */}
          <button onClick={handleUpload} disabled={!selectedFile || uploading} className="w-full py-2.5 btn-primary text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
            {uploading ? <><RefreshCw size={13} className="animate-spin" /><span>{uploadProgress || "Uploading..."}</span></> : <><Upload size={13} /><span>Parse to Profile</span></>}
          </button>
        </div>

        {/* Resume Builder Card */}
        <div className="metric-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <ShieldCheck size={14} className="text-emerald-400" />
              </div>
              <span className="section-heading">Resume Builder</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Create a perfectly formatted, ATS-compliant PDF resume from your profile. Live preview included.
            </p>

            <div className="space-y-1.5 bg-white/4 border border-white/6 p-3.5 rounded-xl mt-4 text-xs text-slate-400">
              <p className="flex items-center gap-1.5"><CheckCircle size={11} className="text-emerald-400" /> Multiple ATS Templates</p>
              <p className="flex items-center gap-1.5"><CheckCircle size={11} className="text-emerald-400" /> Live Interactive Preview</p>
              <p className="flex items-center gap-1.5"><CheckCircle size={11} className="text-emerald-400" /> Standard section headings</p>
            </div>

            {/* Skills count */}
            {allExtractedSkills.length > 0 && (
              <div className="mt-4 p-3 bg-white/4 border border-white/6 rounded-xl">
                <p className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider font-semibold">Includes {allExtractedSkills.length} skills</p>
                <div className="flex flex-wrap gap-1">
                  {allExtractedSkills.slice(0, 6).map(s => (
                    <span key={s} className="skill-tag">{s}</span>
                  ))}
                  {allExtractedSkills.length > 6 && (
                    <span className="skill-tag opacity-50">+{allExtractedSkills.length - 6}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <Link href="/resume/builder" className="w-full py-2.5 btn-primary text-xs font-bold flex items-center justify-center gap-2 mt-4 transition-all hover:scale-[1.02]">
            <Sparkles size={13} /> Open Builder
          </Link>
        </div>

        {/* ATS Score Summary Card */}
        <div className="metric-card p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Flame size={14} className="text-amber-400" />
            </div>
            <span className="section-heading">ATS Score</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Overall compatibility rating.
          </p>

          {/* Big score display */}
          <div className="flex-1 flex flex-col items-center justify-center py-6">
            <div className={`text-6xl font-black ${scoreColor} leading-none`}>
              {atsResult ? `${atsResult.score}` : "--"}
            </div>
            <p className="text-xs text-slate-500 mt-1">/ 100 match score</p>
            {atsResult && (
              <div className="w-full mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    atsResult.score >= 70 ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                    : atsResult.score >= 45 ? "bg-gradient-to-r from-blue-500 to-purple-500"
                    : "bg-gradient-to-r from-red-500 to-orange-500"
                  }`}
                  style={{ width: `${atsResult.score}%` }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-auto">
            <div className="p-3 bg-white/4 border border-white/6 rounded-xl text-center">
              <p className="text-lg font-bold text-white">{atsResult ? atsResult.missingKeywords.length : "--"}</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">Missing Keywords</p>
            </div>
            <div className="p-3 bg-white/4 border border-white/6 rounded-xl text-center">
              <p className="text-lg font-bold text-white">{atsResult ? atsResult.suggestions.length : "--"}</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">Suggestions</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── ATS CHECKER + RESULTS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Job Description & Custom File Input */}
        <div className="metric-card p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Sparkles size={14} className="text-purple-400" />
            </div>
            <span className="section-heading">Run ATS Check</span>
          </div>

          <form onSubmit={handleCheckAts} className="flex flex-col gap-4 flex-1">
            {/* Optional targeted resume upload */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">1. Resume (Optional)</label>
              <div
                onDrop={(e) => {
                  e.preventDefault(); setAtsDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleAtsFileSelect(file);
                }}
                onDragOver={(e) => { e.preventDefault(); setAtsDragOver(true); }}
                onDragLeave={() => setAtsDragOver(false)}
                onClick={() => !atsSelectedFile && atsFileInputRef.current?.click()}
                className={`relative border border-dashed rounded-xl p-3 text-center cursor-pointer transition-all
                  ${atsDragOver ? "border-purple-500 bg-purple-500/8" : atsSelectedFile ? "border-emerald-500/40 bg-emerald-500/5" : "border-white/10 hover:border-purple-500/40 hover:bg-purple-500/4"}
                `}
              >
                {atsSelectedFile ? (
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-emerald-400" />
                      <p className="text-xs font-semibold text-white truncate max-w-[150px]">{atsSelectedFile.name}</p>
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); clearAtsFile(); }} className="text-[10px] text-red-400/70 hover:text-red-400 flex items-center gap-1">
                      <X size={12} /> Remove
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    {profile?.resumeLastParsedAt 
                      ? "Drop a specific PDF/Img here, or leave blank to use your profile resume" 
                      : "Drop a PDF/Img here to check against the JD"}
                  </p>
                )}
                <input ref={atsFileInputRef} type="file" accept={ACCEPTED_EXTENSIONS} onChange={(e) => e.target.files?.[0] && handleAtsFileSelect(e.target.files[0])} className="hidden" />
              </div>
            </div>

            {/* Job Description Textarea */}
            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">2. Job Description</label>
              <textarea
                placeholder="Paste the full job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full flex-1 bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 resize-none leading-relaxed min-h-[160px]"
              />
            </div>

            <button
              type="submit"
              disabled={checkingAts || (!profile?.resumeLastParsedAt && !atsSelectedFile)}
              className="w-full py-3 btn-primary text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {checkingAts ? (
                <><RefreshCw size={13} className="animate-spin" /><span>Scanning ATS Filters...</span></>
              ) : (
                <><Zap size={13} /><span>Run ATS Check</span></>
              )}
            </button>
          </form>
        </div>

        {/* ATS Results Panel */}
        <div className="metric-card p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Eye size={14} className="text-blue-400" />
            </div>
            <span className="section-heading">Diagnostic Report</span>
          </div>

          {atsResult ? (
            <div className="flex-1 space-y-4 overflow-y-auto max-h-[340px] pr-1">
              {/* Score banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-white">Match Score</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">ATS compatibility rating</p>
                </div>
                <div className={`text-3xl font-black ${scoreColor}`}>{atsResult.score}%</div>
              </div>

              {/* Missing keywords */}
              <div className="space-y-2">
                <h4 className="section-heading"><AlertCircle size={11} className="text-red-400" /> Missing Keywords</h4>
                {atsResult.missingKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {atsResult.missingKeywords.map(key => (
                      <span key={key} className="skill-tag text-red-300 border-red-500/25 bg-red-500/8">{key}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle size={12} /> All keywords covered!</p>
                )}
              </div>

              {/* Formatting */}
              <div className="space-y-2">
                <h4 className="section-heading">Formatting Feedback</h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-white/4 border border-white/6 rounded-xl p-3">{atsResult.formattingFeedback}</p>
              </div>

              {/* Suggestions */}
              <div className="space-y-2">
                <h4 className="section-heading"><Sparkles size={11} className="text-purple-400" /> Suggestions</h4>
                <ul className="space-y-2">
                  {atsResult.suggestions.map((sug, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                      {sug}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/8 rounded-2xl py-14 text-center gap-3 min-h-[340px]">
              <div className="w-14 h-14 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center">
                <Flame size={24} className="text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-400">No report yet</p>
                <p className="text-xs text-slate-600 max-w-xs mt-1 leading-relaxed">
                  Paste a job description and click Run ATS Check to see your compatibility score, missing keywords, and tailored suggestions.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
