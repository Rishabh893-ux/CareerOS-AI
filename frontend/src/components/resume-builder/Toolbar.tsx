import { Download, ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { TemplateId } from "@/components/resume/templates";

interface ToolbarProps {
  template: TemplateId;
  onTemplateChange: (template: TemplateId) => void;
  isCompact: boolean;
  onCompactChange: (isCompact: boolean) => void;
  onExport: () => void;
}

export function Toolbar({ template, onTemplateChange, isCompact, onCompactChange, onExport }: ToolbarProps) {
  return (
    <header className="h-16 shrink-0 border-b border-line bg-surface flex items-center justify-between px-6 z-20">
      <div className="flex items-center gap-4">
        <Link href="/resume" className="p-2 rounded-lg hover:bg-surface-alt text-muted hover:text-foreground transition-colors">
          <ChevronLeft size={18} />
        </Link>
        <div>
          <h1 className="font-bold text-foreground text-sm">Resume Builder</h1>
          <p className="text-[10px] text-muted">Live Preview Mode</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-surface-alt border border-line p-1 rounded-lg">
          <button
            onClick={() => onTemplateChange("classic")}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${template === "classic" ? "bg-accent text-accent-contrast" : "text-muted hover:text-foreground"}`}
          >
            Classic ATS
          </button>
          <button
            onClick={() => onTemplateChange("modern")}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${template === "modern" ? "bg-accent text-accent-contrast" : "text-muted hover:text-foreground"}`}
          >
            Modern Pro
          </button>
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-muted cursor-pointer hover:text-foreground transition-colors mr-2">
          <input type="checkbox" checked={isCompact} onChange={e => onCompactChange(e.target.checked)} className="accent-accent rounded" />
          Compact Mode
        </label>

        <button onClick={onExport} className="btn-primary px-4 py-2 text-xs font-bold flex items-center gap-2">
          <Download size={14} /> Export PDF
        </button>
      </div>
    </header>
  );
}
