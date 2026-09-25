"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Bot,
  Settings,
  LogOut,
  ExternalLink,
  X,
} from "lucide-react";
import type { NavItem } from "@/types/layout";

interface SidebarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  pathname: string;
  navItems: NavItem[];
  onOpenCopilot: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  /** Phone drawer state (below the md breakpoint) */
  mobileOpen: boolean;
  isMobile: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({
  sidebarOpen,
  onToggleSidebar,
  pathname,
  navItems,
  onOpenCopilot,
  onOpenSettings,
  onLogout,
  mobileOpen,
  isMobile,
  onCloseMobile,
}: SidebarProps) {
  return (
    // Phones: an off-canvas drawer opened from the header. Tablets and up: an
    // in-flow sidebar that can collapse to icons.
    <aside id="app-sidebar" inert={isMobile && !mobileOpen}
      className={`fixed md:relative inset-y-0 left-0 z-40 md:z-30 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out
      app-sidebar h-full overflow-y-auto bg-surface-alt border-r border-line elevated
      ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
      ${sidebarOpen ? "w-64" : "w-[76px]"}`}>

      {/* Logo */}
      <div className={`h-16 flex items-center border-b border-line px-4 gap-3`}>
        <div className="w-8 h-8 rounded-xl bg-accent brand-mark flex items-center justify-center font-bold text-accent-contrast shrink-0 text-sm">
          C
        </div>
        {sidebarOpen && (
          <div className="flex-1 overflow-hidden">
            <span className="font-heading font-bold text-base truncate block">
              CareerOS AI
            </span>
          </div>
        )}
        <button type="button" onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={sidebarOpen}
          className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-surface text-muted hover:text-foreground transition-all shrink-0">
          {sidebarOpen ? <ChevronLeft size={15} aria-hidden /> : <ChevronRight size={15} aria-hidden />}
        </button>
        <button type="button" onClick={onCloseMobile} aria-label="Close menu"
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface text-muted hover:text-foreground shrink-0">
          <X size={16} aria-hidden />
        </button>
      </div>

      {/* Section label */}
      {sidebarOpen && (
        <div className="px-5 pt-5 pb-2">
          <p className="text-[11px] font-bold text-muted uppercase tracking-[0.12em]">Navigation</p>
        </div>
      )}

      {/* Nav Items */}
      <nav aria-label="Main" className={`flex-1 ${sidebarOpen ? "px-3" : "px-2.5"} space-y-1 py-2`}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} target={item.external ? "_blank" : undefined} rel={item.external ? "noreferrer" : undefined}
              onClick={(e) => { item.onClick?.(e); onCloseMobile(); }}
              aria-current={isActive ? "page" : undefined}
              aria-label={sidebarOpen ? undefined : item.name}
              className={`flex items-center gap-3.5 rounded-xl transition-all duration-200 group relative
                ${sidebarOpen ? "px-4 py-3" : "px-0 py-3 justify-center"}
                ${isActive
                  ? "bg-accent-soft border-l-[3px] border-accent text-accent"
                  : "text-muted hover:bg-surface hover:text-foreground border-l-[3px] border-transparent"
                }`}>
              <div className={`transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} aria-hidden />
              </div>
              {sidebarOpen && (
                <span className={`font-semibold text-sm truncate flex-1 flex items-center justify-between`}>
                  {item.name}
                  {item.external && <ExternalLink size={14} className="text-muted opacity-50 group-hover:opacity-100 transition-opacity" />}
                </span>
              )}
              {!sidebarOpen && (
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-surface text-foreground text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-visible:opacity-100 group-focus-visible:visible transition-all whitespace-nowrap shadow-xl border border-line z-50">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Copilot CTA + Settings + Logout */}
      <div className="p-3 border-t border-line space-y-2">
        {sidebarOpen ? (
          <button onClick={onOpenCopilot}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-accent brand-mark text-accent-contrast font-semibold text-xs hover:opacity-90 transition-all cursor-pointer">
            <Bot size={15} />
            <span>Ask AI Copilot</span>
          </button>
        ) : (
          <button onClick={onOpenCopilot}
            className="w-full flex items-center justify-center py-2.5 rounded-xl bg-accent-soft hover:opacity-80 text-accent transition-all cursor-pointer"
            aria-label="Ask AI Copilot"
            title="Ask AI Copilot">
            <Bot size={18} />
          </button>
        )}

        <button onClick={onOpenSettings}
          className={`flex items-center gap-3.5 rounded-xl text-muted hover:text-foreground hover:bg-surface transition-all w-full
            ${sidebarOpen ? "px-3.5 py-2.5" : "px-0 py-2.5 justify-center"}`}
          aria-label={sidebarOpen ? undefined : "Settings"}
          title="Settings">
          <Settings size={18} />
          {sidebarOpen && <span className="text-sm font-medium">Settings</span>}
        </button>

        <button onClick={onLogout}
          className={`flex items-center gap-3.5 rounded-xl text-danger hover:bg-danger/8 transition-all w-full
            ${sidebarOpen ? "px-3.5 py-2.5" : "px-0 py-2.5 justify-center"}`}
          aria-label={sidebarOpen ? undefined : "Log Out"}
          title="Log Out">
          <LogOut size={18} />
          {sidebarOpen && <span className="text-sm font-medium">Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
