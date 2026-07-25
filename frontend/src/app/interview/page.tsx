"use client";

import React, { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Sparkles, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Trash2, 
  RefreshCw, 
  AlertCircle,
  HelpCircle as QuestionIcon
} from "lucide-react";
import { fetchWithAuth } from "@/app/api";

interface McqQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface InterviewSession {
  _id: string;
  type: "HR" | "Technical";
  format: "Written" | "MCQ";
  topic?: string;
  questions: string[];
  mcqQuestions: McqQuestion[];
  userAnswers?: string[];
  feedback?: string;
  improvementAreas?: string[];
  createdAt: string;
}

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

  const getOptionLetter = (idx: number) => {
    return ["A", "B", "C", "D"][idx] || "";
  };

  return (
    <div className="space-y-8 pb-12">
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!activeSession ? (
        /* SETUP PORTAL AND HISTORY */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Setup Form */}
          <div className="glass-panel p-6 lg:col-span-1 h-fit">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
              <MessageSquare size={18} className="text-blue-400 animate-float" />
              <span>Configure Mock Board</span>
            </h3>
            <form onSubmit={handleStartSession} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interview Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Technical", "HR"].map(t => (
                    <button 
                      key={t}
                      type="button"
                      onClick={() => setType(t as any)}
                      className={`py-2 rounded-xl text-xs font-semibold cursor-pointer border ${
                        type === t 
                          ? "bg-blue-600/10 border-blue-500 text-blue-400 font-bold"
                          : "border-white/5 bg-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {type === "Technical" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Technical Topic</label>
                  <input 
                    type="text" 
                    placeholder="e.g. DBMS, React Hooks, Python..." 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                    required={type === "Technical"}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Answering Format</label>
                <div className="grid grid-cols-2 gap-2">
                  {["MCQ", "Written"].map(f => (
                    <button 
                      key={f}
                      type="button"
                      onClick={() => setFormat(f as any)}
                      className={`py-2 rounded-xl text-xs font-semibold cursor-pointer border ${
                        format === f 
                          ? "bg-purple-600/10 border-purple-500 text-purple-400 font-bold"
                          : "border-white/5 bg-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Question Count</label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 20].map(c => (
                    <button 
                      key={c}
                      type="button"
                      onClick={() => setLimit(c)}
                      className={`py-2 rounded-xl text-xs font-semibold cursor-pointer border ${
                        limit === c 
                          ? "bg-emerald-600/10 border-emerald-500 text-emerald-400 font-bold"
                          : "border-white/5 bg-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {c} Qs
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                disabled={generating}
                className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 animate-pulse-glow"
              >
                {generating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Analyzing Prompt...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Launch Interview</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* History / Journal Panel */}
          <div className="glass-panel p-6 lg:col-span-2 flex flex-col min-h-[380px] max-h-[440px]">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Interview Journal ({sessions.length})
            </h3>

            {sessions.length > 0 ? (
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {sessions.map(s => (
                  <div 
                    key={s._id} 
                    onClick={() => {
                      setAnswers(s.userAnswers || []);
                      setActiveSession(s);
                    }}
                    className="p-4 bg-white/5 border border-white/5 rounded-xl hover:border-white/10 transition-all flex justify-between items-center cursor-pointer group"
                  >
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white leading-snug">
                        {s.type} {s.format} Test {s.topic ? `on ${s.topic}` : ""}
                      </h4>
                      <p className="text-[10px] text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</p>
                      {s.feedback && (
                        <p className="text-[10px] font-semibold text-blue-400 line-clamp-1 mt-1">{s.feedback}</p>
                      )}
                    </div>
                    <button 
                      onClick={(e) => handleDeleteSession(s._id, e)}
                      className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center border border-white/5 border-dashed rounded-xl text-center py-12">
                <MessageSquare size={28} className="text-slate-600 mb-2" />
                <p className="text-xs text-slate-400">Your mock journal logs will be saved here.</p>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* LIVE ONGOING SESSION PANEL / FEEDBACK RESULTS SCREEN */
        <div className="max-w-2xl mx-auto space-y-8">
          
          {/* Back button */}
          <button 
            onClick={() => {
              setActiveSession(null);
              loadSessions();
            }}
            className="px-4 py-2 border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1"
          >
            <ArrowLeft size={12} />
            <span>Return to Setup</span>
          </button>

          {activeSession.feedback ? (
            /* RESULTS SCREEN */
            <div className="glass-panel p-8 space-y-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <CheckCircle2 size={22} className="text-emerald-400" />
                <span>Evaluation Results</span>
              </h2>

              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 text-slate-200">
                <p className="text-sm font-semibold">{activeSession.feedback}</p>
              </div>

              {activeSession.improvementAreas && activeSession.improvementAreas.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Review Insights</h4>
                  <ul className="space-y-2">
                    {activeSession.improvementAreas.map((area, idx) => (
                      <li key={idx} className="text-xs text-slate-300 bg-white/5 border border-white/5 p-3 rounded-xl leading-relaxed">
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            /* ACTIVE EXAM RUN */
            <div className="glass-panel p-8 space-y-6">
              {/* Exam header progress indicator */}
              <div className="flex justify-between items-center text-xs text-slate-400 font-semibold">
                <span>{activeSession.type} Mock ({activeSession.format})</span>
                <span>Question {currentIdx + 1} of {activeSession.format === "MCQ" ? activeSession.mcqQuestions.length : activeSession.questions.length}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300"
                  style={{ 
                    width: `${((currentIdx + 1) / (activeSession.format === "MCQ" ? activeSession.mcqQuestions.length : activeSession.questions.length)) * 100}%` 
                  }}
                />
              </div>

              {/* Question Text */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white leading-relaxed flex gap-2">
                  <QuestionIcon size={16} className="text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    {activeSession.format === "MCQ" 
                      ? activeSession.mcqQuestions[currentIdx]?.question 
                      : activeSession.questions[currentIdx]}
                  </span>
                </h3>

                {/* Answers Inputs depending on format */}
                {activeSession.format === "MCQ" ? (
                  /* OPTIONS SELECTION FOR MCQ */
                  <div className="grid grid-cols-1 gap-3 pt-2">
                    {activeSession.mcqQuestions[currentIdx]?.options.map((option, oIdx) => {
                      const letter = getOptionLetter(oIdx);
                      const isSelected = answers[currentIdx] === letter;
                      return (
                        <button 
                          key={oIdx}
                          onClick={() => handleSelectOption(currentIdx, letter)}
                          className={`w-full text-left p-4 rounded-xl text-xs font-semibold transition-all border flex items-center gap-3 cursor-pointer ${
                            isSelected 
                              ? "bg-purple-600/10 border-purple-500 text-purple-400 font-bold"
                              : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-extrabold ${
                            isSelected ? "bg-purple-500 text-white" : "bg-white/10 text-slate-400"
                          }`}>
                            {letter}
                          </span>
                          <span>{option}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* TEXT AREA INPUT FOR WRITTEN */
                  <textarea 
                    placeholder="Type your answer here..."
                    value={answers[currentIdx] || ""}
                    onChange={(e) => handleWriteAnswer(currentIdx, e.target.value)}
                    className="w-full h-40 bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none resize-none leading-relaxed"
                  />
                )}
              </div>

              {/* Navigation controls */}
              <div className="flex gap-4 border-t border-white/5 pt-6 mt-8">
                <button 
                  onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                  disabled={currentIdx === 0}
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-xs font-bold text-slate-300 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft size={12} />
                  <span>Prev</span>
                </button>

                <div className="flex-1" />

                {(currentIdx < (activeSession.format === "MCQ" ? activeSession.mcqQuestions.length : activeSession.questions.length) - 1) ? (
                  <button 
                    onClick={() => setCurrentIdx(prev => prev + 1)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ArrowRight size={12} />
                  </button>
                ) : (
                  <button 
                    onClick={handleSubmitInterview}
                    disabled={submitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        <span>Grading Exam...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={12} />
                        <span>Submit Exam</span>
                      </>
                    )}
                  </button>
                )}
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
