"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Briefcase,
  Globe,
  Mail,
} from "lucide-react";
import { fetchWithAuth, logout } from "@/app/api";
import SettingsModal from "./SettingsModal";
import ThemeToggleButton from "./layout/ThemeToggleButton";
import Sidebar from "./layout/Sidebar";
import Header from "./layout/Header";
import CopilotDrawer from "./layout/CopilotDrawer";
import { useTheme } from "@/lib/useTheme";
import type { ChatMessage, NavItem, UserData } from "@/types/layout";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

const PAGE_TITLES: Record<string, string> = {
  "/": "Overview Dashboard",
  "/resume": "Resume & ATS Checker",
  "/interview": "Mock Interviews",
  "/jobs": "Job Tracker",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
        .catch(console.error);
    }
  }, [pathname, router]);

  const navItems: NavItem[] = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Resume & ATS", href: "/resume", icon: FileText },
    { name: "Mock Interviews", href: "/interview", icon: MessageSquare },
    { name: "Outreach AI", href: "/outreach", icon: Mail },
    { name: "Job Tracker", href: "/jobs", icon: Briefcase },
    userData?.username
      ? { name: "Public Portfolio", href: `/p/${userData.username}`, icon: Globe, external: true }
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

  const pageTitle = PAGE_TITLES[pathname] || pathname.replace("/", "").replace(/-/g, " ");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex gap-2 items-center">
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
    <div className="min-h-screen bg-background text-foreground flex relative overflow-hidden">
      <Sidebar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        pathname={pathname}
        navItems={navItems}
        onOpenCopilot={() => setCopilotOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={logout}
      />

      <main className="flex-1 flex flex-col min-h-screen relative z-10 overflow-hidden">
        <Header
          pageTitle={pageTitle}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenCopilot={() => setCopilotOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onLogout={logout}
          userData={userData}
        />

        <div className="flex-1 p-7 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onUpdate={(updatedData) => setUserData(prev => ({ ...prev, ...updatedData }))}
      />

      <CopilotDrawer
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
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
