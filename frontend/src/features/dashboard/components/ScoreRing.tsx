"use client";

import { useState, useEffect } from "react";

// Animated ring component
export function ScoreRing({ score, size = 140, strokeWidth = 9 }: { score: number; size?: number; strokeWidth?: number }) {
  const [animated, setAnimated] = useState(0);
  const safeScore = isNaN(score) || score == null ? 0 : score;
  const r = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (circumference * animated) / 100;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(safeScore), 100);
    return () => clearTimeout(timer);
  }, [safeScore]);

  const ringColor = safeScore >= 75 ? "var(--success)" : safeScore >= 50 ? "var(--accent)" : "var(--warning)";
  const glow = `color-mix(in srgb, ${ringColor} 45%, transparent)`;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", filter: `drop-shadow(0 0 8px ${glow})` }}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="var(--line)" strokeWidth={strokeWidth} fill="transparent"
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold text-foreground leading-none">{safeScore}</span>
        <span className="text-[11px] text-muted font-semibold uppercase tracking-widest mt-0.5">Score</span>
      </div>
    </div>
  );
}
