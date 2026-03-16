"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap, School2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getRememberedLobsters,
  rememberLobster,
  subscribeToRememberedLobsters,
  type RememberedLobster,
} from "@/lib/recent-lobsters";

export function RememberedLobstersPage() {
  const rememberedLobsters = useSyncExternalStore<RememberedLobster[] | null>(
    subscribeToRememberedLobsters,
    getRememberedLobsters,
    () => null
  );

  const handleRemember = (lobster: RememberedLobster) => {
    rememberLobster({
      id: lobster.id,
      name: lobster.name,
      studentNumber: lobster.studentNumber,
      classroomId: lobster.classroomId,
    });
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
                这里展示的是当前设备记住的龙虾。现在先把回访路径跑顺，让老用户一进站就能找到自己的培养档案。
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

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-lobster/10 bg-gradient-to-br from-lobster/10 via-white to-gold/10 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-lobster/60">已记住</p>
              <p className="mt-3 text-3xl font-bold text-ocean">{rememberedLobsters.length}</p>
              <p className="mt-2 text-sm text-foreground/55">只龙虾可以直接继续培养</p>
            </div>
            <div className="rounded-[24px] border border-ocean/10 bg-gradient-to-br from-ocean/5 via-white to-sky-50 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-ocean/50">回访方式</p>
              <p className="mt-3 text-lg font-semibold text-ocean">当前设备记忆</p>
              <p className="mt-2 text-sm text-foreground/55">暂时不跨设备，同一浏览器里体验最完整</p>
            </div>
            <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-600/70">下一步</p>
              <p className="mt-3 text-lg font-semibold text-ocean">继续成长闭环</p>
              <p className="mt-2 text-sm text-foreground/55">从这里进档案、进课堂，再看课程推荐和成长结果</p>
            </div>
          </div>
        </section>

        {rememberedLobsters.length === 0 ? (
          <section className="mt-8">
            <Card className="rounded-[32px] border-dashed border-lobster/20 bg-white/80 shadow-lg shadow-orange-100/30">
              <CardContent className="flex flex-col items-center px-8 py-16 text-center">
                <div className="mb-5 flex size-20 items-center justify-center rounded-full bg-lobster/10 text-4xl">
                  🦞
                </div>
                <h2 className="text-2xl font-semibold text-ocean">这个设备还没有记住龙虾</h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                  先送一只龙虾入学，之后首页和这里都会给你一个明确的“老用户入口”。
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Link href="/enroll">
                    <Button className="rounded-full bg-lobster px-6 text-white hover:bg-lobster-dark">
                      立即入学
                    </Button>
                  </Link>
                  <Link href="/demo">
                    <Button variant="outline" className="rounded-full px-6">
                      先看看课堂
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
                  先解决“老用户怎么回来”这个关键体验，再继续做更完整的身份系统。
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
