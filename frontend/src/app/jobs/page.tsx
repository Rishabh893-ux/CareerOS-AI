"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { fetchWithAuth } from "@/app/api";
import { Job, SearchResult } from "@/types/jobs";
import SearchPanel from "@/components/jobs/SearchPanel";
import SearchResultsPanel from "@/components/jobs/SearchResultsPanel";
import KanbanBoard from "@/components/jobs/KanbanBoard";
import AddJobModal from "@/components/jobs/AddJobModal";
import MatchInsightsModal from "@/components/jobs/MatchInsightsModal";

export default function JobsPage() {
  // Kanban tracker state
  const [jobs, setJobs] = useState<Job[]>([]);

  // Job search state
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [error, setError] = useState("");

  // Match Modal states
  const [activeMatchJob, setActiveMatchJob] = useState<Job | null>(null);
  const [matchDesc, setMatchDesc] = useState("");
  const [analyzingMatch, setAnalyzingMatch] = useState(false);

  // Manual Add states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newJobDescription, setNewJobDescription] = useState("");
  const [newStatus, setNewStatus] = useState<Job["status"]>("Wishlist");

  const loadJobs = async () => {
    try {
      const data = await fetchWithAuth("/jobs");
      setJobs(data);
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message || "Failed to load tracked jobs."); }
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setError("");
    try {
      const data = await fetchWithAuth(`/jobs/search?what=${encodeURIComponent(searchTerm)}&where=${encodeURIComponent(locationTerm)}`);
      setSearchResults(data);
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message || "Failed to fetch live job listings."); }
    } finally {
      setSearching(false);
    }
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, jobId: string) => {
    e.dataTransfer.setData("jobId", jobId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: Job["status"]) => {
    e.preventDefault();
    const jobId = e.dataTransfer.getData("jobId");
    if (!jobId) return;

    // Optimistic UI update
    setJobs(prev => prev.map(j => j._id === jobId ? { ...j, status: targetStatus } : j));

    try {
      await fetchWithAuth(`/jobs/${jobId}`, {
        method: "PUT",
        body: JSON.stringify({ status: targetStatus }),
      });
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message || "Failed to update job status."); }
      loadJobs(); // revert if failed
    }
  };

  const handleAddJob = async (company: string, role: string, url: string, status: Job["status"], jobDescription?: string) => {
    setError("");
    try {
      const newJob = await fetchWithAuth("/jobs", {
        method: "POST",
        body: JSON.stringify({ company, role, jobUrl: url, status, jobDescription }),
      });
      setJobs(prev => [newJob, ...prev]);
      setShowAddForm(false);
      setNewCompany("");
      setNewRole("");
      setNewUrl("");
      setNewJobDescription("");
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message || "Failed to track job application."); }
    }
  };

  const handleDeleteJob = async (id: string) => {
    setError("");
    // Optimistic UI update
    setJobs(prev => prev.filter(j => j._id !== id));
    try {
      await fetchWithAuth(`/jobs/${id}`, { method: "DELETE" });
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message || "Failed to delete job."); }
      loadJobs();
    }
  };

  const handleRefreshJob = async (id: string) => {
    // Allows user to manually poll for the latest job status
    try {
      const data = await fetchWithAuth("/jobs");
      setJobs(data);
    } catch (err) {
      console.error(err);
    }
  };

  const columns: Job["status"][] = ["Wishlist", "Applied", "Interviewing", "Offer", "Rejected"];

  return (
    <div className="space-y-8 pb-12">
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* JOB BOARD VACANCIES SECTION */}
      <div className="grid grid-cols-1 gap-8">

        {/* Live Search Panel */}
        <SearchPanel
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          locationTerm={locationTerm}
          onLocationTermChange={setLocationTerm}
          searching={searching}
          onSearch={handleSearch}
          onShowAddForm={() => setShowAddForm(true)}
        />

        {/* Results Panel */}
        <SearchResultsPanel
          searchResults={searchResults}
          onTrackJob={(company, role, url, jobDescription) => handleAddJob(company, role, url, "Wishlist", jobDescription)}
        />

      </div>

      {/* DRAG-AND-DROP KANBAN APPLICATION BOARD */}
      <KanbanBoard
        jobs={jobs}
        columns={columns}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDelete={handleDeleteJob}
        onRefresh={handleRefreshJob}
        onViewInsights={setActiveMatchJob}
      />

      {/* DIALOG: MANUAL JOB FORM */}
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

      {/* DIALOG: AI JOB INSIGHTS */}
      {activeMatchJob && (
        <MatchInsightsModal
          job={activeMatchJob}
          onClose={() => setActiveMatchJob(null)}
        />
      )}

    </div>
  );
}
