import React from "react";
import { MessageSquare, Sparkles, RefreshCw } from "lucide-react";

interface SetupFormProps {
  type: "HR" | "Technical";
  format: "Written" | "MCQ";
  topic: string;
  limit: number;
  generating: boolean;
  onTypeChange: (type: "HR" | "Technical") => void;
  onFormatChange: (format: "Written" | "MCQ") => void;
  onTopicChange: (topic: string) => void;
  onLimitChange: (limit: number) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function SetupForm({
  type,
  format,
  topic,
  limit,
  generating,
  onTypeChange,
  onFormatChange,
  onTopicChange,
  onLimitChange,
  onSubmit,
}: SetupFormProps) {
  return (
    <div className="premium-card p-6 lg:col-span-1 h-fit">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
        <MessageSquare size={18} className="text-accent animate-float" />
        <span>Configure Mock Board</span>
      </h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Interview Type</label>
          <div className="grid grid-cols-2 gap-2">
            {(["Technical", "HR"] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => onTypeChange(t)}
                className={`py-2 rounded-xl text-xs font-semibold cursor-pointer border ${
                  type === t
                    ? "bg-accent-soft border-accent text-accent font-bold"
                    : "border-line bg-surface-alt text-muted hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {type === "Technical" && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Technical Topic</label>
            <input
              type="text"
              placeholder="e.g. DBMS, React Hooks, Python..."
              value={topic}
              onChange={(e) => onTopicChange(e.target.value)}
              className="w-full bg-surface-alt border border-line rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none"
              required={type === "Technical"}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Answering Format</label>
          <div className="grid grid-cols-2 gap-2">
            {(["MCQ", "Written"] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => onFormatChange(f)}
                className={`py-2 rounded-xl text-xs font-semibold cursor-pointer border ${
                  format === f
                    ? "bg-accent-soft border-accent text-accent font-bold"
                    : "border-line bg-surface-alt text-muted hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Question Count</label>
          <div className="grid grid-cols-3 gap-2">
            {[5, 10, 20].map(c => (
              <button
                key={c}
                type="button"
                onClick={() => onLimitChange(c)}
                className={`py-2 rounded-xl text-xs font-semibold cursor-pointer border ${
                  limit === c
                    ? "bg-accent-soft border-accent text-accent font-bold"
                    : "border-line bg-surface-alt text-muted hover:text-foreground"
                }`}
              >
                {c} Qs
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={generating}
          className="btn-primary w-full mt-4 py-3 text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
        >
          {generating ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>Analyzing Prompt...</span>
            </>
          ) : (
            <>
              <Sparkles size={14} />
              <span>Launch Interview</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
