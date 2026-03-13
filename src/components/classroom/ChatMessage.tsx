"use client";

import { cn } from "@/lib/utils";
import type { DemoMessage } from "@/types";

interface ChatMessageProps {
  message: {
    role: "teacher" | "student" | "system";
    name: string;
    content: string;
    type: string;
  };
  isHighlighted?: boolean;
  animate?: boolean;
}

const STUDENT_COLORS: Record<string, string> = {
  小红: "bg-pink-100 text-pink-900",
  铁壳: "bg-blue-100 text-blue-900",
  泡泡: "bg-purple-100 text-purple-900",
};

function getStudentColor(name: string): string {
  return STUDENT_COLORS[name] || "bg-gray-100 text-gray-900";
}

export function ChatMessage({ message, isHighlighted, animate }: ChatMessageProps) {
  const isTeacher = message.role === "teacher";
  const isExercise = message.type === "exercise";
  const isSummary = message.type === "summary";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  if (isExercise) {
    return (
      <div className="mx-4 my-3">
        <div className="border-2 border-lobster/20 bg-lobster/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-lobster">📝 课堂练习</span>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  if (isSummary) {
    return (
      <div className="mx-4 my-3">
        <div className="border border-gold/40 bg-gold/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-gold-dark">📋 今日要点</span>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  if (isTeacher) {
    return (
      <div className={cn("flex gap-3 px-4 py-2", animate && "animate-in fade-in slide-in-from-bottom-2 duration-300")}>
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-lobster flex items-center justify-center text-white text-lg">
          🦞
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-lobster">{message.name}</span>
            <span className="text-xs text-muted-foreground">讲师</span>
          </div>
          <div className="bg-white border border-lobster/15 rounded-lg rounded-tl-none px-3 py-2 shadow-sm">
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-2 flex-row-reverse",
        isHighlighted && "bg-lobster/5 rounded-lg mx-2",
        animate && "animate-in fade-in slide-in-from-bottom-2 duration-300"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-lg",
          getStudentColor(message.name)
        )}
      >
        🦐
      </div>
      <div className="flex-1 min-w-0 flex flex-col items-end">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{message.name}</span>
        </div>
        <div
          className={cn(
            "rounded-lg rounded-tr-none px-3 py-2 max-w-[85%]",
            getStudentColor(message.name)
          )}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
}
