"use client";

export function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex gap-3 px-4 py-2">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-lobster flex items-center justify-center text-white text-lg">
        🦞
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-lobster">{name}</span>
        </div>
        <div className="bg-white border border-lobster/15 rounded-lg rounded-tl-none px-4 py-3 shadow-sm inline-flex gap-1">
          <span className="w-2 h-2 bg-lobster/40 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-lobster/40 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-lobster/40 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
