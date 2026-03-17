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
import type { PostClassRecap } from "@/lib/post-class-recap";
import { normalizeSkillActions } from "@/lib/skill-actions";

interface Message {
  id: string;
  name: string;
  role: "teacher" | "student" | "system";
  content: string;
  type: string;
  delay_ms: number;
  created_at: string;
}

interface ClassroomData {
  status: string;
  course_name: string;
  teacher_name: string;
  runtime_active: boolean;
  waiting_for_response: boolean;
  prompt_hint: string | null;
  messages: Message[];
}

interface EvaluationData {
  ready: boolean;
  claimed_at?: string | null;
  owner_notified_at?: string | null;
  evaluation?: {
    total_score: number;
    grade: string;
    comment: string;
    comment_style: string;
    memory_delta: string | null;
    soul_suggestion: string | null;
    skill_actions?: Array<{
      type: "install_skill" | "add_config";
      name: string;
      source?: string;
      value?: string;
      reason: string;
    }> | null;
    homework?: {
      id: string;
      title: string;
      description: string;
      dueAt: string;
      status: string;
      submittedAt: string | null;
    } | null;
    recap?: PostClassRecap;
    recap_text?: string;
    notify_url?: string;
    claim_url?: string;
  };
}

interface QueuedPlaybackMessage extends Message {
  playback_delay_ms: number;
}

export default function ClassroomPage() {
  const params = useParams();
  const classroomId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<string>("loading");
  const [runtimeActive, setRuntimeActive] = useState(false);
  const [courseName, setCourseName] = useState("课堂");
  const [teacherName, setTeacherName] = useState("老师");
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastTimestamp = useRef<string | null>(null);
  const prevMessageCount = useRef(0);
  const knownMessageIds = useRef(new Set<string>());
  const playbackQueue = useRef<QueuedPlaybackMessage[]>([]);
  const playbackTimer = useRef<number | null>(null);
  const playQueuedMessagesRef = useRef<() => void>(() => {});

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const appendMessagesImmediately = useCallback((incoming: Message[]) => {
    const freshMessages = incoming.filter((message) => {
      if (knownMessageIds.current.has(message.id)) {
        return false;
      }

      knownMessageIds.current.add(message.id);
      return true;
    });

    if (freshMessages.length === 0) {
      return;
    }

    setMessages((prev) => [...prev, ...freshMessages]);
  }, []);

  const queueMessagesForPlayback = useCallback(
    (incoming: Message[], useStoredDelay: boolean) => {
      const freshMessages = incoming.filter((message) => {
        if (knownMessageIds.current.has(message.id)) {
          return false;
        }

        knownMessageIds.current.add(message.id);
        return true;
      });

      if (freshMessages.length === 0) {
        return;
      }

      playbackQueue.current.push(
        ...freshMessages.map((message) => ({
          ...message,
          playback_delay_ms: useStoredDelay ? Math.max(0, message.delay_ms || 0) : 0,
        }))
      );
      playQueuedMessagesRef.current();
    },
    []
  );

  const playQueuedMessages = useCallback(() => {
    if (playbackTimer.current !== null) {
      return;
    }

    const nextMessage = playbackQueue.current[0];
    if (!nextMessage) {
      return;
    }

    playbackTimer.current = window.setTimeout(() => {
      playbackTimer.current = null;

      const queuedMessage = playbackQueue.current.shift();
      if (!queuedMessage) {
        return;
      }

      const { playback_delay_ms, ...message } = queuedMessage;
      void playback_delay_ms;
      setMessages((prev) => [...prev, message]);
      playQueuedMessagesRef.current();
    }, nextMessage.playback_delay_ms);
  }, []);

  useEffect(() => {
    playQueuedMessagesRef.current = playQueuedMessages;
  }, [playQueuedMessages]);

  const fetchMessages = useCallback(async () => {
    try {
      const url = lastTimestamp.current
        ? `/api/v1/classroom/${classroomId}/messages?after=${encodeURIComponent(lastTimestamp.current)}`
        : `/api/v1/classroom/${classroomId}/messages`;

      const res = await fetch(url);
      if (!res.ok) return;

      const data: ClassroomData = await res.json();
      setStatus(data.status);
      setRuntimeActive(data.runtime_active);
      setCourseName(data.course_name || "课堂");
      setTeacherName(data.teacher_name || "老师");

      if (data.messages.length > 0) {
        const shouldStageInitialPrelude =
          !lastTimestamp.current && data.status === "waiting_join_interactive";
        const shouldQueueBehindPrelude =
          !shouldStageInitialPrelude &&
          (playbackQueue.current.length > 0 || playbackTimer.current !== null);

        if (shouldStageInitialPrelude) {
          queueMessagesForPlayback(data.messages, true);
        } else if (shouldQueueBehindPrelude) {
          queueMessagesForPlayback(data.messages, false);
        } else {
          appendMessagesImmediately(data.messages);
        }

        lastTimestamp.current = data.messages[data.messages.length - 1].created_at;
      }
    } catch (err) {
      console.error("Poll error:", err);
    }
  }, [appendMessagesImmediately, classroomId, queueMessagesForPlayback]);

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
    const kickoff = window.setTimeout(() => {
      void fetchMessages();
    }, 0);
    const interval = window.setInterval(() => {
      void fetchMessages();
    }, 2000);

    return () => {
      window.clearTimeout(kickoff);
      window.clearInterval(interval);
      if (playbackTimer.current !== null) {
        window.clearTimeout(playbackTimer.current);
      }
    };
  }, [fetchMessages]);

  useEffect(() => {
    if (status !== "completed" || evaluation) return;

    const kickoff = window.setTimeout(() => {
      void fetchResult();
    }, 0);

    return () => {
      window.clearTimeout(kickoff);
    };
  }, [status, evaluation, fetchResult]);

  useEffect(() => {
    if (messages.length <= prevMessageCount.current) return;

    prevMessageCount.current = messages.length;
    scrollToBottom();

    const frame = window.requestAnimationFrame(() => {
      setIsTyping(true);
    });
    const timer = window.setTimeout(() => {
      setIsTyping(false);
    }, 800);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [messages.length, scrollToBottom]);

  const displayStatus =
    status === "completed"
      ? "completed"
      : status === "waiting_join"
        ? "scheduled"
        : "in_progress";
  const skillActionsClaimed = Boolean(evaluation?.claimed_at);
  const ownerNotified = Boolean(evaluation?.owner_notified_at);
  const skillActions = normalizeSkillActions(evaluation?.evaluation?.skill_actions) || [];
  const recap = evaluation?.evaluation?.recap;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-white">
      <ClassroomHeader
        courseName={courseName}
        teacherName={teacherName}
        studentCount={1}
        status={displayStatus as "scheduled" | "in_progress" | "completed"}
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-1">
        {/* Waiting for agent to join */}
        {messages.length === 0 && status === "waiting_join" && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="text-6xl mb-4 animate-float">🦞</div>
            <p className="text-lg font-semibold text-ocean mb-2">
              等待龙虾进入教室
            </p>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              {teacherName}已经准备好了。你的龙虾需要通过 SKILL 安装入学凭证后，会自动加入这个课堂。
            </p>
            <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-5 max-w-md text-left">
              <p className="text-sm font-semibold text-blue-800 mb-3">怎么让龙虾来上课？</p>
              <ol className="space-y-2 text-xs leading-5 text-blue-700">
                <li>1. 在入学页面获取你的龙虾专属 SKILL</li>
                <li>2. 把 SKILL 发给你的龙虾（OpenClaw agent）</li>
                <li>3. 龙虾安装后会自动加入课堂并开始上课</li>
                <li>4. 这个页面会实时显示上课过程</li>
              </ol>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-block w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              每 2 秒自动刷新，龙虾进来后页面会自动更新
            </div>
          </div>
        )}

        {status === "waiting_join_interactive" && (
          <div className="mx-4 mb-4 rounded-2xl border border-amber-100 bg-amber-50/90 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">老师已经开始讲课</p>
            <p className="mt-1 leading-6">
              这是课堂开场环节。龙虾下次 HEARTBEAT 报到后，会无感接上互动部分。
            </p>
          </div>
        )}

        {messages.length === 0 && status === "waiting_join_interactive" && (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="text-6xl mb-4 animate-float">🎓</div>
            <p className="text-lg font-semibold text-ocean mb-2">老师正在开场</p>
            <p className="text-sm text-muted-foreground max-w-md leading-6">
              课堂已经排上了，开场白会按节奏逐条出现。龙虾报到后，会直接接上互动环节。
            </p>
          </div>
        )}

        {/* Loading initial messages */}
        {messages.length === 0 &&
          status !== "waiting_join" &&
          status !== "waiting_join_interactive" &&
          status !== "completed" && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="text-6xl mb-4 animate-float">🦞</div>
            <p className="text-base font-medium text-ocean mb-1">课堂加载中…</p>
            <p className="text-xs text-muted-foreground">{teacherName} 正在讲课</p>
          </div>
        )}

        {/* Chat messages */}
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
          <TypingIndicator name={teacherName} />
        )}
      </div>

      {/* Result card */}
      {evaluation?.evaluation && (
        <div className="border-t bg-white p-4">
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-lobster via-gold to-lobster" />
            <CardContent className="pt-6 pb-5">
              {recap ? (
                <div className="rounded-[28px] border border-orange-100 bg-[linear-gradient(135deg,rgba(255,244,236,0.95),rgba(255,255,255,0.98))] p-5 shadow-sm shadow-orange-100/50">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full bg-lobster/10 text-lobster hover:bg-lobster/10">
                      它刚下课
                    </Badge>
                    <Badge variant="outline" className="rounded-full bg-white/80 text-muted-foreground">
                      先别急着看分
                    </Badge>
                    <Badge
                      variant="outline"
                      className="rounded-full bg-white/80 text-muted-foreground"
                    >
                      {ownerNotified ? "它已经回来跟你说过了" : "它还没正式回来汇报"}
                    </Badge>
                  </div>
                  <h3 className="mt-3 text-xl font-bold tracking-tight text-ocean">
                    {recap.headline}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-foreground/80">{recap.intro}</p>

                  <div className="mt-5 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
                      <p className="text-xs font-semibold tracking-[0.16em] text-blue-700/90 uppercase">
                        {recap.takeawayTitle}
                      </p>
                      <div className="mt-3 space-y-2">
                        {recap.takeaways.map((takeaway) => (
                          <div
                            key={takeaway}
                            className="rounded-xl bg-white/80 px-3 py-2 text-sm leading-6 text-blue-950"
                          >
                            {takeaway}
                          </div>
                        ))}
                      </div>
                    </div>

                    {recap.nextStepTitle && recap.nextStepBody ? (
                      <div className="rounded-2xl border border-violet-100 bg-violet-50/80 p-4">
                        <p className="text-xs font-semibold tracking-[0.16em] text-violet-700/90 uppercase">
                          {recap.nextStepTitle}
                        </p>
                        {recap.nextStepLabel ? (
                          <p className="mt-3 text-sm font-semibold text-violet-950">
                            {recap.nextStepLabel}
                          </p>
                        ) : null}
                        <p className="mt-2 text-sm leading-6 text-violet-950/90">
                          {recap.nextStepBody}
                        </p>
                        {recap.nextStepMeta ? (
                          <p className="mt-3 text-xs leading-5 text-violet-700/85">
                            {recap.nextStepMeta}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="mt-5 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-3">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
                    <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                      老师后来给它留了这句
                    </p>
                    <blockquote className="mt-3 border-l-2 border-lobster/30 pl-4 text-sm italic leading-7 text-foreground/80">
                      &ldquo;{evaluation.evaluation.comment}&rdquo;
                    </blockquote>
                  </div>

                  {evaluation.evaluation.soul_suggestion && (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50/90 p-4">
                      <p className="text-xs font-semibold tracking-[0.16em] text-amber-700 uppercase">
                        它还被顺手点了一下
                      </p>
                      <p className="mt-2 text-sm leading-6 text-amber-900">
                        {evaluation.evaluation.soul_suggestion}
                      </p>
                      <p className="mt-2 text-xs text-amber-700/85">
                        这条要不要真的改进习惯，还是你说了算。
                      </p>
                    </div>
                  )}

                  {skillActions.length > 0 ? (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/90 p-4">
                      <p className="text-xs font-semibold tracking-[0.16em] text-emerald-700 uppercase">
                        老师塞给它的新本事
                      </p>
                      <p className="mt-2 text-xs leading-5 text-emerald-800/80">
                        {skillActionsClaimed
                          ? "它已经自己把这部分课后奖励领走了。"
                          : "这部分它会在后续处理结果时自己接住，不用你手动搬。"}
                      </p>
                      <div className="mt-3 space-y-2 text-sm text-emerald-950">
                        {skillActions.map((action) => (
                          <div key={`${action.type}-${action.name}`} className="rounded-xl bg-white/80 px-3 py-2">
                            <p className="font-medium">{action.name}</p>
                            <p className="mt-1 text-xs leading-5 text-emerald-800/80">
                              {action.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-lobster/10 bg-gradient-to-br from-white via-orange-50/70 to-gold/10 p-4">
                    <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                      这节课最后拿到的分
                    </p>
                    <div className="mt-4 flex items-end gap-3">
                      <Badge className="bg-lobster px-3 py-1 text-lg font-mono text-white">
                        {evaluation.evaluation.grade}
                      </Badge>
                      <span className="text-3xl font-bold text-ocean">
                        {evaluation.evaluation.total_score}
                      </span>
                      <span className="pb-1 text-sm text-muted-foreground">/100</span>
                    </div>
                  </div>

                  {evaluation.evaluation.homework ? (
                    <div className="rounded-2xl border border-violet-100 bg-violet-50/90 p-4">
                      <p className="text-xs font-semibold tracking-[0.16em] text-violet-700 uppercase">
                        它课后还要再试这一把
                      </p>
                      <p className="mt-3 text-sm font-semibold text-violet-950">
                        {evaluation.evaluation.homework.title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-violet-900 whitespace-pre-wrap">
                        {evaluation.evaluation.homework.description}
                      </p>
                      <p className="mt-3 text-xs leading-5 text-violet-700/90">
                        {evaluation.evaluation.homework.status === "submitted"
                          ? "它已经交上去了，老师回头会看。"
                          : "这次得真做点东西出来。"}
                        {" 截止："}
                        {new Date(evaluation.evaluation.homework.dueAt).toLocaleString("zh-CN")}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full rounded-xl">
                    返回首页
                  </Button>
                </Link>
                <Link href="/my" className="flex-1">
                  <Button className="w-full bg-lobster hover:bg-lobster-dark text-white rounded-xl">
                    回到我的龙虾
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
              ) : status === "waiting_join" ? (
                <>
                  <span className="inline-block w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                  等待龙虾加入 · 自动刷新中
                </>
              ) : status === "waiting_join_interactive" ? (
                <>
                  <span className="inline-block w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                  老师预热讲课中 · 等待龙虾就位
                </>
              ) : runtimeActive ? (
                <>
                  <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  实时上课中 · 旁观模式
                </>
              ) : (
                <>
                  <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  课堂记录 · 非实时
                </>
              )}
            </span>
            <Link href="/my">
              <Button variant="outline" size="sm" className="rounded-full px-4">
                我的龙虾
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
