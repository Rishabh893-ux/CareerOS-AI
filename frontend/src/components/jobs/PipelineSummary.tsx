import { Job } from "@/types/jobs";

interface PipelineSummaryProps {
  jobs: Job[];
}

/** KPI row: where the search stands, in four numbers. */
export default function PipelineSummary({ jobs }: PipelineSummaryProps) {
  const applied = jobs.filter((j) => j.status !== "Wishlist").length;
  const heardBack = jobs.filter((j) => j.status === "Interviewing" || j.status === "Offer" || j.status === "Rejected").length;
  const interviewing = jobs.filter((j) => j.status === "Interviewing").length;
  const offers = jobs.filter((j) => j.status === "Offer").length;
  const responseRate = applied ? Math.round((heardBack / applied) * 100) : null;

  const tiles = [
    { label: "Tracked", value: String(jobs.length), note: `${jobs.length - applied} on your wishlist` },
    { label: "Applied", value: String(applied), note: applied ? "Sent applications" : "Move a job to Applied when you send it" },
    { label: "Response rate", value: responseRate === null ? "–" : `${responseRate}%`, note: applied ? `Heard back from ${heardBack} of ${applied}` : "Shown once you've applied" },
    { label: "Interviews & offers", value: String(interviewing + offers), note: `${interviewing} interviewing · ${offers} offer${offers === 1 ? "" : "s"}` },
  ];

  return (
    <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {tiles.map((t) => (
        <div key={t.label} className="premium-card p-4">
          <dt className="text-xs text-muted">{t.label}</dt>
          <dd className="text-2xl font-semibold text-foreground mt-1">{t.value}</dd>
          <dd className="text-[11px] text-muted mt-1">{t.note}</dd>
        </div>
      ))}
    </dl>
  );
}
