import type { ResumeData } from "@/features/resume-builder/templates";

/** The resume's words as plain text, for keyword checks against a job. */
export function resumeText(data: ResumeData): string {
  return [
    data.name,
    data.summary,
    data.skills.join(", "),
    ...data.experience.map((e) => [e.role, e.company, e.description].join("\n")),
    ...data.projects.map((p) => [p.title, p.description, (p.techStack || []).join(", ")].join("\n")),
    ...(data.certifications || []).map((c) => [c.name, c.issuer].join(" ")),
    ...data.education.map((e) => [e.degree, e.branch, e.institute].join(" ")),
  ]
    .filter(Boolean)
    .join("\n");
}
