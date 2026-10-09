import type { LucideIcon } from "lucide-react";

interface SectionHeadingProps {
  id: string;
  icon: LucideIcon;
  children: React.ReactNode;
  count?: number;
}

/** Shared heading for portfolio sections; the id labels the enclosing <section>. */
export default function SectionHeading({ id, icon: Icon, children, count }: SectionHeadingProps) {
  return (
    <h2 id={id} className="text-sm font-bold text-muted uppercase tracking-widest mb-6 flex items-center gap-2">
      <Icon size={16} className="text-accent" aria-hidden />
      {children}
      {count !== undefined && <span className="font-semibold normal-case tracking-normal">({count})</span>}
    </h2>
  );
}
