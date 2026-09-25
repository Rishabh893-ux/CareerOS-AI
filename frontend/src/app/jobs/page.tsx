"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AlertCircle, CheckCircle, X } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { Job, JobStatus, SearchResponse } from "@/types/jobs";
import SearchPanel from "@/components/jobs/SearchPanel";
import SearchResultsPanel from "@/components/jobs/SearchResultsPanel";
import KanbanBoard from "@/components/jobs/KanbanBoard";
import PipelineSummary from "@/components/jobs/PipelineSummary";
import AddJobModal from "@/components/jobs/AddJobModal";
import JobDetailModal from "@/components/jobs/JobDetailModal";

const POLL_MS = 4000;

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Search
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");
  const [search, setSearch] = useState<SearchResponse | null>(null);
  const [searching, setSearching] = useState(false);
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);

  // Dialogs
  const [openJobId, setOpenJobId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newJobDescription, setNewJobDescription] = useState("");
  const [newStatus, setNewStatus] = useState<JobStatus>("Wishlist");

  const loadJobs = useCallback(async () => {
    try {
      setJobs(await fetchWithAuth("/jobs"));
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message || "Failed to load tracked jobs.");
    }
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  // Matches run in the background; poll while any are pending
  const hasPending = jobs.some((j) => j.matchStatus === "pending");
  useEffect(() => {
    if (!hasPending) return;
    const timer = setInterval(loadJobs, POLL_MS);
    return () => clearInterval(timer);
  }, [hasPending, loadJobs]);

  const trackedUrls = useMemo(() => new Set(jobs.map((j) => j.jobUrl).filter(Boolean) as string[]), [jobs]);
  const openJob = jobs.find((j) => j._id === openJobId) || null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setError("");
    try {
      setSearch(await fetchWithAuth(`/jobs/search?what=${encodeURIComponent(searchTerm)}&where=${encodeURIComponent(locationTerm)}`));
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message || "Failed to fetch job listings.");
    } finally {
      setSearching(false);
    }
  };

  const updateJob = async (id: string, updates: Partial<Job>): Promise<boolean> => {
    const previous = jobs;
    setJobs((prev) => prev.map((j) => (j._id === id ? { ...j, ...updates } : j))); // optimistic
    try {
      const saved: Job = await fetchWithAuth(`/jobs/${id}`, { method: "PUT", body: JSON.stringify(updates) });
      setJobs((prev) => prev.map((j) => (j._id === id ? saved : j)));
      return true;
    } catch (err: unknown) {
      setJobs(previous);
      if (err instanceof Error) setError(err.message || "Failed to update the job.");
      return false;
    }
  };

  const handleAddJob = async (company: string, role: string, url: string, status: JobStatus, jobDescription?: string) => {
    setError("");
    setTrackingUrl(url || null);
    try {
      const newJob: Job = await fetchWithAuth("/jobs", {
        method: "POST",
        body: JSON.stringify({ company, role, jobUrl: url || undefined, status, jobDescription }),
      });
      setJobs((prev) => [newJob, ...prev]);
      setNotice(`Tracking ${role} at ${company}${jobDescription ? ". Matching it against your resume now." : "."}`);
      setShowAddForm(false);
      setNewCompany(""); setNewRole(""); setNewUrl(""); setNewJobDescription(""); setNewStatus("Wishlist");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message || "Failed to track the job.");
    } finally {
      setTrackingUrl(null);
    }
  };

  const handleAnalyze = async (id: string) => {
    try {
      const job: Job = await fetchWithAuth(`/jobs/${id}/analyze`, { method: "POST" });
      setJobs((prev) => prev.map((j) => (j._id === id ? job : j)));
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message || "Couldn't start the match.");
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm("Delete this application from your tracker? This can’t be undone.")) return;
    setError("");
    setOpenJobId(null);
    const previous = jobs;
    setJobs((prev) => prev.filter((j) => j._id !== id));
    try {
      await fetchWithAuth(`/jobs/${id}`, { method: "DELETE" });
    } catch (err: unknown) {
      setJobs(previous);
      if (err instanceof Error) setError(err.message || "Failed to delete the job.");
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="flex items-center gap-3 p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm">
          <AlertCircle size={18} className="shrink-0" aria-hidden />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error" className="p-1 rounded-lg hover:bg-danger/10"><X size={14} aria-hidden /></button>
        </div>
      )}
      {notice && (
        <div role="status" className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/30 text-success text-sm">
          <CheckCircle size={18} className="shrink-0" aria-hidden />
          <span className="flex-1">{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss message" className="p-1 rounded-lg hover:bg-success/10"><X size={14} aria-hidden /></button>
        </div>
      )}

      <PipelineSummary jobs={jobs} />

      <KanbanBoard jobs={jobs} onStatusChange={(id, status) => updateJob(id, { status })} onOpen={(job) => setOpenJobId(job._id)} />

      <SearchPanel
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        locationTerm={locationTerm}
        onLocationTermChange={setLocationTerm}
        searching={searching}
        onSearch={handleSearch}
        onShowAddForm={() => setShowAddForm(true)}
      />

      {search && (
        <SearchResultsPanel
          search={search}
          trackedUrls={trackedUrls}
          trackingUrl={trackingUrl}
          onTrackJob={(company, role, url, jobDescription) => handleAddJob(company, role, url, "Wishlist", jobDescription)}
        />
      )}

      {showAddForm && (
        <AddJobModal
          company={newCompany}
          onCompanyChange={setNewCompany}
          role={newRole}
          onRoleChange={setNewRole}
          url={newUrl}
          onUrlChange={setNewUrl}
          jobDescription={newJobDescription}
          onJobDescriptionChange={setNewJobDescription}
          status={newStatus}
          onStatusChange={setNewStatus}
          onAdd={() => handleAddJob(newCompany, newRole, newUrl, newStatus, newJobDescription)}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {openJob && (
        <JobDetailModal
          key={openJob._id}
          job={openJob}
          onClose={() => setOpenJobId(null)}
          onSave={updateJob}
          onAnalyze={handleAnalyze}
          onDelete={handleDeleteJob}
        />
      )}
    </div>
  );
}
