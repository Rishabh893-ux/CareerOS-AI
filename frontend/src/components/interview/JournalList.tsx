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
    <div className="glass-panel p-6 lg:col-span-2 flex flex-col min-h-[380px] max-h-[440px]">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
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
                <p className="text-[10px] text-muted">{new Date(s.createdAt).toLocaleDateString()}</p>
                {s.feedback && (
                  <p className="text-[10px] font-semibold text-accent line-clamp-1 mt-1">{s.feedback}</p>
                )}
              </div>
              <button
                onClick={(e) => onDeleteSession(s._id, e)}
                className="text-muted hover:text-danger p-1 rounded hover:bg-surface opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={14} />
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
