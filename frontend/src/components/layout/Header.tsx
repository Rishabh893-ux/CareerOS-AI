"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Settings, LogOut, Menu } from "lucide-react";
import ThemeToggleButton from "./ThemeToggleButton";
import type { Theme } from "@/lib/useTheme";
import type { UserData } from "@/types/layout";

interface HeaderProps {
  pageTitle: string;
  pageDescription?: string;
  onOpenNav: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenCopilot: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  userData: UserData;
}

export default function Header({ pageTitle, pageDescription, onOpenNav, theme, onToggleTheme, onOpenCopilot, onOpenSettings, onLogout, userData }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  return (
    <header className="app-header h-16 shrink-0 flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 border-b border-line bg-background elevated-sm relative z-20">
      <button type="button" onClick={onOpenNav} aria-label="Open menu" aria-controls="app-sidebar"
        className="md:hidden -ml-1 w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-surface-alt shrink-0">
        <Menu size={18} aria-hidden />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="text-base font-semibold capitalize truncate">{pageTitle}</h1>
        {pageDescription && <p className="text-xs text-muted truncate hidden sm:block">{pageDescription}</p>}
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <ThemeToggleButton theme={theme} onToggle={onToggleTheme} className="border border-line" />
        <button onClick={onOpenCopilot}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-accent hover:opacity-90 bg-accent-soft text-accent text-xs font-semibold transition-all cursor-pointer">
          <Sparkles size={13} aria-hidden />
          <span className="hidden sm:inline">Ask Copilot</span>
          <span className="sm:hidden sr-only">Ask Copilot</span>
        </button>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(prev => !prev)}
            aria-label={userData.name ? `Account menu for ${userData.name}` : "Account menu"}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="w-9 h-9 rounded-full bg-accent brand-mark flex items-center justify-center text-accent-contrast text-xs font-bold cursor-pointer"
          >
            {userData.name ? userData.name.charAt(0).toUpperCase() : "U"}
          </button>

          {menuOpen && (
            <div role="menu" className="absolute right-0 top-full mt-2 w-48 bg-surface border border-line rounded-xl shadow-xl elevated overflow-hidden animate-fade-in z-50">
              {userData.name && (
                <div className="px-4 py-3 border-b border-line">
                  <p className="text-sm font-semibold text-foreground truncate">{userData.name}</p>
                </div>
              )}
              <button
                role="menuitem"
                onClick={() => { setMenuOpen(false); onOpenSettings(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted hover:text-foreground hover:bg-surface-alt transition-all"
              >
                <Settings size={15} aria-hidden /> Settings
              </button>
              <button
                role="menuitem"
                onClick={() => { setMenuOpen(false); onLogout(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-danger/8 transition-all"
              >
                <LogOut size={15} aria-hidden /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
