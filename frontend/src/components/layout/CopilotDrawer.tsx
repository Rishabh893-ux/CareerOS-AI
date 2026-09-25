"use client";

import React, { useEffect, useRef } from "react";
import { Bot, Send, X, Zap } from "lucide-react";
import type { ChatMessage } from "@/types/layout";

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chatMessages: ChatMessage[];
  chatInput: string;
  onChangeInput: (value: string) => void;
  loadingChat: boolean;
  onSendMessage: (text: string) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

const QUICK_PROMPTS = ["What is my career score?", "Generate my roadmap", "Review my profile gaps"];

export default function CopilotDrawer({
  isOpen,
  onClose,
  chatMessages,
  chatInput,
  onChangeInput,
  loadingChat,
  onSendMessage,
  chatEndRef,
}: CopilotDrawerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Move focus into the drawer on open, close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} aria-hidden />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="copilot-title"
        inert={!isOpen}
        className={`fixed top-0 right-0 h-screen w-full sm:w-96 z-50 flex flex-col
        bg-surface border-l border-line elevated-lg
        transition-all duration-350 transform
        ${isOpen ? "translate-x-0" : "translate-x-full"}`}>

        {/* Copilot Header */}
        <div className="p-5 border-b border-line flex items-center justify-between bg-surface-alt">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent brand-mark flex items-center justify-center">
              <Bot size={18} className="text-accent-contrast" aria-hidden />
            </div>
            <div>
              <h2 id="copilot-title" className="font-bold text-sm">AI Copilot</h2>
              <p className="text-xs text-muted">Answers from your profile, roadmap and resume</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close Copilot"
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface text-muted hover:text-foreground transition-all">
            <X size={16} aria-hidden />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4" role="log" aria-live="polite" aria-label="Conversation">
          {chatMessages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-fade-in-up`}
              style={{ animationDelay: "0ms" }}>
              {msg.sender === "ai" && (
                <div className="w-6 h-6 rounded-lg bg-accent flex items-center justify-center mr-2 mt-1 shrink-0">
                  <Zap size={12} className="text-accent-contrast" aria-hidden />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl p-3.5 text-sm leading-relaxed ${
                msg.sender === "user"
                  ? "bg-accent text-accent-contrast rounded-br-sm"
                  : "bg-surface-alt text-foreground border border-line rounded-bl-sm"
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loadingChat && (
            <div className="flex justify-start items-center gap-2" role="status" aria-label="Copilot is thinking">
              <div className="w-6 h-6 rounded-lg bg-accent flex items-center justify-center shrink-0">
                <Zap size={12} className="text-accent-contrast" aria-hidden />
              </div>
              <div className="bg-surface-alt border border-line rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestions */}
        <div className="px-5 py-3 border-t border-line">
          <p className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-2">Suggestions</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map(sug => (
              <button key={sug} onClick={() => onSendMessage(sug)}
                disabled={loadingChat}
                className="text-xs border border-line hover:border-accent bg-surface-alt hover:bg-accent-soft text-muted hover:text-accent rounded-lg px-2.5 py-1.5 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-line">
          <div className="flex items-center gap-2 bg-surface-alt border border-line rounded-xl px-4 py-2.5 focus-within:border-accent transition-all">
            <input
              ref={inputRef}
              type="text"
              aria-label="Message Copilot"
              placeholder="Ask anything about your career..."
              value={chatInput}
              onChange={(e) => onChangeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loadingChat && onSendMessage(chatInput)}
              className="flex-1 bg-transparent text-sm text-foreground placeholder-muted focus:outline-none"
            />
            <button type="button" onClick={() => onSendMessage(chatInput)} disabled={!chatInput.trim() || loadingChat}
              aria-label="Send message"
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent-soft text-accent hover:bg-accent hover:text-accent-contrast transition-all disabled:opacity-50">
              <Send size={14} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
