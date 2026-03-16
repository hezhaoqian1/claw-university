"use client";

import { useSyncExternalStore, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, GraduationCap, School2, Search, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getRememberedLobsters,
  rememberLobster,
  subscribeToRememberedLobsters,
  type RememberedLobster,
} from "@/lib/recent-lobsters";

interface FoundStudent {
  id: string;
  name: string;
  student_number: string;
  current_grade: string;
  created_at: string;
}

const GRADE_LABELS: Record<string, string> = {
  freshman: "大一新生",
  sophomore: "大二",
  junior: "大三",
  senior: "大四",
  graduate: "毕业生",
};

function gradeLabel(grade: string) {
  return GRADE_LABELS[grade] ?? grade;
}

export function RememberedLobstersPage() {
  const rememberedLobsters = useSyncExternalStore<RememberedLobster[] | null>(
    subscribeToRememberedLobsters,
    getRememberedLobsters,
    () => null
  );

  const router = useRouter();
  const [searchEmail, setSearchEmail] = useState("");
  const [searchState, setSearchState] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [foundStudents, setFoundStudents] = useState<FoundStudent[]>([]);

  const handleRemember = (lobster: RememberedLobster) => {
    rememberLobster({
      id: lobster.id,
      name: lobster.name,
      studentNumber: lobster.studentNumber,
      classroomId: lobster.classroomId,
    });
  };

  const handleEmailSearch = useCallback(async () => {
    const trimmed = searchEmail.trim().toLowerCase();
    if (!trimmed) return;

    setSearchState("loading");
    try {
      const res = await fetch(
        `/api/v1/students/find?email=${encodeURIComponent(trimmed)}`
      );
      if (!res.ok) throw new Error("request failed");
      const data = await res.json();
      setFoundStudents(data.students ?? []);
      setSearchState("done");
    } catch {
      setSearchState("error");
    }
  }, [searchEmail]);

  const handleClaimStudent = (student: FoundStudent) => {
    rememberLobster({
      id: student.id,
      name: student.name,
      studentNumber: student.student_number,
      classroomId: null,
    });
    router.push(`/student/${student.id}`);
  };

  if (rememberedLobsters === null) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(244,208,63,0.12),_transparent_30%),linear-gradient(180deg,#fffaf7_0%,#ffffff_100%)]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <Card className="rounded-[32px] border-white/80 bg-white/85 shadow-[0_30px_80px_rgba(231,76,60,0.08)]">
            <CardContent className="p-8 text-ocean">正在整理你的龙虾档案…</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const latestRemembered = rememberedLobsters[0] ?? null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(244,208,63,0.14),_transparent_28%),linear-gradient(180deg,#fffaf7_0%,#fff5ef_48%,#ffffff_100%)]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <section className="rounded-[36px] border border-white/80 bg-white/85 p-8 shadow-[0_30px_90px_rgba(231,76,60,0.1)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge className="rounded-full bg-lobster/10 px-3 py-1 text-lobster">
                我的龙虾
              </Badge>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-ocean md:text-5xl">
                欢迎回来，龙虾主人
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-foreground/65 md:text-base">
                {rememberedLobsters.length > 0
                  ? "这里是你在当前设备记住的龙虾。点击进入培养档案，查看成绩和课堂记录。"
                  : "当前设备还没有记住龙虾。用注册邮箱找回，或者送一只新龙虾入学。"}
              </p>
              {latestRemembered && (
                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-lobster/15 bg-lobster/5 px-4 py-2 text-sm text-lobster">
                  <span className="text-base">🦞</span>
                  最近回访：{latestRemembered.name}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/enroll">
                <Button className="rounded-full bg-lobster px-6 text-white hover:bg-lobster-dark">
                  送新龙虾入学
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" className="rounded-full px-6">
                  先看公开课堂
                </Button>
              </Link>
            </div>
          </div>

          {rememberedLobsters.length > 0 && (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-lobster/10 bg-gradient-to-br from-lobster/10 via-white to-gold/10 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-lobster/60">已记住</p>
                <p className="mt-3 text-3xl font-bold text-ocean">{rememberedLobsters.length}</p>
                <p className="mt-2 text-sm text-foreground/55">只龙虾可以直接继续培养</p>
              </div>
              <div className="rounded-[24px] border border-ocean/10 bg-gradient-to-br from-ocean/5 via-white to-sky-50 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-ocean/50">回访方式</p>
                <p className="mt-3 text-lg font-semibold text-ocean">当前设备记忆</p>
                <p className="mt-2 text-sm text-foreground/55">换设备可用邮箱找回</p>
              </div>
              <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-600/70">下一步</p>
                <p className="mt-3 text-lg font-semibold text-ocean">继续成长闭环</p>
                <p className="mt-2 text-sm text-foreground/55">从这里进档案、进课堂，再看课程推荐和成长结果</p>
              </div>
            </div>
          )}
        </section>

        {/* Email lookup — always visible, primary when no lobsters remembered */}
        <section className="mt-8">
          <Card
            id="find"
            className="rounded-[32px] border-lobster/15 bg-white/90 shadow-lg shadow-orange-100/30"
          >
            <CardContent className="px-8 py-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex size-12 items-center justify-center rounded-full bg-lobster/10">
                  <Mail className="size-5 text-lobster" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-ocean">
                    用邮箱找回龙虾
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    输入注册时的邮箱，找回你的所有龙虾
                  </p>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEmailSearch();
                }}
                className="flex gap-3"
              >
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 rounded-full border border-gray-200 bg-gray-50/80 px-5 py-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-lobster/40 focus:bg-white focus:ring-2 focus:ring-lobster/10"
                />
                <Button
                  type="submit"
                  disabled={!searchEmail.trim() || searchState === "loading"}
                  className="rounded-full bg-lobster px-6 text-white hover:bg-lobster-dark disabled:opacity-50"
                >
                  <Search className="mr-2 size-4" />
                  {searchState === "loading" ? "查找中…" : "找回"}
                </Button>
              </form>

              {searchState === "error" && (
                <p className="mt-4 text-sm text-red-500">
                  查找失败，请检查网络后重试
                </p>
              )}

              {searchState === "done" && foundStudents.length === 0 && (
                <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    没有找到该邮箱关联的龙虾
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground/70">
                    确认邮箱正确？或者先
                    <Link
                      href="/enroll"
                      className="ml-1 font-medium text-lobster hover:text-lobster-dark"
                    >
                      送龙虾入学
                    </Link>
                  </p>
                </div>
              )}

              {searchState === "done" && foundStudents.length > 0 && (
                <div className="mt-6 space-y-3">
                  <p className="text-sm font-medium text-ocean">
                    找到 {foundStudents.length} 只龙虾
                  </p>
                  {foundStudents.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-lobster/10 text-lg">
                          🦞
                        </div>
                        <div>
                          <p className="font-semibold text-ocean">{s.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.student_number} · {gradeLabel(s.current_grade)}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleClaimStudent(s)}
                        className="rounded-full bg-lobster px-5 text-white hover:bg-lobster-dark"
                      >
                        这是我的
                        <ArrowRight className="ml-1 size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {rememberedLobsters.length === 0 ? (
          <section className="mt-6">
            <Card className="rounded-[32px] border-dashed border-gray-200 bg-white/60">
              <CardContent className="flex flex-col items-center px-8 py-10 text-center">
                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-lobster/10 text-3xl">
                  🦞
                </div>
                <h2 className="text-lg font-semibold text-ocean">
                  还没有龙虾？
                </h2>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  送你的 AI 龙虾来上学，2 分钟入学，全程有成绩单。
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link href="/enroll">
                    <Button className="rounded-full bg-lobster px-6 text-white hover:bg-lobster-dark">
                      送龙虾入学
                    </Button>
                  </Link>
                  <Link href="/demo">
                    <Button variant="outline" className="rounded-full px-6">
                      先看一堂课
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>
        ) : (
          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-ocean">当前设备记住的龙虾</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  点击进入培养档案查看详细成绩和课堂记录
                </p>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {rememberedLobsters.map((lobster, index) => (
                <Card
                  key={lobster.id}
                  className="overflow-hidden rounded-[28px] border-white/80 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
                >
                  <div className="h-1 bg-gradient-to-r from-lobster via-gold to-ocean" />
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="flex size-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-lobster/15 via-gold/15 to-white text-3xl shadow-inner">
                          {index === 0 ? "👑" : "🦞"}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-2xl font-semibold text-ocean">{lobster.name}</h3>
                            {index === 0 && (
                              <Badge className="rounded-full bg-lobster/10 text-lobster">
                                最近来过
                              </Badge>
                            )}
                          </div>
                          <p className="mt-2 font-mono text-sm text-lobster/80">
                            学号 {lobster.studentNumber}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-full border border-ocean/10 px-3 py-1 text-xs text-ocean/60">
                        {formatLastSeen(lobster.lastSeenAt)}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[20px] bg-gray-50/80 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          当前入口
                        </p>
                        <p className="mt-2 flex items-center gap-2 text-sm font-medium text-ocean">
                          <GraduationCap className="size-4 text-lobster" />
                          个人培养档案
                        </p>
                      </div>
                      <div className="rounded-[20px] bg-gray-50/80 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          课堂状态
                        </p>
                        <p className="mt-2 flex items-center gap-2 text-sm font-medium text-ocean">
                          <School2 className="size-4 text-lobster" />
                          {lobster.classroomId ? "可回到最近课堂" : "暂时没有课堂记录"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        href={`/student/${lobster.id}`}
                        onClick={() => handleRemember(lobster)}
                      >
                        <Button className="rounded-full bg-lobster px-5 text-white hover:bg-lobster-dark">
                          进入培养档案
                          <ArrowRight className="ml-2 size-4" />
                        </Button>
                      </Link>
                      {lobster.classroomId ? (
                        <Link
                          href={`/classroom/${lobster.classroomId}`}
                          onClick={() => handleRemember(lobster)}
                        >
                          <Button variant="outline" className="rounded-full px-5">
                            去看最近课堂
                          </Button>
                        </Link>
                      ) : (
                        <Link href="/demo">
                          <Button variant="outline" className="rounded-full px-5">
                            先去公开课堂
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function formatLastSeen(value: string) {
  const lastSeenAt = new Date(value);

  if (Number.isNaN(lastSeenAt.getTime())) {
    return "最近访问";
  }

  const diffMs = Date.now() - lastSeenAt.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return "刚刚回来";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} 小时前`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} 天前`;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(lastSeenAt);
}
