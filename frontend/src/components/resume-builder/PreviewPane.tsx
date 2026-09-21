"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { ClassicAtsTemplate, ModernTemplate } from "@/components/resume/templates";
import type { ResumeData, TemplateId } from "@/components/resume/templates";

interface PreviewPaneProps {
  template: TemplateId;
  data: ResumeData;
  isCompact: boolean;
  printRef: RefObject<HTMLDivElement | null>;
}

// Fixed page size the templates render at (US Letter @ 96dpi) - see templates/index.tsx
const PAGE_WIDTH_PX = 816;
const PAGE_HEIGHT_PX = 1056;
const PANE_PADDING_PX = 80; // matches the p-10 (2.5rem = 40px each side) on the pane below

export function PreviewPane({ template, data, isCompact, printRef }: PreviewPaneProps) {
  const paneRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.85);

  useEffect(() => {
    const pane = paneRef.current;
    if (!pane) return;

    const updateScale = () => {
      const available = pane.clientWidth - PANE_PADDING_PX;
      const fitScale = available / PAGE_WIDTH_PX;
      setScale(Math.min(0.85, fitScale));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(pane);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={paneRef} className="flex-1 bg-surface-alt overflow-auto p-10 flex justify-center custom-scrollbar shadow-inner relative">

      {/* Sized to the scaled-down footprint so the flex layout reserves the right
          amount of space - `transform` alone doesn't shrink an element's layout box. */}
      <div className="shrink-0" style={{ width: PAGE_WIDTH_PX * scale, height: PAGE_HEIGHT_PX * scale }}>
        <div ref={printRef} className="bg-white text-black shadow-2xl transition-all duration-300" style={{ transformOrigin: "top left", transform: `scale(${scale})` }}>
          {template === "classic" && <ClassicAtsTemplate data={data} isCompact={isCompact} />}
          {template === "modern" && <ModernTemplate data={data} isCompact={isCompact} />}
        </div>
      </div>

    </div>
  );
}
