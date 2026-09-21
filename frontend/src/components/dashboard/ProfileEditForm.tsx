import { Sparkles, Target, Zap, GitBranch, GraduationCap, Code, Trash2, Plus } from "lucide-react";
import type { Profile } from "@/types/dashboard";

interface ProfileEditFormProps {
  profile: Profile | null;
  loading: boolean;
  careerGoal: string;
  setCareerGoal: (value: string) => void;
  skillsText: string;
  setSkillsText: (value: string) => void;
  githubUsername: string;
  setGithubUsername: (value: string) => void;
  eduInstitute: string;
  setEduInstitute: (value: string) => void;
  eduDegree: string;
  setEduDegree: (value: string) => void;
  eduBranch: string;
  setEduBranch: (value: string) => void;
  eduCgpa: string;
  setEduCgpa: (value: string) => void;
  eduYear: string;
  setEduYear: (value: string) => void;
  projectsList: Profile["projects"];
  newProjTitle: string;
  setNewProjTitle: (value: string) => void;
  newProjDesc: string;
  setNewProjDesc: (value: string) => void;
  newProjStack: string;
  setNewProjStack: (value: string) => void;
  newProjRepo: string;
  setNewProjRepo: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onAddProject: () => void;
  onRemoveProject: (index: number) => void;
  onCancel: () => void;
}

export function ProfileEditForm({
  profile,
  loading,
  careerGoal,
  setCareerGoal,
  skillsText,
  setSkillsText,
  githubUsername,
  setGithubUsername,
  eduInstitute,
  setEduInstitute,
  eduDegree,
  setEduDegree,
  eduBranch,
  setEduBranch,
  eduCgpa,
  setEduCgpa,
  eduYear,
  setEduYear,
  projectsList,
  newProjTitle,
  setNewProjTitle,
  newProjDesc,
  setNewProjDesc,
  newProjStack,
  setNewProjStack,
  newProjRepo,
  setNewProjRepo,
  onSubmit,
  onAddProject,
  onRemoveProject,
  onCancel,
}: ProfileEditFormProps) {
  return (
    <div className="glass-panel p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-accent brand-mark flex items-center justify-center shadow-lg">
          <Sparkles size={18} className="text-accent-contrast" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {profile ? "Edit Developer Profile" : "Setup Developer Profile"}
          </h2>
          <p className="text-xs text-muted">
            {profile ? "Update your details below" : "Tell us about yourself to get started"}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Career Goal */}
        <div className="space-y-2">
          <label className="section-heading">
            <Target size={12} />
            Career Goal
          </label>
          <input
            type="text"
            placeholder="e.g. Full Stack Developer, AI Engineer, SDE-1"
            value={careerGoal}
            onChange={(e) => setCareerGoal(e.target.value)}
            className="w-full bg-surface-alt border border-line rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted"
            required
          />
        </div>

        {/* Skills */}
        <div className="space-y-2">
          <label className="section-heading">
            <Zap size={12} />
            Skills (comma-separated)
          </label>
          <textarea
            placeholder="React, Node.js, Python, MongoDB, Docker, TypeScript..."
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
            className="w-full h-24 bg-surface-alt border border-line rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted resize-none"
            required
          />
        </div>

        {/* GitHub & Year */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="section-heading"><GitBranch size={12} /> GitHub Username</label>
            <div className="flex items-center gap-2 bg-surface-alt border border-line rounded-xl px-4 py-3">
              <GitBranch size={14} className="text-muted shrink-0" />
              <input
                type="text"
                placeholder="your_github"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                className="bg-transparent text-sm w-full text-foreground placeholder:text-muted"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="section-heading">Graduation Year</label>
            <input
              type="number"
              placeholder="2026"
              value={eduYear}
              onChange={(e) => setEduYear(e.target.value)}
              className="w-full bg-surface-alt border border-line rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted"
            />
          </div>
        </div>

        {/* Education */}
        <div className="space-y-4 border-t border-line pt-6">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <GraduationCap size={15} className="text-accent" /> Education
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Institute Name" value={eduInstitute} onChange={(e) => setEduInstitute(e.target.value)}
              className="bg-surface-alt border border-line rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted" />
            <input type="text" placeholder="Degree (B.Tech)" value={eduDegree} onChange={(e) => setEduDegree(e.target.value)}
              className="bg-surface-alt border border-line rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted" />
            <input type="text" placeholder="Branch (CSE)" value={eduBranch} onChange={(e) => setEduBranch(e.target.value)}
              className="bg-surface-alt border border-line rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted col-span-2" />
            <input type="number" step="0.01" placeholder="CGPA (8.5)" value={eduCgpa} onChange={(e) => setEduCgpa(e.target.value)}
              className="bg-surface-alt border border-line rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted col-span-2" />
          </div>
        </div>

        {/* Projects */}
        <div className="space-y-4 border-t border-line pt-6">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Code size={15} className="text-accent" /> Projects
          </h3>
          {projectsList.length > 0 && (
            <div className="space-y-2">
              {projectsList.map((proj, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-surface-alt border border-line rounded-xl">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{proj.title}</p>
                    <p className="text-xs text-muted line-clamp-1 mt-0.5">{proj.description}</p>
                  </div>
                  <button type="button" onClick={() => onRemoveProject(idx)}
                    className="text-danger/60 hover:text-danger p-1.5 hover:bg-danger/10 rounded-lg transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="p-4 bg-surface-alt border border-dashed border-line rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="Project Title" value={newProjTitle} onChange={(e) => setNewProjTitle(e.target.value)}
                className="bg-surface-alt border border-line rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted" />
              <input type="text" placeholder="Repo URL" value={newProjRepo} onChange={(e) => setNewProjRepo(e.target.value)}
                className="bg-surface-alt border border-line rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted" />
              <input type="text" placeholder="Tech stack (React, Node...)" value={newProjStack} onChange={(e) => setNewProjStack(e.target.value)}
                className="bg-surface-alt border border-line rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted col-span-2" />
              <textarea placeholder="Brief description..." value={newProjDesc} onChange={(e) => setNewProjDesc(e.target.value)}
                className="bg-surface-alt border border-line rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted col-span-2 resize-none h-16" />
            </div>
            <button type="button" onClick={onAddProject}
              className="w-full py-2 btn-ghost text-xs font-semibold flex items-center justify-center gap-1.5">
              <Plus size={13} /> Add Project
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-line pt-6">
          <button type="submit"
            className="flex-1 py-3 btn-primary text-sm font-semibold">
            {loading ? "Saving..." : "Save Profile"}
          </button>
          {profile && (
            <button type="button" onClick={onCancel}
              className="px-6 py-3 btn-ghost text-sm">
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
