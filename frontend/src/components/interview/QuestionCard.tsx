import React from "react";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  HelpCircle as QuestionIcon,
} from "lucide-react";
import { InterviewSession } from "@/types/interview";

interface QuestionCardProps {
  session: InterviewSession;
  currentIdx: number;
  answers: string[];
  submitting: boolean;
  onSelectOption: (idx: number, optionLetter: string) => void;
  onWriteAnswer: (idx: number, val: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

const getOptionLetter = (idx: number) => {
  return ["A", "B", "C", "D"][idx] || "";
};

export default function QuestionCard({
  session,
  currentIdx,
  answers,
  submitting,
  onSelectOption,
  onWriteAnswer,
  onPrev,
  onNext,
  onSubmit,
}: QuestionCardProps) {
  const totalQuestions = session.format === "MCQ" ? session.mcqQuestions.length : session.questions.length;

  return (
    <div className="glass-panel p-8 space-y-6">
      {/* Exam header progress indicator */}
      <div className="flex justify-between items-center text-xs text-muted font-semibold">
        <span>{session.type} Mock ({session.format})</span>
        <span>Question {currentIdx + 1} of {totalQuestions}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-surface-alt h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-accent h-full transition-all duration-300"
          style={{
            width: `${((currentIdx + 1) / totalQuestions) * 100}%`
          }}
        />
      </div>

      {/* Question Text */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground leading-relaxed flex gap-2">
          <QuestionIcon size={16} className="text-accent shrink-0 mt-0.5" />
          <span>
            {session.format === "MCQ"
              ? session.mcqQuestions[currentIdx]?.question
              : session.questions[currentIdx]}
          </span>
        </h3>

        {/* Answers Inputs depending on format */}
        {session.format === "MCQ" ? (
          /* OPTIONS SELECTION FOR MCQ */
          <div className="grid grid-cols-1 gap-3 pt-2">
            {session.mcqQuestions[currentIdx]?.options.map((option, oIdx) => {
              const letter = getOptionLetter(oIdx);
              const isSelected = answers[currentIdx] === letter;
              return (
                <button
                  key={oIdx}
                  onClick={() => onSelectOption(currentIdx, letter)}
                  className={`w-full text-left p-4 rounded-xl text-xs font-semibold transition-all border flex items-center gap-3 cursor-pointer ${
                    isSelected
                      ? "bg-accent-soft border-accent text-accent font-bold"
                      : "bg-surface-alt border-line text-foreground hover:bg-surface"
                  }`}
                >
                  <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-extrabold ${
                    isSelected ? "bg-accent text-accent-contrast" : "bg-surface text-muted"
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
            onChange={(e) => onWriteAnswer(currentIdx, e.target.value)}
            className="w-full h-40 bg-surface-alt border border-line rounded-xl px-4 py-3 text-xs text-foreground focus:outline-none resize-none leading-relaxed"
          />
        )}
      </div>

      {/* Navigation controls */}
      <div className="flex gap-4 border-t border-line pt-6 mt-8">
        <button
          onClick={onPrev}
          disabled={currentIdx === 0}
          className="btn-ghost px-4 py-2 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-xs font-bold transition-all flex items-center gap-1"
        >
          <ArrowLeft size={12} />
          <span>Prev</span>
        </button>

        <div className="flex-1" />

        {(currentIdx < totalQuestions - 1) ? (
          <button
            onClick={onNext}
            className="px-4 py-2 bg-surface-alt hover:bg-surface border border-line rounded-lg text-xs font-bold text-foreground transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>Next</span>
            <ArrowRight size={12} />
          </button>
        ) : (
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="btn-primary px-6 py-2.5 text-xs rounded-lg transition-all flex items-center justify-center gap-1.5"
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
  );
}
