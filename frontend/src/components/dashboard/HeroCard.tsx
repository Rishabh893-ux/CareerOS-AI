import { GraduationCap, Code, Target, Zap, Briefcase, Award } from "lucide-react";
import type { Profile } from "@/types/dashboard";

interface HeroCardProps {
  profile: Profile | null;
  userName?: string;
  allSkills: string[];
  githubLinked: boolean;
  onEditProfile: () => void;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function HeroCard({ profile, userName, allSkills, githubLinked, onEditProfile }: HeroCardProps) {
  const firstName = userName?.trim().split(" ")[0];
  const goal = profile?.careerGoal?.trim() || "";
  const education = profile?.education?.[0];
  const projectCount = profile?.projects?.length || 0;
  const experienceCount = profile?.experience?.length || 0;
  const certificationCount = profile?.certifications?.length || 0;

  // What the career score and ATS tools draw on, in the order worth filling in.
  const checklist = [
    { label: "career goal", done: !!goal },
    { label: "skills", done: allSkills.length > 0 },
    { label: "education", done: !!education },
    { label: "projects", done: projectCount > 0 },
    { label: "experience", done: experienceCount > 0 },
    { label: "GitHub", done: githubLinked },
    { label: "resume", done: !!profile?.resumeUrl },
  ];
  const completed = checklist.filter(item => item.done).length;
  const percent = Math.round((completed / checklist.length) * 100);
  const missing = checklist.filter(item => !item.done).map(item => item.label);

  return (
    <div className="hero-card p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
      <div className="relative z-10 min-w-0 flex-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Hello{firstName ? `, ${firstName}` : ""} 👋</h2>
          {goal && (
            <span className="stat-badge stat-badge-purple max-w-full">
              <Target size={11} aria-hidden />
              <span className="truncate">{goal}</span>
            </span>
          )}
        </div>

        {/* Profile completeness: tells people what to add next, not just a number */}
        <div className="mt-3 max-w-lg">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-foreground">Profile {percent}% complete</span>
            <span className="text-muted">{completed}/{checklist.length}</span>
          </div>
          <div
            className="h-1.5 rounded-full bg-surface-alt border border-line overflow-hidden"
            role="progressbar"
            aria-label="Profile completeness"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-xs text-muted mt-1.5">
            {missing.length === 0
              ? "Everything the career score looks at is filled in."
              : `Add ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? ` and ${missing.length - 3} more` : ""} to sharpen your career score.`}
          </p>
        </div>

        {/* Quick stats */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {education && (
            <span className="stat-badge stat-badge-purple">
              <GraduationCap size={11} aria-hidden /> {[education.degree, education.institute].filter(Boolean).join(" · ")}
            </span>
          )}
          {allSkills.length > 0 && (
            <span className="stat-badge stat-badge-purple">
              <Zap size={11} aria-hidden /> {plural(allSkills.length, "skill")}
            </span>
          )}
          {projectCount > 0 && (
            <span className="stat-badge stat-badge-purple">
              <Code size={11} aria-hidden /> {plural(projectCount, "project")}
            </span>
          )}
          {experienceCount > 0 && (
            <span className="stat-badge stat-badge-purple">
              <Briefcase size={11} aria-hidden /> {plural(experienceCount, "role")}
            </span>
          )}
          {certificationCount > 0 && (
            <span className="stat-badge stat-badge-purple">
              <Award size={11} aria-hidden /> {plural(certificationCount, "certification")}
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onEditProfile}
        className="relative z-10 px-5 py-2.5 btn-ghost text-sm font-semibold shrink-0"
      >
        Edit Profile
      </button>
    </div>
  );
}
