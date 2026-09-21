import type { OnChangeField } from "@/types/resume-builder";

interface BasicsTabProps {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  onChangeField: OnChangeField;
}

export function BasicsTab({ name, email, phone, linkedin, github, onChangeField }: BasicsTabProps) {
  return (
    <div className="space-y-4 animate-fade-in-up">
      <div>
        <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Full Name</label>
        <input type="text" value={name || ""} onChange={e => onChangeField("name", e.target.value)} className="w-full bg-surface-alt border border-line rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent" />
      </div>
      <div>
        <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Email</label>
        <input type="email" value={email || ""} onChange={e => onChangeField("email", e.target.value)} className="w-full bg-surface-alt border border-line rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent" />
      </div>
      <div>
        <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Phone</label>
        <input type="text" value={phone || ""} onChange={e => onChangeField("phone", e.target.value)} className="w-full bg-surface-alt border border-line rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent" />
      </div>
      <div>
        <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">LinkedIn URL</label>
        <input type="text" value={linkedin || ""} onChange={e => onChangeField("linkedin", e.target.value)} className="w-full bg-surface-alt border border-line rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent" />
      </div>
      <div>
        <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">GitHub URL</label>
        <input type="text" value={github || ""} onChange={e => onChangeField("github", e.target.value)} className="w-full bg-surface-alt border border-line rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent" />
      </div>
    </div>
  );
}
