"use client";

import React, { useState, useEffect } from "react";
import { 
  Briefcase, 
  Search, 
  MapPin, 
  TrendingUp, 
  RefreshCw, 
  Plus, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  AlertCircle,
  CheckCircle,
  X
} from "lucide-react";
import { fetchWithAuth } from "@/app/api";

interface Job {
  _id: string;
  company: string;
  role: string;
  jobUrl?: string;
  status: "Wishlist" | "Applied" | "Interviewing" | "Offer" | "Rejected";
  notes?: string;
  matchStatus?: "pending" | "completed" | "failed";
  matchPercentage?: number;
  missingSkills?: string[];
  strengths?: string[];
  weaknesses?: string[];
  tips?: string[];
  appliedOn?: string;
}

interface SearchResult {
  title: string;
  company: string;
  location: string;
  description: string;
  redirect_url: string;
  salary: string;
}

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

  const getStatusColor = (status: Job["status"]) => {
    switch (status) {
      case "Wishlist": return "border-blue-500/30 text-blue-400 bg-blue-500/5";
      case "Applied": return "border-purple-500/30 text-purple-400 bg-purple-500/5";
      case "Interviewing": return "border-amber-500/30 text-amber-400 bg-amber-500/5";
      case "Offer": return "border-emerald-500/30 text-emerald-400 bg-emerald-500/5";
      case "Rejected": return "border-rose-500/30 text-rose-400 bg-rose-500/5";
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* JOB BOARD VACANCIES SECTION */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* Live Search Panel */}
        <div className="glass-panel p-6 h-fit">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
            <Search size={18} className="text-blue-400 animate-float" />
            <span>Search Live Vacancies</span>
          </h3>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl px-4 py-3 focus-within:border-blue-500">
              <Briefcase size={16} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Developer, Backend, MERN..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-sm w-full text-white focus:outline-none"
                required
              />
            </div>
            <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl px-4 py-3 focus-within:border-blue-500">
              <MapPin size={16} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Bengaluru, Noida, Remote..." 
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
                className="bg-transparent text-sm w-full text-white focus:outline-none"
              />
            </div>
            <button 
              type="submit"
              disabled={searching}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {searching ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Searching Listings...</span>
                </>
              ) : (
                <>
                  <Search size={14} />
                  <span>Fetch Live Jobs</span>
                </>
              )}
            </button>
          </form>

          {/* Add Job manually button */}
          <button 
            onClick={() => setShowAddForm(true)}
            className="w-full mt-4 py-3 border border-dashed border-white/10 hover:border-blue-500/50 bg-white/5 hover:bg-blue-500/5 text-slate-300 hover:text-blue-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Custom Application</span>
          </button>
        </div>

        {/* Results Panel */}
        <div className="glass-panel p-6 flex flex-col min-h-[500px] max-h-[700px]">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            Available Postings ({searchResults.length})
          </h3>

          {searchResults.length > 0 ? (
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {searchResults.map((job, idx) => (
                <div key={idx} className="p-4 bg-white/5 border border-white/5 rounded-xl hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <h4 className="text-sm font-bold text-white leading-snug">{job.title}</h4>
                    <p className="text-xs text-slate-300">{job.company} • {job.location}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{job.salary}</p>
                  </div>
                  <div className="flex gap-2">
                    <a 
                      href={job.redirect_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-all"
                    >
                      <ExternalLink size={14} />
                    </a>
                    <button 
                      onClick={() => handleAddJob(job.company, job.title, job.redirect_url, "Wishlist", job.description)}
                      className="px-3.5 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold rounded-lg transition-all cursor-pointer"
                    >
                      Track Job
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border border-white/5 border-dashed rounded-xl text-center py-12">
              <Briefcase size={28} className="text-slate-600 mb-2" />
              <p className="text-xs text-slate-400">No vacancies loaded yet. Type a title and search above.</p>
            </div>
          )}
        </div>

      </div>

      {/* DRAG-AND-DROP KANBAN APPLICATION BOARD */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={16} className="text-purple-400" />
            <span>Applications Kanban Board</span>
          </h3>
          <p className="text-xs text-slate-400">Drag & drop cards to progress status</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
          {columns.map(status => {
            const columnJobs = jobs.filter(j => j.status === status);
            return (
              <div 
                key={status}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
                className="glass-panel p-4 flex flex-col min-h-[400px] bg-black/10 rounded-2xl"
              >
                <div className={`px-2.5 py-1.5 rounded-lg border font-bold text-xs text-center uppercase tracking-wider mb-4 ${getStatusColor(status)}`}>
                  {status} ({columnJobs.length})
                </div>

                <div className="flex-1 space-y-3">
                  {columnJobs.map(job => (
                    <div 
                      key={job._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, job._id)}
                      className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl cursor-grab active:cursor-grabbing transition-all space-y-2 relative group"
                    >
                      <button 
                        onClick={() => handleDeleteJob(job._id)}
                        className="absolute top-2 right-2 text-slate-500 hover:text-red-400 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>

                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h5 className="text-xs font-bold text-white line-clamp-1">{job.role}</h5>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{job.company}</p>
                        </div>
                        {job.jobUrl && (
                          <a 
                            href={job.jobUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-blue-400 p-0.5 rounded transition-colors"
                            title="Open Job Posting"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>

                      {/* Display match scorecard */}
                      {/* Display match scorecard */}
                      {job.matchStatus === "pending" ? (
                        <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[10px] text-blue-400 font-semibold uppercase animate-pulse">
                          <span>Analyzing Match...</span>
                          <button onClick={() => handleRefreshJob(job._id)} className="text-slate-500 hover:text-white transition-colors" title="Refresh">
                            <RefreshCw size={10} />
                          </button>
                        </div>
                      ) : job.matchStatus === "completed" && job.matchPercentage !== undefined ? (
                        <div className="flex items-center justify-between border-t border-white/5 pt-2">
                          <button 
                            onClick={() => setActiveMatchJob(job)} 
                            className="text-[9px] text-blue-400 hover:text-blue-300 transition-colors font-semibold uppercase flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles size={10} /> View Insights
                          </button>
                          <span className={`text-[10px] font-black ${
                            job.matchPercentage >= 75 ? "text-emerald-400" : job.matchPercentage >= 50 ? "text-amber-400" : "text-red-400"
                          }`}>
                            {job.matchPercentage}%
                          </span>
                        </div>
                      ) : job.matchStatus === "failed" ? (
                        <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[9px] text-red-400">
                          <span>Analysis Failed</span>
                        </div>
                      ) : null}
                    </div>
                  ))}
                  {columnJobs.length === 0 && (
                    <div className="h-full flex items-center justify-center text-[10px] text-slate-600 py-20 border border-dashed border-white/5 rounded-xl">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DIALOG: MANUAL JOB FORM */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-panel p-6 w-full max-w-sm">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Track Custom Application</h3>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Company Name" 
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
              />
              <input 
                type="text" 
                placeholder="Role / Title" 
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
              />
              <input 
                type="text" 
                placeholder="Job URL (Optional)" 
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
              />
              <textarea 
                placeholder="Job Description (Optional - required for AI Match)" 
                value={newJobDescription}
                onChange={(e) => setNewJobDescription(e.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none resize-none leading-relaxed"
              />
              <select 
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as Job["status"])}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-slate-300 focus:outline-none"
              >
                <option value="Wishlist" className="bg-[#08090c]">Wishlist</option>
                <option value="Applied" className="bg-[#08090c]">Applied</option>
                <option value="Interviewing" className="bg-[#08090c]">Interviewing</option>
                <option value="Offer" className="bg-[#08090c]">Offer</option>
                <option value="Rejected" className="bg-[#08090c]">Rejected</option>
              </select>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => handleAddJob(newCompany, newRole, newUrl, newStatus, newJobDescription)}
                  className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Add Job
                </button>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-white/10 text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG: AI JOB INSIGHTS */}
      {activeMatchJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="text-blue-400" />
                AI Job Insights: {activeMatchJob.role}
              </h3>
              <button onClick={() => setActiveMatchJob(null)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
              
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-xl">
                <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center text-xl font-black bg-black/30" style={{ 
                  borderColor: (activeMatchJob.matchPercentage || 0) >= 75 ? "#34d399" : (activeMatchJob.matchPercentage || 0) >= 50 ? "#fbbf24" : "#f87171",
                  color: (activeMatchJob.matchPercentage || 0) >= 75 ? "#34d399" : (activeMatchJob.matchPercentage || 0) >= 50 ? "#fbbf24" : "#f87171"
                }}>
                  {activeMatchJob.matchPercentage}%
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">Match Score</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Based on your skills, experience, and projects compared to the job description.
                  </p>
                </div>
              </div>

              {activeMatchJob.strengths && activeMatchJob.strengths.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <CheckCircle size={16} /> Key Strengths
                  </h4>
                  <ul className="space-y-2">
                    {activeMatchJob.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-slate-300 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg leading-relaxed">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeMatchJob.weaknesses && activeMatchJob.weaknesses.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlertCircle size={16} /> Missing or Weak Areas
                  </h4>
                  <ul className="space-y-2">
                    {activeMatchJob.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm text-slate-300 bg-red-500/5 border border-red-500/10 p-3 rounded-lg leading-relaxed">
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeMatchJob.tips && activeMatchJob.tips.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <TrendingUp size={16} /> Actionable Tips
                  </h4>
                  <ul className="space-y-2">
                    {activeMatchJob.tips.map((t, i) => (
                      <li key={i} className="text-sm text-slate-300 bg-blue-500/5 border border-blue-500/10 p-3 rounded-lg leading-relaxed">
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
