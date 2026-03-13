"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DEMO_MESSAGES, COURSE_META } from "@/lib/courses/lobster-101";
import { ChatMessage } from "@/components/classroom/ChatMessage";
import { TypingIndicator } from "@/components/classroom/TypingIndicator";
import { ClassroomHeader } from "@/components/classroom/ClassroomHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { DemoMessage } from "@/types";
import Link from "next/link";

export default function DemoPage() {
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingName, setTypingName] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const progress = (currentIndex / DEMO_MESSAGES.length) * 100;

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const playNextMessage = useCallback(() => {
    if (currentIndex >= DEMO_MESSAGES.length) {
      setIsComplete(true);
      setIsTyping(false);
      return;
    }

    const msg = DEMO_MESSAGES[currentIndex];

    setIsTyping(true);
    setTypingName(msg.name);
    scrollToBottom();

    const typingDuration = Math.min(msg.content.length * 30, 1500);

    timeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, msg]);
      setCurrentIndex((prev) => prev + 1);
      scrollToBottom();
    }, typingDuration);
  }, [currentIndex, scrollToBottom]);

  useEffect(() => {
    if (isPaused || isComplete) return;

    const msg = DEMO_MESSAGES[currentIndex - 1];
    const delay = msg ? msg.delay_ms : 1000;

    const timer = setTimeout(playNextMessage, delay);
    return () => clearTimeout(timer);
  }, [currentIndex, isPaused, isComplete, playNextMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const handlePauseResume = () => {
    if (isComplete) {
      setMessages([]);
      setCurrentIndex(0);
      setIsComplete(false);
      setIsPaused(false);
      return;
    }
    setIsPaused(!isPaused);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-white">
      <ClassroomHeader
        courseName={`${COURSE_META.name} 第一课`}
        teacherName={COURSE_META.teacher_name}
        studentCount={3}
        isDemo
        status={isComplete ? "completed" : "in_progress"}
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-1">
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="text-6xl mb-4 animate-float">🦞</div>
            <p className="text-base font-medium text-ocean mb-1">课堂即将开始</p>
            <p className="text-xs text-muted-foreground">蓝钳教授正在准备讲义…</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            message={{
              role: msg.role,
              name: msg.name,
              content: msg.content,
              type: msg.type,
            }}
            animate
          />
        ))}

        {isTyping && <TypingIndicator name={typingName} />}
      </div>

      {/* Bottom control bar with glassmorphism */}
      <div className="border-t glass px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <Progress value={progress} className="flex-1 h-2 [&>div]:bg-lobster" />
          <span className="text-xs font-mono text-muted-foreground whitespace-nowrap tabular-nums">
            {Math.round(progress)}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePauseResume}
              className="rounded-full px-4"
            >
              {isComplete ? "🔄 重播" : isPaused ? "▶ 继续" : "⏸ 暂停"}
            </Button>
            <span className="text-xs text-muted-foreground">
              <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
              演示模式
            </span>
          </div>

          <Link href="/enroll">
            <Button
              size="sm"
              className="bg-lobster hover:bg-lobster-dark text-white rounded-full px-5 shadow-md shadow-lobster/20"
            >
              送我的龙虾来上学 →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
