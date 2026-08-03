"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GitBranch, Briefcase, Mail, ExternalLink, Code, BookOpen, User, Star, LayoutDashboard, MapPin, Globe, Award, Calendar } from "lucide-react";
import Link from "next/link";

interface PortfolioData {
  user: {
    name: string;
    email?: string;
    githubUsername: string;
    linkedinUrl: string;
  };
  profile: {
    careerGoal: string;
    skills: string[];
    education: any[];
    projects: any[];
    experience: any[];
    certifications: any[];
    location?: string;
    portfolioUrl?: string;
    githubAnalysis?: {
      score: number;
      summary: string;
      topLanguages: string[];
      repos: any[];
    };
  };
}

export default function PortfolioPage() {
  const params = useParams();
  const username = params.username as string;
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username) return;
    
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/profile/public/${username}`)
      .then(res => {
        if (!res.ok) throw new Error("Portfolio not found");
        return res.json();
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080b] flex items-center justify-center">
        <div className="flex gap-2 items-center">
          {["bg-blue-500", "bg-purple-500", "bg-emerald-500"].map((c, i) => (
            <div key={i} className={`w-3 h-3 ${c} rounded-full animate-bounce`} style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#07080b] flex flex-col items-center justify-center text-slate-100">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
          <User size={32} className="text-red-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Portfolio Not Found</h1>
        <p className="text-slate-400 mb-6 text-sm">{error}</p>
        <Link href="/" className="px-5 py-2.5 rounded-xl bg-blue-600/10 text-blue-400 font-semibold hover:bg-blue-600/20 transition-all flex items-center gap-2 text-sm">
          <LayoutDashboard size={16} /> Go to CareerOS
        </Link>
      </div>
    );
  }

  const { user, profile } = data;

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 relative overflow-hidden font-sans">
      {/* Ambient glowing background */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/5 blur-[140px] pointer-events-none" />
      <div className="fixed top-[40%] left-[40%] w-[20%] h-[20%] rounded-full bg-emerald-600/3 blur-[140px] pointer-events-none" />

      {/* Powered by CareerOS Header */}
      <div className="absolute top-6 right-6 z-50">
        <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[10px] text-slate-400 uppercase tracking-wider font-semibold backdrop-blur-3xl shadow-xl">
          Powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-bold">CareerOS AI</span>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-20 relative z-10">
        
        {/* HERO SECTION */}
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center mb-16">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] bg-gradient-to-tr from-blue-600 to-purple-600 p-1 shadow-2xl shadow-blue-500/20">
            <div className="w-full h-full rounded-[1.8rem] bg-[#0f1423] flex items-center justify-center text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
          
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2">
              {user.name}
            </h1>
            <p className="text-lg text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-semibold mb-5 flex items-center gap-2">
              <Star size={16} className="text-blue-400" /> {profile.careerGoal || "Professional Portfolio"}
            </p>
            
            <div className="flex flex-wrap gap-3">
              {user.githubUsername && (
                <a href={`https://github.com/${user.githubUsername}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm font-medium">
                  <GitBranch size={16} /> GitHub
                </a>
              )}
              {user.linkedinUrl && (
                <a href={user.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all text-sm font-medium text-blue-300">
                  <Briefcase size={16} /> LinkedIn
                </a>
              )}
              {profile.portfolioUrl && (
                <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all text-sm font-medium text-purple-300">
                  <Globe size={16} /> Website
                </a>
              )}
              {profile.location && (
                <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm font-medium text-emerald-300">
                  <MapPin size={16} /> {profile.location}
                </span>
              )}
              {user.email && (
                <a href={`mailto:${user.email}`} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 shadow-lg shadow-blue-500/20 transition-all text-sm font-medium text-white">
                  <Mail size={16} /> Contact Me
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          
          {/* GITHUB PROFILER */}
          {profile.githubAnalysis && profile.githubAnalysis.score > 0 && (
            <div className="bg-[rgba(15,20,35,0.6)] backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-colors animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <GitBranch size={16} className="text-blue-400" /> GitHub Profiler
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-400 border-t-transparent animate-spin-slow" />
                    <span className="text-sm font-bold text-white">{profile.githubAnalysis.score}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-500 uppercase">Code<br/>Score</div>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed italic mb-6">"{profile.githubAnalysis.summary}"</p>
              
              {profile.githubAnalysis.topLanguages && profile.githubAnalysis.topLanguages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {profile.githubAnalysis.topLanguages.map((lang, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-slate-300">{lang}</span>
                  ))}
                </div>
              )}

              {profile.githubAnalysis.repos && profile.githubAnalysis.repos.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Top Repositories</h4>
                  <div className="grid md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {profile.githubAnalysis.repos.slice(0, 10).map((repo: any, idx: number) => (
                      <div key={idx} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer relative group/repo" onClick={() => repo.html_url && window.open(repo.html_url, '_blank')}>
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-blue-500/0 group-hover/repo:from-blue-500/5 group-hover/repo:via-purple-500/5 rounded-2xl transition-all pointer-events-none" />
                        <div className="flex justify-between items-start gap-2">
                          <h5 className="text-sm font-bold text-white overflow-hidden break-words group-hover/repo:text-blue-300 transition-colors">{repo.name}</h5>
                          {repo.html_url && (
                            <div className="text-slate-500 group-hover/repo:text-blue-400 transition-colors shrink-0">
                              <ExternalLink size={14} />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 flex-1">{repo.description}</p>
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-[10px] text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-md font-semibold">{repo.language || "Code"}</span>
                          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Star size={10} className="text-amber-400"/> {repo.stars}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Contribution Graph */}
              {user.githubUsername && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">GitHub Activity</h4>
                  <div className="p-4 bg-black/40 rounded-2xl border border-white/5 overflow-x-auto flex justify-center custom-scrollbar">
                    <img 
                      src={`https://ghchart.rshah.org/${user.githubUsername}`} 
                      alt="GitHub Contribution Chart" 
                      className="opacity-90 min-w-[600px] pointer-events-none filter sepia-[0.3] hue-rotate-[190deg] saturate-[3] brightness-[1.1] contrast-[1.1]" 
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* EXPERIENCE */}
          {profile.experience && profile.experience.length > 0 && (
            <div className="bg-[rgba(15,20,35,0.6)] backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-colors animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Briefcase size={16} className="text-blue-400" /> Professional Experience
              </h3>
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                {profile.experience.map((exp: any, idx: number) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-[#0f1423] group-[.is-active]:bg-blue-500/20 text-slate-500 group-[.is-active]:text-blue-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors">
                      <Briefcase size={16} />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <h4 className="font-bold text-white text-base">{exp.role}</h4>
                        <div className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg shrink-0 flex items-center gap-1"><Calendar size={10} /> {exp.startDate} - {exp.endDate}</div>
                      </div>
                      <div className="text-sm font-semibold text-slate-300 mb-3">{exp.company}</div>
                      <div className="text-sm text-slate-400 leading-relaxed space-y-1">
                        {exp.description && exp.description.split('\n').filter((l: string) => l.trim()).map((line: string, i: number) => (
                          <div key={i} className="flex gap-2"><span className="text-blue-400 mt-1">•</span> <span>{line.replace(/^- /, '')}</span></div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SKILLS */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="bg-[rgba(15,20,35,0.6)] backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-colors animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Code size={16} className="text-emerald-400" /> Technical Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill: string) => (
                  <span key={skill} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* PROJECTS */}
          {profile.projects && profile.projects.length > 0 && (
            <div className="bg-[rgba(15,20,35,0.6)] backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-colors animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <LayoutDashboard size={16} className="text-purple-400" /> Featured Projects
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                {profile.projects.map((proj: any, idx: number) => (
                  <div key={idx} className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-purple-500/30 transition-all group cursor-pointer relative" onClick={() => proj.repoUrl && window.open(proj.repoUrl, '_blank')}>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:to-transparent rounded-2xl transition-all pointer-events-none" />
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">{proj.title}</h4>
                      {proj.repoUrl && (
                        <div className="text-slate-500 group-hover:text-purple-400 transition-colors">
                          <ExternalLink size={16} />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed mb-4 line-clamp-3">
                      {proj.description}
                    </p>
                    {proj.techStack && proj.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-auto">
                        {proj.techStack.map((tech: string) => (
                          <span key={tech} className="px-2 py-1 rounded bg-black/40 text-[10px] font-semibold text-slate-300">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CERTIFICATIONS */}
          {profile.certifications && profile.certifications.length > 0 && (
            <div className="bg-[rgba(15,20,35,0.6)] backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-colors animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Award size={16} className="text-amber-400" /> Certifications
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {profile.certifications.map((cert: any, idx: number) => (
                  <div key={idx} className="flex gap-4 p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-amber-500/30 transition-all cursor-pointer group" onClick={() => cert.link && window.open(cert.link, '_blank')}>
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
                      <Award size={20} className="text-amber-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white leading-tight group-hover:text-amber-300 transition-colors">{cert.name}</h4>
                      <p className="text-sm text-slate-400 mt-1 font-semibold">{cert.issuer}</p>
                      <div className="flex items-center gap-3 mt-3 text-xs font-semibold text-slate-500">
                        {cert.date && <span className="px-2 py-1 bg-white/5 rounded-md flex items-center gap-1"><Calendar size={12}/> {cert.date}</span>}
                        {cert.link && (
                          <div className="text-amber-400/80 group-hover:text-amber-300 transition-colors flex items-center gap-1">
                            <ExternalLink size={12} /> View
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EDUCATION */}
          {profile.education && profile.education.length > 0 && (
            <div className="bg-[rgba(15,20,35,0.6)] backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-colors animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <BookOpen size={16} className="text-amber-400" /> Education
              </h3>
              <div className="space-y-6">
                {profile.education.map((edu: any, idx: number) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <BookOpen size={20} className="text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">{edu.degree} in {edu.branch}</h4>
                      <p className="text-sm text-slate-400 mt-0.5">{edu.institute}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-slate-500">
                        {edu.graduationYear && <span className="px-2 py-1 bg-white/5 rounded-md">Class of {edu.graduationYear}</span>}
                        {edu.cgpa && <span className="px-2 py-1 bg-white/5 rounded-md text-amber-300/80">CGPA: {edu.cgpa}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
