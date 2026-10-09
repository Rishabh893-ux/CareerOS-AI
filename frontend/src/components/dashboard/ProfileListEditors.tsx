import { useState } from "react";
import { Briefcase, Award, Trash2, Plus } from "lucide-react";
import type { Profile } from "@/types/dashboard";

const FIELD_LABEL = "block text-xs font-semibold text-muted mb-1.5";
const FIELD = "w-full bg-surface-alt border border-line rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted";

type Experience = NonNullable<Profile["experience"]>[number];
type Certification = NonNullable<Profile["certifications"]>[number];

interface ListEditorProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
}

function RemovableItem({ title, subtitle, onRemove }: { title: string; subtitle?: string; onRemove: () => void }) {
  return (
    <li className="flex justify-between items-center gap-3 p-3 bg-surface-alt border border-line rounded-xl">
      <div className="min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">{title}</p>
        {subtitle && <p className="text-xs text-muted line-clamp-1 mt-0.5">{subtitle}</p>}
      </div>
      <button type="button" onClick={onRemove}
        aria-label={`Remove ${title}`} title="Remove"
        className="text-danger p-2 hover:bg-danger/10 rounded-lg transition-all shrink-0">
        <Trash2 size={14} aria-hidden />
      </button>
    </li>
  );
}

const EMPTY_EXPERIENCE = { company: "", role: "", startDate: "", endDate: "", description: "" };

export function ExperienceEditor({ items, onChange }: ListEditorProps<Experience>) {
  const [draft, setDraft] = useState(EMPTY_EXPERIENCE);
  const set = (field: keyof typeof EMPTY_EXPERIENCE) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft((d) => ({ ...d, [field]: e.target.value }));
  const canAdd = draft.company.trim() !== "" && draft.role.trim() !== "";
  const draftStarted = Object.values(draft).some(Boolean);

  const add = () => {
    if (!canAdd) return;
    onChange([...items, {
      company: draft.company.trim(), role: draft.role.trim(),
      startDate: draft.startDate.trim(), endDate: draft.endDate.trim(), description: draft.description.trim(),
    }]);
    setDraft(EMPTY_EXPERIENCE);
  };

  return (
    <div className="space-y-4 border-t border-line pt-6">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Briefcase size={15} className="text-accent" aria-hidden /> Experience
      </h3>
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((exp, idx) => (
            <RemovableItem key={idx} title={`${exp.role} at ${exp.company}`}
              subtitle={[exp.startDate, exp.endDate].filter(Boolean).join(" – ")}
              onRemove={() => onChange(items.filter((_, i) => i !== idx))} />
          ))}
        </ul>
      )}
      <div className="p-4 bg-surface-alt border border-dashed border-line rounded-xl space-y-3">
        <p className="text-xs font-semibold text-foreground">Add experience</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="exp-role" className={FIELD_LABEL}>Role</label>
            <input id="exp-role" type="text" placeholder="e.g. Software Engineer Intern" value={draft.role}
              onChange={set("role")} className={FIELD} />
          </div>
          <div>
            <label htmlFor="exp-company" className={FIELD_LABEL}>Company</label>
            <input id="exp-company" type="text" placeholder="e.g. Acme Corp" value={draft.company}
              onChange={set("company")} className={FIELD} />
          </div>
          <div>
            <label htmlFor="exp-start" className={FIELD_LABEL}>Start <span className="font-normal">(optional)</span></label>
            <input id="exp-start" type="text" placeholder="e.g. Jun 2025" value={draft.startDate}
              onChange={set("startDate")} className={FIELD} />
          </div>
          <div>
            <label htmlFor="exp-end" className={FIELD_LABEL}>End <span className="font-normal">(optional)</span></label>
            <input id="exp-end" type="text" placeholder="e.g. Present" value={draft.endDate}
              onChange={set("endDate")} className={FIELD} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="exp-desc" className={FIELD_LABEL}>What you did <span className="font-normal">(optional)</span></label>
            <textarea id="exp-desc" placeholder="One achievement per line" value={draft.description}
              onChange={set("description")} className={`${FIELD} resize-none h-20`} />
          </div>
        </div>
        <button type="button" onClick={add} disabled={!canAdd}
          className="w-full py-2.5 btn-ghost text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
          <Plus size={14} aria-hidden /> Add Experience
        </button>
        {!canAdd && draftStarted && (
          <p className="text-xs text-muted">Add a role and company to include this experience.</p>
        )}
      </div>
    </div>
  );
}

const EMPTY_CERTIFICATION = { name: "", issuer: "", date: "", link: "" };

export function CertificationsEditor({ items, onChange }: ListEditorProps<Certification>) {
  const [draft, setDraft] = useState(EMPTY_CERTIFICATION);
  const set = (field: keyof typeof EMPTY_CERTIFICATION) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((d) => ({ ...d, [field]: e.target.value }));
  const canAdd = draft.name.trim() !== "";
  const draftStarted = Object.values(draft).some(Boolean);

  const add = () => {
    if (!canAdd) return;
    onChange([...items, {
      name: draft.name.trim(), issuer: draft.issuer.trim(), date: draft.date.trim(), link: draft.link.trim(),
    }]);
    setDraft(EMPTY_CERTIFICATION);
  };

  return (
    <div className="space-y-4 border-t border-line pt-6">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Award size={15} className="text-accent" aria-hidden /> Certifications
      </h3>
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((cert, idx) => (
            <RemovableItem key={idx} title={cert.name}
              subtitle={[cert.issuer, cert.date].filter(Boolean).join(" · ")}
              onRemove={() => onChange(items.filter((_, i) => i !== idx))} />
          ))}
        </ul>
      )}
      <div className="p-4 bg-surface-alt border border-dashed border-line rounded-xl space-y-3">
        <p className="text-xs font-semibold text-foreground">Add a certification</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label htmlFor="cert-name" className={FIELD_LABEL}>Name</label>
            <input id="cert-name" type="text" placeholder="e.g. AWS Certified Cloud Practitioner" value={draft.name}
              onChange={set("name")} className={FIELD} />
          </div>
          <div>
            <label htmlFor="cert-issuer" className={FIELD_LABEL}>Issuer <span className="font-normal">(optional)</span></label>
            <input id="cert-issuer" type="text" placeholder="e.g. Amazon Web Services" value={draft.issuer}
              onChange={set("issuer")} className={FIELD} />
          </div>
          <div>
            <label htmlFor="cert-date" className={FIELD_LABEL}>Date <span className="font-normal">(optional)</span></label>
            <input id="cert-date" type="text" placeholder="e.g. Mar 2026" value={draft.date}
              onChange={set("date")} className={FIELD} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="cert-link" className={FIELD_LABEL}>Credential link <span className="font-normal">(optional)</span></label>
            <input id="cert-link" type="url" inputMode="url" placeholder="https://..." value={draft.link}
              onChange={set("link")} className={FIELD} />
          </div>
        </div>
        <button type="button" onClick={add} disabled={!canAdd}
          className="w-full py-2.5 btn-ghost text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
          <Plus size={14} aria-hidden /> Add Certification
        </button>
        {!canAdd && draftStarted && (
          <p className="text-xs text-muted">Add a name to include this certification.</p>
        )}
      </div>
    </div>
  );
}
