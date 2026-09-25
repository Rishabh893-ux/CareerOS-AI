"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Briefcase,
  Globe,
  Mail,
} from "lucide-react";
import { fetchWithAuth, logout } from "@/lib/api";
import SettingsModal from "./SettingsModal";
import ThemeToggleButton from "./layout/ThemeToggleButton";
import Sidebar from "./layout/Sidebar";
import Header from "./layout/Header";
import CopilotDrawer from "./layout/CopilotDrawer";
import { useTheme } from "@/lib/useTheme";
import type { ChatMessage, NavItem, UserData } from "@/types/layout";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

// Title + one line on what the page is for, shown in the header.
const PAGES: Record<string, { title: string; description: string }> = {
  "/": { title: "Dashboard", description: "Your career score, skills and growth plan at a glance" },
  "/resume": { title: "Resume & ATS", description: "Parse your resume and check it against real job descriptions" },
  "/resume/builder": { title: "Resume Builder", description: "Build an ATS-friendly resume from your profile" },
  "/interview": { title: "Mock Interviews", description: "Practice technical and HR rounds with AI feedback" },
  "/outreach": { title: "Outreach AI", description: "Draft personalized outreach and research companies" },
  "/jobs": { title: "Job Tracker", description: "Find openings and track every application in one place" },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Below the md breakpoint the sidebar is a drawer; track the breakpoint to know which
  const [isMobile, setIsMobile] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => { setIsMobile(media.matches); if (!media.matches) setMobileNavOpen(false); };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileNavOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileNavOpen]);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userData, setUserData] = useState<UserData>({});
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: "ai", text: "Hello! I'm your CareerOS AI Copilot. Ask me anything about your roadmap, skill gaps, or interview readiness." }
  ]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const closeCopilot = useCallback(() => setCopilotOpen(false), []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/p/")) { setIsAuthenticated(true); return; }
    if (!token) { router.push("/login"); } else {
      setIsAuthenticated(true);
      fetchWithAuth("/auth/me", { method: "GET" })
        .then(data => setUserData(data))
        .catch((err: unknown) => {
          // Token is validly signed but its account no longer exists (e.g. the
          // database was reset) — every other request would 404, so sign out.
          if (err instanceof Error && err.message === "User not found") logout();
          else console.error(err);
        });
    }
  }, [pathname, router]);

  const navItems: NavItem[] = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Resume & ATS", href: "/resume", icon: FileText },
    { name: "Mock Interviews", href: "/interview", icon: MessageSquare },
    { name: "Outreach AI", href: "/outreach", icon: Mail },
    { name: "Job Tracker", href: "/jobs", icon: Briefcase },
    // The public route accepts a username or the account id, so the link
    // works before a username is chosen; the username just makes it prettier.
    userData?.username || userData?._id
      ? { name: "Public Portfolio", href: `/p/${userData.username || userData._id}`, icon: Globe, external: true }
      : {
          name: "Public Portfolio",
          href: "/p",
          icon: Globe,
          onClick: (e) => { e.preventDefault(); setSettingsOpen(true); },
        },
  ];

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    setChatMessages(prev => [...prev, { sender: "user", text }]);
    setChatInput("");
    setLoadingChat(true);
    try {
      const data = await fetchWithAuth("/copilot/ask", { method: "POST", body: JSON.stringify({ question: text }) });
      setChatMessages(prev => [...prev, { sender: "ai", text: data.answer }]);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setChatMessages(prev => [...prev, { sender: "ai", text: `Error: ${err.message || "Could not reach Copilot"}` }]);
      }
    } finally {
      setLoadingChat(false);
    }
  };

  const page = PAGES[pathname] || { title: pathname.replace("/", "").replace(/-/g, " "), description: "" };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex gap-2 items-center" role="status" aria-label="Loading">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-full bg-accent animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/p/")) {
    return (
      <div className="min-h-screen flex flex-col relative">
        <ThemeToggleButton theme={theme} onToggle={toggleTheme} className="fixed top-5 right-5 z-50 bg-surface border border-line" />
        {children}
      </div>
    );
  }

  return (
    <div className="h-dvh bg-background text-foreground flex relative overflow-hidden">
      {mobileNavOpen && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setMobileNavOpen(false)} aria-hidden />}
      <Sidebar
        sidebarOpen={sidebarOpen || isMobile}
        mobileOpen={mobileNavOpen}
        isMobile={isMobile}
        onCloseMobile={() => setMobileNavOpen(false)}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        pathname={pathname}
        navItems={navItems}
        onOpenCopilot={() => setCopilotOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={logout}
      />

      <main className="flex-1 min-w-0 flex flex-col min-h-0 relative z-10 overflow-hidden">
        <Header
          pageTitle={page.title}
          pageDescription={page.description}
          onOpenNav={() => setMobileNavOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenCopilot={() => setCopilotOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onLogout={logout}
          userData={userData}
        />

        {/* Scroll area spans the full width so the scrollbar sits at the window edge */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </div>
      </main>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onUpdate={(updatedData) => setUserData(prev => ({ ...prev, ...updatedData }))}
      />

      <CopilotDrawer
        isOpen={copilotOpen}
        onClose={closeCopilot}
        chatMessages={chatMessages}
        chatInput={chatInput}
        onChangeInput={setChatInput}
        loadingChat={loadingChat}
        onSendMessage={handleSendMessage}
        chatEndRef={chatEndRef}
      />
    </div>
  );
}
