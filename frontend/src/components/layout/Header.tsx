"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Settings, LogOut } from "lucide-react";
import ThemeToggleButton from "./ThemeToggleButton";
import type { Theme } from "@/lib/useTheme";
import type { UserData } from "@/types/layout";

interface HeaderProps {
  pageTitle: string;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenCopilot: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  userData: UserData;
}

export default function Header({ pageTitle, theme, onToggleTheme, onOpenCopilot, onOpenSettings, onLogout, userData }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-7 border-b border-line bg-background elevated-sm relative z-20">
      <div>
        <h1 className="text-base font-bold capitalize">{pageTitle}</h1>
        <p className="text-[10px] text-muted">CareerOS AI · Intelligence Suite</p>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggleButton theme={theme} onToggle={onToggleTheme} className="border border-line" />
        <button onClick={onOpenCopilot}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-accent hover:opacity-90 bg-accent-soft text-accent text-xs font-semibold transition-all cursor-pointer">
          <Sparkles size={13} />
          <span>Copilot AI</span>
        </button>
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen(prev => !prev)}
            className="w-8 h-8 rounded-full bg-accent brand-mark flex items-center justify-center text-accent-contrast text-xs font-bold cursor-pointer"
          >
            {userData.name ? userData.name.charAt(0).toUpperCase() : "U"}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-line rounded-xl shadow-xl elevated overflow-hidden animate-fade-in z-50">
              {userData.name && (
                <div className="px-4 py-3 border-b border-line">
                  <p className="text-sm font-semibold text-foreground truncate">{userData.name}</p>
                </div>
              )}
              <button
                onClick={() => { setMenuOpen(false); onOpenSettings(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted hover:text-foreground hover:bg-surface-alt transition-all"
              >
                <Settings size={15} /> Settings
              </button>
              <button
                onClick={() => { setMenuOpen(false); onLogout(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger/80 hover:text-danger hover:bg-danger/8 transition-all"
              >
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
