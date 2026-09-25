import { Sparkles, Target, Zap, GitBranch, GraduationCap, Code, Trash2, Plus } from "lucide-react";
import type { Profile } from "@/types/dashboard";

const FIELD_LABEL = "block text-xs font-semibold text-muted mb-1.5";
const FIELD = "w-full bg-surface-alt border border-line rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted";

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
  const canAddProject = newProjTitle.trim() !== "" && newProjDesc.trim() !== "";
  const projectDraftStarted = !!(newProjTitle || newProjDesc || newProjStack || newProjRepo);
  const otherEducationCount = Math.max((profile?.education?.length || 0) - 1, 0);

  return (
    <div className="premium-card p-6 sm:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-accent brand-mark flex items-center justify-center shadow-lg">
          <Sparkles size={18} className="text-accent-contrast" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {profile ? "Edit Profile" : "Set Up Your Profile"}
          </h2>
          <p className="text-xs text-muted">
            {profile ? "Your career score, roadmap and portfolio use these details." : "Tell us about yourself to get started."}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Career Goal */}
        <div className="space-y-2">
          <label htmlFor="profile-edit-form-career-goal" className="section-heading">
            <Target size={12} aria-hidden />
            Career Goal
          </label>
          <input id="profile-edit-form-career-goal"
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
          <label htmlFor="profile-edit-form-skills" className="section-heading">
            <Zap size={12} aria-hidden />
            Skills
          </label>
          <textarea id="profile-edit-form-skills"
            placeholder="React, Node.js, Python, MongoDB, Docker, TypeScript..."
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
            aria-describedby="profile-edit-form-skills-hint"
            className="w-full h-24 bg-surface-alt border border-line rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted resize-none"
          />
          <p id="profile-edit-form-skills-hint" className="text-xs text-muted">
            Separate with commas. This includes skills pulled from your resume, so remove any that don&apos;t fit.
          </p>
        </div>

        {/* GitHub */}
        <div className="space-y-2">
          <label htmlFor="profile-edit-form-github-username" className="section-heading">
            <GitBranch size={12} aria-hidden /> GitHub Username
          </label>
          <div className="flex items-center gap-1 bg-surface-alt border border-line rounded-xl px-4 py-3 focus-within:border-accent">
            <span className="text-muted text-sm select-none" aria-hidden>github.com/</span>
            <input id="profile-edit-form-github-username"
              type="text"
              placeholder="username"
              autoComplete="off"
              spellCheck={false}
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              className="bg-transparent text-sm w-full text-foreground placeholder:text-muted focus:outline-none"
            />
          </div>
        </div>

        {/* Education */}
        <div className="space-y-4 border-t border-line pt-6">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <GraduationCap size={15} className="text-accent" aria-hidden /> Education
          </h3>
          {otherEducationCount > 0 && (
            <p className="text-xs text-muted">
              Editing your first entry. Your other {otherEducationCount === 1 ? "entry stays" : `${otherEducationCount} entries stay`} as {otherEducationCount === 1 ? "it is" : "they are"}.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="edu-institute" className={FIELD_LABEL}>Institute</label>
              <input id="edu-institute" type="text" placeholder="e.g. IIT Delhi" value={eduInstitute}
                onChange={(e) => setEduInstitute(e.target.value)} className={FIELD} />
            </div>
            <div>
              <label htmlFor="edu-degree" className={FIELD_LABEL}>Degree</label>
              <input id="edu-degree" type="text" placeholder="e.g. B.Tech" value={eduDegree}
                onChange={(e) => setEduDegree(e.target.value)} className={FIELD} />
            </div>
            <div>
              <label htmlFor="edu-branch" className={FIELD_LABEL}>Field of study</label>
              <input id="edu-branch" type="text" placeholder="e.g. Computer Science" value={eduBranch}
                onChange={(e) => setEduBranch(e.target.value)} className={FIELD} />
            </div>
            <div>
              <label htmlFor="edu-cgpa" className={FIELD_LABEL}>CGPA <span className="font-normal">(optional)</span></label>
              <input id="edu-cgpa" type="number" inputMode="decimal" step="0.01" min="0" max="10" placeholder="e.g. 8.5"
                value={eduCgpa} onChange={(e) => setEduCgpa(e.target.value)} className={FIELD} />
            </div>
            <div>
              <label htmlFor="edu-year" className={FIELD_LABEL}>Graduation year</label>
              <input id="edu-year" type="number" inputMode="numeric" min="1950" max="2100" placeholder="e.g. 2026"
                value={eduYear} onChange={(e) => setEduYear(e.target.value)} className={FIELD} />
            </div>
          </div>
        </div>

        {/* Projects */}
        <div className="space-y-4 border-t border-line pt-6">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Code size={15} className="text-accent" aria-hidden /> Projects
          </h3>
          {projectsList.length > 0 && (
            <ul className="space-y-2">
              {projectsList.map((proj, idx) => (
                <li key={idx} className="flex justify-between items-center gap-3 p-3 bg-surface-alt border border-line rounded-xl">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{proj.title}</p>
                    <p className="text-xs text-muted line-clamp-1 mt-0.5">{proj.description}</p>
                  </div>
                  <button type="button" onClick={() => onRemoveProject(idx)}
                    aria-label={`Remove project ${proj.title}`} title="Remove"
                    className="text-danger p-2 hover:bg-danger/10 rounded-lg transition-all shrink-0">
                    <Trash2 size={14} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="p-4 bg-surface-alt border border-dashed border-line rounded-xl space-y-3">
            <p className="text-xs font-semibold text-foreground">Add a project</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="proj-title" className={FIELD_LABEL}>Title</label>
                <input id="proj-title" type="text" placeholder="e.g. Expense Tracker" value={newProjTitle}
                  onChange={(e) => setNewProjTitle(e.target.value)} className={FIELD} />
              </div>
              <div>
                <label htmlFor="proj-repo" className={FIELD_LABEL}>Repo link <span className="font-normal">(optional)</span></label>
                <input id="proj-repo" type="url" inputMode="url" placeholder="https://github.com/..." value={newProjRepo}
                  onChange={(e) => setNewProjRepo(e.target.value)} className={FIELD} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="proj-stack" className={FIELD_LABEL}>Tech stack <span className="font-normal">(comma-separated)</span></label>
                <input id="proj-stack" type="text" placeholder="e.g. React, Node.js, MongoDB" value={newProjStack}
                  onChange={(e) => setNewProjStack(e.target.value)} className={FIELD} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="proj-desc" className={FIELD_LABEL}>Description</label>
                <textarea id="proj-desc" placeholder="What it does and what you built" value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)} className={`${FIELD} resize-none h-20`} />
              </div>
            </div>
            <button type="button" onClick={onAddProject} disabled={!canAddProject}
              className="w-full py-2.5 btn-ghost text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
              <Plus size={14} aria-hidden /> Add Project
            </button>
            {!canAddProject && projectDraftStarted && (
              <p className="text-xs text-muted">Add a title and description to include this project.</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-line pt-6">
          <button type="submit" disabled={loading}
            className="flex-1 py-3 btn-primary text-sm font-semibold disabled:opacity-70 disabled:cursor-wait">
            {loading ? "Saving…" : "Save Profile"}
          </button>
          {profile && (
            <button type="button" onClick={onCancel} disabled={loading}
              className="px-6 py-3 btn-ghost text-sm">
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
