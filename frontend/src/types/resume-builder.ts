import type { ResumeData } from "@/components/resume/templates";

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

export type OnChangeField = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => void;
