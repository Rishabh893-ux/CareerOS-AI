import { X } from "lucide-react";
import type { ResumeData } from "@/components/resume/templates";
import type { OnChangeField } from "@/types/resume-builder";

interface CertificationsTabProps {
  certifications: ResumeData["certifications"];
  onChangeField: OnChangeField;
}

export function CertificationsTab({ certifications, onChangeField }: CertificationsTabProps) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {certifications && certifications.map((cert, index) => (
        <div key={index} className="p-4 bg-surface-alt border border-line rounded-xl relative group">
          <button onClick={() => onChangeField("certifications", certifications!.filter((_, i) => i !== index))} type="button" aria-label={`Remove certification ${index + 1}`} title="Remove"
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-lg text-danger hover:bg-danger/10 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 focus-visible:opacity-100 transition-opacity">
            <X size={14} aria-hidden />
          </button>
          <div className="space-y-3">
            <input type="text" placeholder="Certification Name" value={cert.name || ""} onChange={e => { const newCerts = [...certifications!]; newCerts[index].name = e.target.value; onChangeField("certifications", newCerts); }} className="w-full bg-transparent border-b border-line px-1 py-1 text-sm text-foreground focus:outline-none focus:border-accent font-bold" />
            <input type="text" placeholder="Issuer" value={cert.issuer || ""} onChange={e => { const newCerts = [...certifications!]; newCerts[index].issuer = e.target.value; onChangeField("certifications", newCerts); }} className="w-full bg-transparent border-b border-line px-1 py-1 text-sm text-foreground focus:outline-none focus:border-accent" />
            <input type="text" placeholder="Date" value={cert.date || ""} onChange={e => { const newCerts = [...certifications!]; newCerts[index].date = e.target.value; onChangeField("certifications", newCerts); }} className="w-full bg-transparent border-b border-line px-1 py-1 text-sm text-foreground focus:outline-none focus:border-accent" />
          </div>
        </div>
      ))}
      <button onClick={() => onChangeField("certifications", [...(certifications || []), { name: "", issuer: "", date: "", link: "" }])} className="w-full py-2 border border-dashed border-line text-muted hover:text-foreground hover:border-accent rounded-xl text-xs font-bold transition-colors">
        + Add Certification
      </button>
    </div>
  );
}
