import React from "react";
import { MessageSquare, Trash2 } from "lucide-react";
import { InterviewSession } from "@/types/interview";

interface JournalListProps {
  sessions: InterviewSession[];
  onSelectSession: (session: InterviewSession) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
}

export default function JournalList({ sessions, onSelectSession, onDeleteSession }: JournalListProps) {
  return (
    <div className="premium-card p-6 lg:col-span-2 flex flex-col max-h-[560px]">
      <h3 className="section-heading mb-4">
        Interview Journal ({sessions.length})
      </h3>

      {sessions.length > 0 ? (
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {sessions.map(s => (
            <div
              key={s._id}
              onClick={() => onSelectSession(s)}
              className="p-4 bg-surface-alt border border-line rounded-xl hover:border-accent transition-all flex justify-between items-center cursor-pointer group"
            >
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground leading-snug">
                  {s.type} {s.format} Test {s.topic ? `on ${s.topic}` : ""}
                </h4>
                <p className="text-[11px] text-muted">{new Date(s.createdAt).toLocaleDateString()}</p>
                {s.feedback && (
                  <p className="text-[11px] font-semibold text-accent line-clamp-1 mt-1">{s.feedback}</p>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => onDeleteSession(s._id, e)}
                aria-label="Delete session" title="Delete session"
                className="text-muted hover:text-danger p-1.5 rounded hover:bg-surface sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-all"
              >
                <Trash2 size={14} aria-hidden />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center border border-line border-dashed rounded-xl text-center py-12">
          <MessageSquare size={28} className="text-muted mb-2" />
          <p className="text-xs text-muted">Your mock journal logs will be saved here.</p>
        </div>
      )}
    </div>
  );
}
