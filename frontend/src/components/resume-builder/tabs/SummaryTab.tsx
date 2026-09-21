import { Sparkles } from "lucide-react";
import type { OnChangeField } from "@/types/resume-builder";

interface SummaryTabProps {
  summary: string;
  isEnhancing: boolean;
  onChangeField: OnChangeField;
  onEnhance: () => void;
}

export function SummaryTab({ summary, isEnhancing, onChangeField, onEnhance }: SummaryTabProps) {
  return (
    <div className="space-y-4 animate-fade-in-up">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Professional Summary</label>
          <button onClick={onEnhance} disabled={isEnhancing} className="text-[10px] flex items-center gap-1 font-bold text-accent hover:opacity-75 transition-colors disabled:opacity-50">
            <Sparkles size={12} /> {isEnhancing ? 'Enhancing...' : 'Enhance with AI'}
          </button>
        </div>
        <textarea rows={6} value={summary || ""} onChange={e => onChangeField("summary", e.target.value)} className="w-full bg-surface-alt border border-line rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent resize-none leading-relaxed" />
      </div>
    </div>
  );
}
