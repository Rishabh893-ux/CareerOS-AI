"use client";

import { useState } from "react";
import { GitBranch, Briefcase, Mail, MapPin, Globe, Download } from "lucide-react";

interface HeroProps {
  name: string;
  email?: string;
  githubUsername: string;
  linkedinUrl: string;
  careerGoal: string;
  portfolioUrl?: string;
  location?: string;
  resumeUrl?: string;
}

const SECONDARY_LINK = "flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-alt border border-line hover:border-accent transition-colors text-sm font-medium";
const PRIMARY_LINK = "flex items-center gap-2 px-4 py-2 rounded-xl btn-primary text-sm font-bold";

export default function Hero({ name, email, githubUsername, linkedinUrl, careerGoal, portfolioUrl, location, resumeUrl }: HeroProps) {
  const goal = careerGoal?.trim() || "";
  const [avatarFailed, setAvatarFailed] = useState(false);
  const showAvatar = !!githubUsername && !avatarFailed;

  return (
    <header className="flex flex-col md:flex-row gap-8 items-start md:items-center mb-14">
      <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] bg-accent brand-mark p-1 shadow-2xl shrink-0">
        {showAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote avatar, no image domain config needed
          <img
            src={`https://github.com/${encodeURIComponent(githubUsername)}.png?size=256`}
            alt={`${name}'s photo`}
            width={128}
            height={128}
            className="w-full h-full rounded-[1.8rem] object-cover bg-surface"
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <div className="w-full h-full rounded-[1.8rem] bg-surface flex items-center justify-center text-4xl md:text-5xl font-bold text-foreground" aria-hidden>
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h1 className="font-heading text-4xl md:text-5xl font-extrabold tracking-tight mb-2 break-words">
          {name}
        </h1>
        <p className="text-lg text-muted font-medium mb-5 max-w-2xl leading-snug">
          {goal || "Professional Portfolio"}
        </p>

        <div className="flex flex-wrap gap-3">
          {resumeUrl && (
            <a href={resumeUrl} target="_blank" rel="noreferrer" className={PRIMARY_LINK}>
              <Download size={16} aria-hidden /> Download Resume
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className={resumeUrl ? SECONDARY_LINK : PRIMARY_LINK}>
              <Mail size={16} aria-hidden /> Contact Me
            </a>
          )}
          {githubUsername && (
            <a href={`https://github.com/${encodeURIComponent(githubUsername)}`} target="_blank" rel="noreferrer" className={SECONDARY_LINK}>
              <GitBranch size={16} aria-hidden /> GitHub
            </a>
          )}
          {linkedinUrl && (
            <a href={linkedinUrl} target="_blank" rel="noreferrer" className={SECONDARY_LINK}>
              <Briefcase size={16} aria-hidden /> LinkedIn
            </a>
          )}
          {portfolioUrl && (
            <a href={portfolioUrl} target="_blank" rel="noreferrer" className={SECONDARY_LINK}>
              <Globe size={16} aria-hidden /> Website
            </a>
          )}
          {location && (
            <span className="flex items-center gap-2 px-1 py-2 text-sm text-muted">
              <MapPin size={16} aria-hidden /> {location}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
