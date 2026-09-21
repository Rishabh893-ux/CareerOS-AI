import { GitBranch, Briefcase, Mail, Star, MapPin, Globe, Download } from "lucide-react";

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

export default function Hero({ name, email, githubUsername, linkedinUrl, careerGoal, portfolioUrl, location, resumeUrl }: HeroProps) {
  return (
    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center mb-16">
      <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] bg-accent brand-mark p-1 shadow-2xl">
        <div className="w-full h-full rounded-[1.8rem] bg-surface flex items-center justify-center text-4xl md:text-5xl font-bold text-foreground">
          {name.charAt(0).toUpperCase()}
        </div>
      </div>

      <div className="flex-1">
        <h1 className="font-heading text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
          {name}
        </h1>
        <p className="text-lg text-accent font-semibold mb-5 flex items-center gap-2">
          <Star size={16} className="text-accent" /> {careerGoal || "Professional Portfolio"}
        </p>

        <div className="flex flex-wrap gap-3">
          {resumeUrl && (
            <a href={resumeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent brand-mark hover:opacity-90 transition-all text-sm font-bold text-accent-contrast">
              <Download size={16} /> Download Resume
            </a>
          )}
          {githubUsername && (
            <a href={`https://github.com/${githubUsername}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-alt border border-line hover:border-accent transition-all text-sm font-medium">
              <GitBranch size={16} /> GitHub
            </a>
          )}
          {linkedinUrl && (
            <a href={linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-alt border border-line hover:border-accent transition-all text-sm font-medium">
              <Briefcase size={16} /> LinkedIn
            </a>
          )}
          {portfolioUrl && (
            <a href={portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-alt border border-line hover:border-accent transition-all text-sm font-medium">
              <Globe size={16} /> Website
            </a>
          )}
          {location && (
            <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-alt border border-line text-sm font-medium">
              <MapPin size={16} /> {location}
            </span>
          )}
          {email && (
            <a href={`mailto:${email}`} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent brand-mark hover:opacity-90 transition-all text-sm font-bold text-accent-contrast">
              <Mail size={16} /> Contact Me
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
