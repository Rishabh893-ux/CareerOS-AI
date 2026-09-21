interface AtsWarningsProps {
  warnings: string[];
}

export function AtsWarnings({ warnings }: AtsWarningsProps) {
  if (warnings.length === 0) return null;

  return (
    <div className="m-4 p-3 bg-danger/10 border border-danger/30 rounded-lg">
      <h3 className="text-danger text-xs font-bold mb-2 flex items-center gap-2">
        ⚠️ ATS Warnings ({warnings.length})
      </h3>
      <ul className="list-disc pl-4 text-[10px] text-danger/80 space-y-1">
        {warnings.map((w, i) => <li key={i}>{w}</li>)}
      </ul>
    </div>
  );
}
