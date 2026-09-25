import { Map, RefreshCw, AlertCircle, BookOpen, Sparkles, TrendingUp, ChevronRight } from "lucide-react";
import type { Profile } from "@/types/dashboard";

interface GrowthRoadmapCardProps {
  roadmap: Profile["roadmap"];
  skillGap: Profile["skillGap"];
  careerPath: Profile["careerPath"];
  roadmapTargetRole: string;
  generatingRoadmap: boolean;
  onRoadmapTargetRoleChange: (value: string) => void;
  onGenerateRoadmap: () => void;
}

export function GrowthRoadmapCard({
  roadmap,
  skillGap,
  careerPath,
  roadmapTargetRole,
  generatingRoadmap,
  onRoadmapTargetRoleChange,
  onGenerateRoadmap,
}: GrowthRoadmapCardProps) {
  return (
    <div className="premium-card p-6 flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-soft border border-accent/30 flex items-center justify-center">
            <Map size={16} className="text-accent" />
          </div>
          <span className="section-heading">Growth Roadmap</span>
        </div>
        {roadmap && (
          <div className="flex items-center gap-2">
            <textarea
              rows={2}
              placeholder="Target Role..."
              value={roadmapTargetRole}
              onChange={(e) => onRoadmapTargetRoleChange(e.target.value)}
              className="bg-surface-alt border border-line rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent w-[450px] resize-none"
            />
            <button onClick={onGenerateRoadmap} disabled={generatingRoadmap}
              className="px-3 py-1.5 bg-accent-soft hover:bg-accent/20 border border-accent/30 text-accent text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5">
              {generatingRoadmap ? <RefreshCw size={11} className="animate-spin" /> : <RefreshCw size={11} />}
              Regenerate
            </button>
          </div>
        )}
      </div>

      {roadmap ? (
        <div className="flex-1 space-y-4">
          {/* Career path ladder */}
          {careerPath && careerPath.ladder.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-accent-soft border border-accent/20">
              <p className="section-heading text-accent mb-3">
                <TrendingUp size={11} /> Career Path to {careerPath.targetRole}
              </p>
              <div className="flex items-stretch gap-1 overflow-x-auto pb-1 custom-scrollbar">
                {careerPath.ladder.map((rung, idx) => (
                  <div key={idx} className="flex items-stretch gap-1 shrink-0">
                    <div className="w-[150px] p-2.5 rounded-xl bg-surface border border-line flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-accent uppercase tracking-wider">{rung.yearsRange}</span>
                      <span className="text-xs font-bold text-foreground leading-tight">{rung.title}</span>
                      <span className="text-[11px] text-muted leading-snug">{rung.description}</span>
                    </div>
                    {idx < careerPath.ladder.length - 1 && (
                      <div className="flex items-center justify-center">
                        <ChevronRight size={14} className="text-accent/40" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Skill gaps */}
          {skillGap && skillGap.missingSkills.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-warning/10 border border-warning/30">
              <p className="section-heading text-warning mb-2">
                <AlertCircle size={11} /> Skill Gaps to Close
              </p>
              <div className="flex flex-wrap gap-1.5">
                {skillGap.missingSkills.map(s => (
                  <span key={s} className="skill-tag text-warning border-warning/30 bg-warning/10">{s}</span>
                ))}
              </div>
            </div>
          )}
          {/* Steps */}
          <div className="relative border-l border-line ml-3 pl-6 space-y-5">
            {roadmap.steps.map((step, idx) => (
              <div key={idx} className="relative group">
                <div className="timeline-dot" />
                <div className="group-hover:translate-x-1 transition-transform">
                  <h4 className="text-xs font-bold text-foreground">
                    <span className="text-accent mr-1.5">Step {idx + 1}:</span>{step.title}
                  </h4>
                  <p className="text-[11px] text-muted mt-1 leading-relaxed">{step.description}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-accent/70 font-semibold uppercase tracking-wider">
                    <BookOpen size={9} />
                    <span>{step.resourceHint}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-line rounded-2xl py-10 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-accent-soft border border-accent/20 flex items-center justify-center animate-float-slow">
            <Map size={28} className="text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Generate your AI Roadmap</p>
            <p className="text-xs text-muted max-w-xs mx-auto mb-3">
              Get a personalised learning path designed to bridge skill gaps for your target role.
            </p>
            <textarea
              rows={2}
              placeholder="e.g. Senior Frontend Engineer"
              value={roadmapTargetRole}
              onChange={(e) => onRoadmapTargetRoleChange(e.target.value)}
              className="bg-surface-alt border border-line rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent w-full max-w-md text-center mx-auto block resize-none"
            />
          </div>
          <button onClick={onGenerateRoadmap} disabled={generatingRoadmap || !roadmapTargetRole.trim()}
            className="px-6 py-3 btn-primary text-xs font-bold disabled:opacity-50">
            {generatingRoadmap ? (
              <span className="flex items-center gap-2"><RefreshCw size={12} className="animate-spin" /> Analysing Skills...</span>
            ) : (
              <span className="flex items-center gap-2"><Sparkles size={12} /> Generate AI Roadmap</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
