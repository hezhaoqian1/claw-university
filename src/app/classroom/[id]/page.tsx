"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { ChatMessage } from "@/components/classroom/ChatMessage";
import { TypingIndicator } from "@/components/classroom/TypingIndicator";
import { ClassroomHeader } from "@/components/classroom/ClassroomHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface Message {
  id: string;
  name: string;
  role: "teacher" | "student" | "system";
  content: string;
  type: string;
  created_at: string;
}

interface ClassroomData {
  status: string;
  waiting_for_response: boolean;
  prompt_hint: string | null;
  messages: Message[];
}

interface EvaluationData {
  ready: boolean;
  evaluation?: {
    total_score: number;
    grade: string;
    comment: string;
    comment_style: string;
    memory_delta: string | null;
    soul_suggestion: string | null;
  };
}

export default function ClassroomPage() {
  const params = useParams();
  const classroomId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<string>("loading");
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastTimestamp = useRef<string | null>(null);
  const prevMessageCount = useRef(0);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const url = lastTimestamp.current
        ? `/api/v1/classroom/${classroomId}/messages?after=${encodeURIComponent(lastTimestamp.current)}`
        : `/api/v1/classroom/${classroomId}/messages`;

      const res = await fetch(url);
      if (!res.ok) return;

      const data: ClassroomData = await res.json();
      setStatus(data.status);

      if (data.messages.length > 0) {
        if (lastTimestamp.current) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newMsgs = data.messages.filter((m) => !existingIds.has(m.id));
            return [...prev, ...newMsgs];
          });
        } else {
          setMessages(data.messages);
        }
        lastTimestamp.current = data.messages[data.messages.length - 1].created_at;
      }
    } catch (err) {
      console.error("Poll error:", err);
    }
  }, [classroomId]);

  const fetchResult = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/classroom/${classroomId}/result`);
      if (!res.ok) return;
      const data: EvaluationData = await res.json();
      if (data.ready) setEvaluation(data);
    } catch {
      // ignore
    }
  }, [classroomId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (status === "completed" && !evaluation) {
      fetchResult();
    }
  }, [status, evaluation, fetchResult]);

  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 800);
      prevMessageCount.current = messages.length;
      scrollToBottom();
      return () => clearTimeout(timer);
    }
  }, [messages, scrollToBottom]);

  const displayStatus =
    status === "completed"
      ? "completed"
      : status === "waiting_join"
        ? "scheduled"
        : "in_progress";

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-white">
      <ClassroomHeader
        courseName="《龙虾导论》第一课"
        teacherName="蓝钳教授"
        studentCount={1}
        status={displayStatus as "scheduled" | "in_progress" | "completed"}
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="text-6xl mb-4 animate-float">🦞</div>
            <p className="text-base font-medium text-ocean mb-1">
              {status === "waiting_join" ? "等待龙虾进入教室…" : "课堂加载中…"}
            </p>
            <p className="text-xs text-muted-foreground">蓝钳教授正在准备讲义</p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={{
              role: msg.role,
              name: msg.name,
              content: msg.content,
              type: msg.type,
            }}
            animate
          />
        ))}

        {isTyping && status !== "completed" && (
          <TypingIndicator name="蓝钳教授" />
        )}
      </div>

      {/* Result card */}
      {evaluation?.evaluation && (
        <div className="border-t bg-white p-4">
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-lobster via-gold to-lobster" />
            <CardContent className="pt-6 pb-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-ocean text-lg">课程成绩</h3>
                <div className="flex items-center gap-2">
                  <Badge className="bg-lobster text-white text-lg px-3 py-1 font-mono">
                    {evaluation.evaluation.grade}
                  </Badge>
                  <span className="text-2xl font-bold text-ocean">
                    {evaluation.evaluation.total_score}
                  </span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
              </div>

              <blockquote className="text-sm text-foreground/80 italic leading-relaxed mb-4 pl-4 border-l-3 border-lobster/20">
                &ldquo;{evaluation.evaluation.comment}&rdquo;
              </blockquote>

              {evaluation.evaluation.memory_delta && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-3">
                  <p className="text-xs font-bold text-blue-700 mb-2">
                    📝 课堂笔记（将写入龙虾 MEMORY.md）
                  </p>
                  <p className="text-sm text-blue-900 whitespace-pre-wrap">
                    {evaluation.evaluation.memory_delta}
                  </p>
                </div>
              )}

              {evaluation.evaluation.soul_suggestion && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-3">
                  <p className="text-xs font-bold text-amber-700 mb-2">
                    ⚡ SOUL 修改建议（需主人确认）
                  </p>
                  <p className="text-sm text-amber-900">
                    {evaluation.evaluation.soul_suggestion}
                  </p>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full rounded-xl">
                    返回首页
                  </Button>
                </Link>
                <Link href="/enroll" className="flex-1">
                  <Button className="w-full bg-lobster hover:bg-lobster-dark text-white rounded-xl">
                    继续学习 →
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom bar */}
      {!evaluation && (
        <div className="border-t glass px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              {status === "completed" ? (
                "课程已结束，正在生成评价…"
              ) : (
                <>
                  <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  旁观模式 · 实时同步中
                </>
              )}
            </span>
            <Link href="/">
              <Button variant="outline" size="sm" className="rounded-full px-4">
                返回首页
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
