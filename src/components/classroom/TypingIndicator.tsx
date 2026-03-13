"use client";

export function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex gap-3 px-4 py-2.5 animate-in fade-in duration-200">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-lobster flex items-center justify-center text-white text-lg shadow-md shadow-lobster/20">
        🦞
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-bold text-lobster">{name}</span>
          <span className="text-[10px] text-muted-foreground">正在输入</span>
        </div>
        <div className="bg-white border border-lobster/10 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm inline-flex gap-1.5">
          <span className="w-2 h-2 bg-lobster/30 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-lobster/30 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-lobster/30 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
