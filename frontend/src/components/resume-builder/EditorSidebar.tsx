import type { ResumeData } from "@/components/resume/templates";
import type { EnhancingState, OnChangeField, ResumeBuilderTab } from "@/types/resume-builder";
import { AtsWarnings } from "./AtsWarnings";
import { BasicsTab } from "./tabs/BasicsTab";
import { SummaryTab } from "./tabs/SummaryTab";
import { ExperienceTab } from "./tabs/ExperienceTab";
import { ProjectsTab } from "./tabs/ProjectsTab";
import { CertificationsTab } from "./tabs/CertificationsTab";
import { EducationTab } from "./tabs/EducationTab";
import { SkillsTab } from "./tabs/SkillsTab";

const TABS: ResumeBuilderTab[] = ["basics", "summary", "experience", "certifications", "education", "projects", "skills"];

interface EditorSidebarProps {
  activeTab: ResumeBuilderTab;
  onTabChange: (tab: ResumeBuilderTab) => void;
  warnings: string[];
  data: ResumeData;
  isEnhancing: EnhancingState | null;
  onChangeField: OnChangeField;
  onEnhanceBullet: (index: number, type: EnhancingState["type"]) => void;
}

export function EditorSidebar({ activeTab, onTabChange, warnings, data, isEnhancing, onChangeField, onEnhanceBullet }: EditorSidebarProps) {
  return (
    <div className="w-[400px] border-r border-line bg-surface flex flex-col z-10 shrink-0">

      {/* Tabs */}
      <div className="flex overflow-x-auto p-2 gap-1 border-b border-line scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize whitespace-nowrap transition-all ${activeTab === tab ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-alt"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ATS Warnings */}
      <AtsWarnings warnings={warnings} />

      {/* Form Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">

        {activeTab === "basics" && (
          <BasicsTab
            name={data.name}
            email={data.email}
            phone={data.phone}
            linkedin={data.linkedin}
            github={data.github}
            onChangeField={onChangeField}
          />
        )}

        {activeTab === "summary" && (
          <SummaryTab
            summary={data.summary}
            isEnhancing={isEnhancing?.type === 'summary'}
            onChangeField={onChangeField}
            onEnhance={() => onEnhanceBullet(0, 'summary')}
          />
        )}

        {activeTab === "experience" && (
          <ExperienceTab
            experience={data.experience}
            isEnhancingIndex={isEnhancing?.type === 'experience' ? isEnhancing.index : null}
            onChangeField={onChangeField}
            onEnhance={(index) => onEnhanceBullet(index, 'experience')}
          />
        )}

        {/* Similarly, we'd add full inputs for Education, Projects, Skills here... For brevity I'll add simple versions */}

        {activeTab === "skills" && (
          <SkillsTab skills={data.skills} onChangeField={onChangeField} />
        )}

        {activeTab === "projects" && (
          <ProjectsTab
            projects={data.projects}
            isEnhancingIndex={isEnhancing?.type === 'project' ? isEnhancing.index : null}
            onChangeField={onChangeField}
            onEnhance={(index) => onEnhanceBullet(index, 'project')}
          />
        )}

        {activeTab === "certifications" && (
          <CertificationsTab certifications={data.certifications} onChangeField={onChangeField} />
        )}

        {activeTab === "education" && (
          <EducationTab education={data.education} onChangeField={onChangeField} />
        )}

      </div>
    </div>
  );
}
