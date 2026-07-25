"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Briefcase,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Bot,
  Send,
  X,
  Zap,
  Settings,
  Globe,
  ExternalLink,
  Mail
} from "lucide-react";
import { fetchWithAuth, logout } from "@/app/api";
import SettingsModal from "./SettingsModal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userData, setUserData] = useState<{name?: string, username?: string}>({});
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "Hello! I'm your CareerOS AI Copilot. Ask me anything about your roadmap, skill gaps, or interview readiness." }
  ]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    const publicPaths = ["/login", "/register"];
    const token = localStorage.getItem("token");
    if (publicPaths.includes(pathname)) { setIsAuthenticated(true); return; }
    if (!token) { router.push("/login"); } else { 
      setIsAuthenticated(true);
      fetchWithAuth("/auth/me", { method: "GET" })
        .then(data => setUserData(data))
        .catch(console.error);
    }
  }, [pathname, router]);

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, color: "text-blue-400", activeBg: "from-blue-600/15 to-blue-600/5", activeBorder: "border-blue-500" },
    { name: "Resume & ATS", href: "/resume", icon: FileText, color: "text-emerald-400", activeBg: "from-emerald-600/15 to-emerald-600/5", activeBorder: "border-emerald-500" },
    { name: "Mock Interviews", href: "/interview", icon: MessageSquare, color: "text-purple-400", activeBg: "from-purple-600/15 to-purple-600/5", activeBorder: "border-purple-500" },
    { name: "Outreach AI", href: "/outreach", icon: Mail, color: "text-indigo-400", activeBg: "from-indigo-600/15 to-indigo-600/5", activeBorder: "border-indigo-500" },
    { name: "Job Tracker", href: "/jobs", icon: Briefcase, color: "text-amber-400", activeBg: "from-amber-600/15 to-amber-600/5", activeBorder: "border-amber-500" },
    { name: "Public Portfolio", href: `/p/${userData?.username || (userData as any)?._id || (userData as any)?.id || ""}`, icon: Globe, color: "text-pink-400", activeBg: "from-pink-600/15 to-pink-600/5", activeBorder: "border-pink-500", external: true },
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

  const pageTitle = () => {
    const map: Record<string, string> = {
      "/": "Overview Dashboard",
      "/resume": "Resume & ATS Checker",
      "/interview": "Mock Interviews",
      "/jobs": "Job Tracker",
    };
    return map[pathname] || pathname.replace("/", "").replace(/-/g, " ");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#07080b] flex items-center justify-center">
        <div className="flex gap-2 items-center">
          {["bg-blue-500", "bg-purple-500", "bg-emerald-500"].map((c, i) => (
            <div key={i} className={`w-2.5 h-2.5 ${c} rounded-full animate-bounce`}
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (["/login", "/register"].includes(pathname) || pathname.startsWith("/p/")) {
    return <div className="min-h-screen flex flex-col">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex relative overflow-hidden">
      {/* Background glows */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] rounded-full bg-blue-600/4 blur-[140px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-purple-600/4 blur-[140px] pointer-events-none translate-x-1/3 translate-y-1/3" />

      {/* ── SIDEBAR ── */}
      <aside className={`relative z-30 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out
        bg-[rgba(10,14,25,0.85)] backdrop-blur-xl border-r border-white/6
        ${sidebarOpen ? "w-64" : "w-[76px]"}`}>

        {/* Logo */}
        <div className={`h-16 flex items-center border-b border-white/5 px-4 gap-3`}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30 shrink-0 text-sm">
            C
          </div>
          {sidebarOpen && (
            <div className="flex-1 overflow-hidden">
              <span className="font-bold text-base bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent truncate block">
                CareerOS AI
              </span>
              <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-widest">Intelligence Suite</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-all shrink-0">
            {sidebarOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
          </button>
        </div>

        {/* Section label */}
        {sidebarOpen && (
          <div className="px-5 pt-5 pb-2">
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.12em]">Navigation</p>
          </div>
        )}

        {/* Nav Items */}
        <nav className={`flex-1 ${sidebarOpen ? "px-3" : "px-2.5"} space-y-1 py-2`}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} target={(item as any).external ? "_blank" : undefined} rel={(item as any).external ? "noreferrer" : undefined}
                className={`flex items-center gap-3.5 rounded-xl transition-all duration-200 group relative
                  ${sidebarOpen ? "px-4 py-3" : "px-0 py-3 justify-center"}
                  ${isActive
                    ? `bg-gradient-to-r ${item.activeBg} border-l-[3px] ${item.activeBorder} ${item.color}`
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border-l-[3px] border-transparent"
                  }`}>
                <div className={`transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"} ${isActive ? item.color : "text-slate-500 group-hover:text-slate-300"}`}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                {sidebarOpen && (
                  <span className={`font-semibold text-sm truncate flex-1 flex items-center justify-between`}>
                    {item.name}
                    {(item as any).external && <ExternalLink size={14} className="text-slate-500 opacity-50 group-hover:opacity-100 transition-opacity" />}
                  </span>
                )}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl border border-white/10 z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Copilot CTA + Settings + Logout */}
        <div className="p-3 border-t border-white/5 space-y-2">
          {sidebarOpen ? (
            <button onClick={() => setCopilotOpen(true)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-xs hover:shadow-xl hover:shadow-blue-500/25 transition-all cursor-pointer">
              <Bot size={15} />
              <span>Ask AI Copilot</span>
            </button>
          ) : (
            <button onClick={() => setCopilotOpen(true)}
              className="w-full flex items-center justify-center py-2.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 transition-all cursor-pointer"
              title="AI Copilot">
              <Bot size={18} />
            </button>
          )}

          <button onClick={() => setSettingsOpen(true)}
            className={`flex items-center gap-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all w-full
              ${sidebarOpen ? "px-3.5 py-2.5" : "px-0 py-2.5 justify-center"}`}
            title="Settings">
            <Settings size={18} />
            {sidebarOpen && <span className="text-sm font-medium">Settings</span>}
          </button>

          <button onClick={logout}
            className={`flex items-center gap-3.5 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/8 transition-all w-full
              ${sidebarOpen ? "px-3.5 py-2.5" : "px-0 py-2.5 justify-center"}`}
            title="Logout">
            <LogOut size={18} />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col min-h-screen relative z-10 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 shrink-0 flex items-center justify-between px-7 border-b border-white/5 bg-[rgba(7,8,11,0.6)] backdrop-blur-xl">
          <div>
            <h1 className="text-base font-bold text-white capitalize">{pageTitle()}</h1>
            <p className="text-[10px] text-slate-500">CareerOS AI · Intelligence Suite</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setCopilotOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-blue-500/25 hover:border-blue-500/50 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400 text-xs font-semibold transition-all cursor-pointer">
              <Sparkles size={13} />
              <span>Copilot AI</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-500/20">
                {userData.name ? userData.name.charAt(0).toUpperCase() : "U"}
              </div>
              <button onClick={logout} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors ml-1" title="Sign Out">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-7 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>

      {/* ── SETTINGS MODAL ── */}
      <SettingsModal 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
        onUpdate={(updatedData) => setUserData(prev => ({ ...prev, ...updatedData }))}
      />

      {/* ── COPILOT DRAWER ── */}
      {/* Backdrop */}
      {copilotOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setCopilotOpen(false)} />
      )}

      <div className={`fixed top-0 right-0 h-screen w-96 z-50 flex flex-col
        bg-[rgba(10,14,25,0.95)] backdrop-blur-xl border-l border-white/8
        shadow-2xl shadow-black/50 transition-all duration-350 transform
        ${copilotOpen ? "translate-x-0" : "translate-x-full"}`}>

        {/* Copilot Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-600/5 to-purple-600/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">AI Copilot</h3>
              <p className="text-[10px] text-slate-400">Context-Aware Career Guide</p>
            </div>
          </div>
          <button onClick={() => setCopilotOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/8 text-slate-400 hover:text-white transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {chatMessages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-fade-in-up`}
              style={{ animationDelay: "0ms" }}>
              {msg.sender === "ai" && (
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center mr-2 mt-1 shrink-0">
                  <Zap size={12} className="text-white" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl p-3.5 text-sm leading-relaxed ${
                msg.sender === "user"
                  ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-br-sm shadow-lg shadow-blue-500/20"
                  : "bg-white/5 text-slate-200 border border-white/7 rounded-bl-sm"
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loadingChat && (
            <div className="flex justify-start items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shrink-0">
                <Zap size={12} className="text-white" />
              </div>
              <div className="bg-white/5 border border-white/7 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                {["bg-blue-500", "bg-purple-500", "bg-emerald-500"].map((c, i) => (
                  <span key={i} className={`w-1.5 h-1.5 ${c} rounded-full animate-bounce`}
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestions */}
        <div className="px-5 py-3 border-t border-white/5">
          <p className="text-[9px] text-slate-600 font-semibold uppercase tracking-wider mb-2">Quick Prompts</p>
          <div className="flex flex-wrap gap-1.5">
            {["What is my career score?", "Generate my roadmap", "Review my profile gaps"].map(sug => (
              <button key={sug} onClick={() => handleSendMessage(sug)}
                className="text-[10px] border border-white/8 hover:border-blue-500/40 bg-white/4 hover:bg-blue-500/8 text-slate-400 hover:text-blue-300 rounded-lg px-2.5 py-1 cursor-pointer transition-all">
                {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 focus-within:border-blue-500/50 focus-within:bg-blue-500/4 transition-all">
            <input
              type="text"
              placeholder="Ask anything about your career..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage(chatInput)}
              className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-600 focus:outline-none"
              disabled={loadingChat}
            />
            <button onClick={() => handleSendMessage(chatInput)} disabled={!chatInput.trim() || loadingChat}
              className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50">
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
