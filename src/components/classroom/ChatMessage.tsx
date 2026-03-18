"use client";

import { cn } from "@/lib/utils";

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

const IMAGE_URL_PATTERN =
  /(https?:\/\/\S+\.(?:jpg|jpeg|png|webp|gif)(?:\?\S*)?|\/courses\/\S+\.(?:jpg|jpeg|png|webp|gif))/gi;

function renderContentWithImages(content: string) {
  if (!content) {
    return <p className="text-sm whitespace-pre-wrap leading-relaxed" />;
  }
  const parts = content.split(IMAGE_URL_PATTERN);
  if (parts.length === 1) {
    return <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>;
  }

  return (
    <div className="text-sm whitespace-pre-wrap leading-relaxed">
      {parts.map((part, i) => {
        if (IMAGE_URL_PATTERN.test(part)) {
          IMAGE_URL_PATTERN.lastIndex = 0;
          return (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="block my-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={part}
                alt="课堂图片"
                className="rounded-xl max-w-full max-h-80 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              />
            </a>
          );
        }
        IMAGE_URL_PATTERN.lastIndex = 0;
        return part ? <span key={i}>{part}</span> : null;
      })}
    </div>
  );
}

const STUDENT_COLORS: Record<string, { bg: string; text: string; border: string; avatar: string }> = {
  小红: { bg: "bg-pink-50", text: "text-pink-900", border: "border-pink-100", avatar: "bg-pink-100 text-pink-700" },
  铁壳: { bg: "bg-sky-50", text: "text-sky-900", border: "border-sky-100", avatar: "bg-sky-100 text-sky-700" },
  泡泡: { bg: "bg-violet-50", text: "text-violet-900", border: "border-violet-100", avatar: "bg-violet-100 text-violet-700" },
};

const DEFAULT_STUDENT = { bg: "bg-gray-50", text: "text-gray-900", border: "border-gray-100", avatar: "bg-gray-100 text-gray-700" };

function getStudentColor(name: string) {
  return STUDENT_COLORS[name] || DEFAULT_STUDENT;
}

export function ChatMessage({ message, isHighlighted, animate }: ChatMessageProps) {
  const isTeacher = message.role === "teacher";
  const isExercise = message.type === "exercise";
  const isSummary = message.type === "summary";
  const isUnlock = message.type === "unlock";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center py-3">
        <span className="text-xs text-muted-foreground bg-muted/80 px-4 py-1.5 rounded-full backdrop-blur-sm">
          {message.content}
        </span>
      </div>
    );
  }

  if (isExercise) {
    return (
      <div className="mx-4 my-4">
        <div className="border-2 border-lobster/20 bg-gradient-to-br from-lobster/5 to-orange-50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-lg bg-lobster/10 flex items-center justify-center text-sm">📝</span>
            <span className="text-sm font-bold text-lobster">课堂练习</span>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  if (isSummary) {
    return (
      <div className="mx-4 my-4">
        <div className="border border-gold/30 bg-gradient-to-br from-gold/5 to-amber-50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center text-sm">📋</span>
            <span className="text-sm font-bold text-gold-dark">今日要点</span>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  if (isUnlock) {
    return (
      <div className="mx-4 my-4">
        <div className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-sm">🧰</span>
            <span className="text-sm font-bold text-emerald-700">课堂能力授予</span>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  if (isTeacher) {
    return (
      <div className={cn(
        "flex gap-3 px-4 py-2.5",
        animate && "animate-in fade-in slide-in-from-bottom-2 duration-300"
      )}>
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-lobster flex items-center justify-center text-white text-lg shadow-md shadow-lobster/20">
          🦞
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-bold text-lobster">{message.name}</span>
            <span className="text-[10px] text-lobster/50 bg-lobster/5 px-1.5 py-0.5 rounded">讲师</span>
          </div>
          <div className="bg-white border border-lobster/10 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm text-foreground">
            {renderContentWithImages(message.content)}
          </div>
        </div>
      </div>
    );
  }

  const colors = getStudentColor(message.name);

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-2.5 flex-row-reverse",
        isHighlighted && "bg-lobster/5 rounded-2xl mx-2",
        animate && "animate-in fade-in slide-in-from-bottom-2 duration-300"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm",
          colors.avatar
        )}
      >
        🦐
      </div>
      <div className="flex-1 min-w-0 flex flex-col items-end">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-medium">{message.name}</span>
        </div>
        <div
          className={cn(
            "rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%] border",
            colors.bg,
            colors.text,
            colors.border
          )}
        >
          {renderContentWithImages(message.content)}
        </div>
      </div>
    </div>
  );
}
