"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { InterviewSession } from "@/types/interview";
import SetupForm from "@/components/interview/SetupForm";
import JournalList from "@/components/interview/JournalList";
import QuestionCard from "@/components/interview/QuestionCard";
import ResultsView from "@/components/interview/ResultsView";

export default function InterviewPage() {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null);

  // Setup Form States
  const [type, setType] = useState<"HR" | "Technical">("Technical");
  const [format, setFormat] = useState<"Written" | "MCQ">("MCQ");
  const [topic, setTopic] = useState("");
  const [limit, setLimit] = useState(5);

  // Ongoing Session States
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  // Loading & Error States
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState("");

  const loadSessions = async () => {
    try {
      const data = await fetchWithAuth("/interview");
      setSessions(data);
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message || "Failed to load past sessions."); }
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError("");
    setActiveSession(null);
    setAnswers([]);
    setCurrentIdx(0);

    try {
      const session = await fetchWithAuth("/interview/generate", {
        method: "POST",
        body: JSON.stringify({ type, topic, format, limit }),
      });

      const totalQuestions = format === "MCQ" ? session.mcqQuestions.length : session.questions.length;
      setAnswers(new Array(totalQuestions).fill(""));
      setActiveSession(session);
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message || "Failed to generate interview questions."); }
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectOption = (idx: number, optionLetter: string) => {
    setAnswers(prev => {
      const next = [...prev];
      next[idx] = optionLetter;
      return next;
    });
  };

  const handleWriteAnswer = (idx: number, val: string) => {
    setAnswers(prev => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const handleSubmitInterview = async () => {
    if (!activeSession) return;
    setSubmitting(true);
    setError("");

    try {
      const result = await fetchWithAuth(`/interview/${activeSession._id}/feedback`, {
        method: "POST",
        body: JSON.stringify({ answers }),
      });
      setActiveSession(result);
      loadSessions(); // refresh history list
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message || "Failed to submit answers."); }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this interview session and its feedback? This can’t be undone.")) return;
    setError("");
    // Optimistic UI update
    setSessions(prev => prev.filter(s => s._id !== id));
    try {
      await fetchWithAuth(`/interview/${id}`, { method: "DELETE" });
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message || "Failed to delete session."); }
      loadSessions();
    }
  };

  const handleSelectSession = (s: InterviewSession) => {
    setAnswers(s.userAnswers || []);
    setActiveSession(s);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!activeSession ? (
        /* SETUP PORTAL AND HISTORY */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <SetupForm
            type={type}
            format={format}
            topic={topic}
            limit={limit}
            generating={generating}
            onTypeChange={setType}
            onFormatChange={setFormat}
            onTopicChange={setTopic}
            onLimitChange={setLimit}
            onSubmit={handleStartSession}
          />

          <JournalList
            sessions={sessions}
            onSelectSession={handleSelectSession}
            onDeleteSession={handleDeleteSession}
          />

        </div>
      ) : (
        /* LIVE ONGOING SESSION PANEL / FEEDBACK RESULTS SCREEN */
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Back button */}
          <button
            onClick={() => {
              setActiveSession(null);
              loadSessions();
            }}
            className="btn-ghost px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
          >
            <ArrowLeft size={12} />
            <span>Return to Setup</span>
          </button>

          {activeSession.feedback ? (
            <ResultsView session={activeSession} />
          ) : (
            <QuestionCard
              session={activeSession}
              currentIdx={currentIdx}
              answers={answers}
              submitting={submitting}
              onSelectOption={handleSelectOption}
              onWriteAnswer={handleWriteAnswer}
              onPrev={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              onNext={() => setCurrentIdx(prev => prev + 1)}
              onSubmit={handleSubmitInterview}
            />
          )}

        </div>
      )}

    </div>
  );
}
