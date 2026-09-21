// Skill pill with animated entrance
export function SkillPill({ skill, delay = 0 }: { skill: string; delay?: number }) {
  return (
    <span
      className="skill-tag animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      {skill}
    </span>
  );
}
