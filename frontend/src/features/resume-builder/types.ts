import type { ResumeData, TemplateId } from "@/features/resume-builder/templates";

export type ResumeBuilderTab =
  | "basics"
  | "summary"
  | "experience"
  | "certifications"
  | "projects"
  | "education"
  | "skills";

export type EnhanceType = "experience" | "project" | "summary";

export interface EnhancingState {
  type: EnhanceType;
  index: number;
}

/** A resume edited for one tracked job (stored on the job, see careeros/models/JobApplication.js) */
export interface TailoredResume {
  template: TemplateId;
  isCompact?: boolean;
  data: ResumeData;
}

/** The job the builder is tailoring for, and how well the draft covers its skills */
export interface TailoringJob {
  id: string;
  role: string;
  company: string;
  tailoredAt?: string;
}

export interface KeywordCoverage {
  term: string;
  found: boolean;
}

export type OnChangeField = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => void;
