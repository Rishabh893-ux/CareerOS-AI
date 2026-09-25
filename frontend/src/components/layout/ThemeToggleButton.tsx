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
    <button type="button" onClick={onToggle}
      aria-label={theme === "dark" ? "Switch to light appearance" : "Switch to dark appearance"}
      className={`w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:text-accent hover:bg-surface-alt transition-all cursor-pointer ${className}`}
      title={theme === "dark" ? "Switch to light appearance" : "Switch to dark appearance"}>
      {theme === "dark" ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
    </button>
  );
}
