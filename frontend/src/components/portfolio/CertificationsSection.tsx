import { Award, Calendar, ExternalLink } from "lucide-react";
import type { PortfolioCertification } from "@/types/portfolio";

interface CertificationsSectionProps {
  certifications: PortfolioCertification[];
}

export default function CertificationsSection({ certifications }: CertificationsSectionProps) {
  if (!certifications || certifications.length === 0) return null;

  return (
    <div className="glass-panel p-8 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
      <h3 className="text-sm font-bold text-muted uppercase tracking-widest mb-6 flex items-center gap-2">
        <Award size={16} className="text-accent" /> Certifications
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        {certifications.map((cert, idx) => (
          <div key={idx} className="flex gap-4 p-5 rounded-2xl bg-surface-alt border border-line hover:border-accent transition-all cursor-pointer group" onClick={() => cert.link && window.open(cert.link, '_blank')}>
            <div className="w-12 h-12 rounded-xl bg-accent-soft flex items-center justify-center shrink-0 group-hover:opacity-80 transition-colors">
              <Award size={20} className="text-accent group-hover:scale-110 transition-transform" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-bold leading-tight break-words group-hover:text-accent transition-colors">{cert.name}</h4>
              <p className="text-sm text-muted mt-1 font-semibold break-words">{cert.issuer}</p>
              <div className="flex items-center gap-3 mt-3 text-xs font-semibold text-muted">
                {cert.date && <span className="px-2 py-1 bg-surface rounded-md flex items-center gap-1"><Calendar size={12}/> {cert.date}</span>}
                {cert.link && (
                  <div className="text-accent/80 group-hover:text-accent transition-colors flex items-center gap-1">
                    <ExternalLink size={12} /> View
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
