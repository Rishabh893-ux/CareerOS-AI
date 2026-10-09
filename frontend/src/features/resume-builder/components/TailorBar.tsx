import Link from "next/link";
import { Check, X, Target, Save, ArrowLeft } from "lucide-react";
import type { KeywordCoverage, TailoringJob } from "@/features/resume-builder/types";

interface TailorBarProps {
  job: TailoringJob;
  /** null until the first check comes back */
  keywords: KeywordCoverage[] | null;
  saving: boolean;
  dirty: boolean;
  savedAt?: string;
  onSave: () => void;
}

/** Shown above the builder when it's opened for a tracked job (?job=<id>). */
export function TailorBar({ job, keywords, saving, dirty, savedAt, onSave }: TailorBarProps) {
  const covered = keywords?.filter((k) => k.found).length ?? 0;
  const total = keywords?.length ?? 0;
  // Missing skills first: they're what the person is here to add
  const ordered = keywords ? [...keywords].sort((a, b) => Number(a.found) - Number(b.found)) : [];

  return (
    <section aria-label="Tailoring for a job" className="shrink-0 border-b border-line bg-surface-alt px-6 py-3 flex flex-wrap items-center gap-x-6 gap-y-3">
      <div className="flex items-center gap-3 min-w-0">
        <Link href="/jobs" aria-label="Back to job tracker" title="Back to job tracker"
          className="p-2 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-colors shrink-0">
          <ArrowLeft size={16} aria-hidden />
        </Link>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Target size={12} className="text-accent" aria-hidden /> Tailoring for
          </p>
          <p className="text-sm font-bold text-foreground truncate">{job.role} at {job.company}</p>
        </div>
      </div>

      <div className="flex-1 min-w-[240px]">
        {keywords === null ? (
          <p className="text-xs text-muted" role="status">Checking this job&apos;s skills…</p>
        ) : total === 0 ? (
          <p className="text-xs text-muted">This job has no matched skills yet. Run the match in the job tracker first.</p>
        ) : (
          <>
            <p className="text-xs text-foreground mb-1.5" role="status" aria-live="polite">
              <span className="font-bold tabular-nums">{covered} of {total}</span> of this job&apos;s skills appear in this version
            </p>
            <ul className="flex flex-wrap gap-1.5" aria-label="Job skills">
              {ordered.map((k) => (
                <li key={k.term}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs border ${k.found ? "bg-success/10 border-success/30 text-success" : "bg-danger/10 border-danger/30 text-danger"}`}>
                  {k.found ? <Check size={11} aria-hidden /> : <X size={11} aria-hidden />}
                  {k.term}
                  <span className="sr-only">{k.found ? "(covered)" : "(missing)"}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {!dirty && savedAt && (
          <span className="text-[11px] text-muted flex items-center gap-1"><Check size={12} className="text-success" aria-hidden /> Saved to this job</span>
        )}
        <button type="button" onClick={onSave} disabled={saving || !dirty}
          className="btn-primary px-4 py-2 text-xs font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          <Save size={14} aria-hidden /> {saving ? "Saving…" : "Save to this job"}
        </button>
      </div>
    </section>
  );
}
