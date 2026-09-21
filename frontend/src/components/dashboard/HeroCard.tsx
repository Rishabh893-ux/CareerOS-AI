import { GraduationCap, Code, Target, Zap } from "lucide-react";
import type { Profile } from "@/types/dashboard";

interface HeroCardProps {
  profile: Profile | null;
  userName?: string;
  allSkills: string[];
  onEditProfile: () => void;
}

export function HeroCard({ profile, userName, allSkills, onEditProfile }: HeroCardProps) {
  const firstName = userName?.trim().split(" ")[0];
  return (
    <div className="hero-card p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
      <div className="relative z-10">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Hello{firstName ? `, ${firstName}` : ""} 👋</h2>
          {profile?.careerGoal && (
            <span className="stat-badge stat-badge-purple">
              <Target size={11} />
              {profile.careerGoal}
            </span>
          )}
        </div>
        <p className="text-sm text-muted mt-1.5 max-w-lg">
          Your AI-powered career intelligence platform — score, analyse, and grow toward your goals.
        </p>
        {/* Quick stats */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {profile?.education?.[0] && (
            <span className="stat-badge stat-badge-blue">
              <GraduationCap size={11} /> {profile.education[0].degree} · {profile.education[0].institute}
            </span>
          )}
          {allSkills.length > 0 && (
            <span className="stat-badge stat-badge-green">
              <Zap size={11} /> {allSkills.length} skills
            </span>
          )}
          {profile?.projects && profile.projects.length > 0 && (
            <span className="stat-badge stat-badge-amber">
              <Code size={11} /> {profile.projects.length} project{profile.projects.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onEditProfile}
        className="relative z-10 px-5 py-2.5 btn-ghost text-sm font-semibold shrink-0"
      >
        Edit Profile
      </button>
    </div>
  );
}
