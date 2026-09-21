"use client";

import React, { useState, useEffect, useRef } from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import { fetchWithAuth, API_BASE } from "@/app/api";
import { Profile, AtsResult, ACCEPTED_TYPES } from "@/types/resume";
import { ResumeParserCard } from "@/components/resume/ResumeParserCard";
import { ResumeBuilderCard } from "@/components/resume/ResumeBuilderCard";
import { AtsScoreCard } from "@/components/resume/AtsScoreCard";
import { AtsCheckerForm } from "@/components/resume/AtsCheckerForm";
import { DiagnosticReport } from "@/components/resume/DiagnosticReport";
import { CoverLetterCard } from "@/components/resume/CoverLetterCard";

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
      const res = await fetch(`${API_BASE}/resume/upload`, {
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
      const res = await fetch(`${API_BASE}/resume`, {
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
      const res = await fetch(`${API_BASE}/resume/ats-check`, {
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

  const scoreColor = atsResult
    ? atsResult.score >= 70 ? "text-success" : atsResult.score >= 45 ? "text-accent" : "text-danger"
    : "text-muted";

  const allExtractedSkills = [...new Set([...(profile?.skills || []), ...(profile?.resumeExtractedSkills || [])])];

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-danger/10 border border-danger/30 text-danger text-sm">
          <AlertCircle size={15} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")}><X size={14} /></button>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-success/10 border border-success/30 text-success text-sm">
          <CheckCircle size={15} className="shrink-0" />
          <span className="flex-1">{successMsg}</span>
          <button onClick={() => setSuccessMsg("")}><X size={14} /></button>
        </div>
      )}

      {/* ── TOP 3 CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <ResumeParserCard
          profile={profile}
          uploading={uploading}
          removing={removing}
          uploadProgress={uploadProgress}
          dragOver={dragOver}
          setDragOver={setDragOver}
          selectedFile={selectedFile}
          previewUrl={previewUrl}
          fileInputRef={fileInputRef}
          onFileSelect={handleFileSelect}
          onClearFile={clearFile}
          onUpload={handleUpload}
          onRemoveResume={handleRemoveResume}
        />

        <ResumeBuilderCard allExtractedSkills={allExtractedSkills} />

        <AtsScoreCard atsResult={atsResult} scoreColor={scoreColor} />
      </div>

      {/* ── ATS CHECKER + RESULTS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AtsCheckerForm
          profile={profile}
          checkingAts={checkingAts}
          jobDescription={jobDescription}
          setJobDescription={setJobDescription}
          atsDragOver={atsDragOver}
          setAtsDragOver={setAtsDragOver}
          atsSelectedFile={atsSelectedFile}
          atsFileInputRef={atsFileInputRef}
          onAtsFileSelect={handleAtsFileSelect}
          onClearAtsFile={clearAtsFile}
          onSubmit={handleCheckAts}
        />

        <DiagnosticReport atsResult={atsResult} scoreColor={scoreColor} />
      </div>

      {/* ── COVER LETTER GENERATOR ── */}
      <CoverLetterCard />

    </div>
  );
}
