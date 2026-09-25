import { Award, ExternalLink } from "lucide-react";
import type { PortfolioCertification } from "@/types/portfolio";
import SectionHeading from "./SectionHeading";

interface CertificationsSectionProps {
  certifications: PortfolioCertification[];
}

const CARD = "flex gap-4 p-5 rounded-2xl bg-surface-alt border border-line h-full";

function CertBody({ cert, linked }: { cert: PortfolioCertification; linked: boolean }) {
  return (
    <>
      <div className="w-11 h-11 rounded-xl bg-accent-soft flex items-center justify-center shrink-0" aria-hidden>
        <Award size={20} className="text-accent" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className={`text-sm font-bold leading-snug break-words ${linked ? "group-hover:text-accent transition-colors" : ""}`}>
          {cert.name}
          {linked && <span className="sr-only"> (view credential in a new tab)</span>}
        </h3>
        {cert.issuer && <p className="text-sm text-muted mt-1 break-words">{cert.issuer}</p>}
        {(cert.date || linked) && (
          <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-muted">
            {cert.date && <span>{cert.date}</span>}
            {linked && (
              <span className="text-accent flex items-center gap-1" aria-hidden>
                <ExternalLink size={12} /> Credential
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function CertificationsSection({ certifications }: CertificationsSectionProps) {
  if (!certifications || certifications.length === 0) return null;

  return (
    <section aria-labelledby="portfolio-certifications" className="portfolio-section p-6 sm:p-8">
      <SectionHeading id="portfolio-certifications" icon={Award} count={certifications.length}>Certifications</SectionHeading>
      <ul className="grid md:grid-cols-2 gap-3">
        {certifications.map((cert, idx) => (
          <li key={idx}>
            {cert.link ? (
              <a href={cert.link} target="_blank" rel="noreferrer" className={`${CARD} group hover:border-accent transition-colors`}>
                <CertBody cert={cert} linked />
              </a>
            ) : (
              <div className={CARD}>
                <CertBody cert={cert} linked={false} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
