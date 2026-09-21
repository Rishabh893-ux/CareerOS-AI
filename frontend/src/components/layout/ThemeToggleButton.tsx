"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import type { Theme } from "@/lib/useTheme";

interface ThemeToggleButtonProps {
  theme: Theme;
  onToggle: () => void;
  className?: string;
}

export default function ThemeToggleButton({ theme, onToggle, className = "" }: ThemeToggleButtonProps) {
  return (
    <button onClick={onToggle}
      className={`p-1.5 rounded-lg text-muted hover:text-accent hover:bg-surface-alt transition-all cursor-pointer ${className}`}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
