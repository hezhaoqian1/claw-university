"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  Loader2,
  Radar,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StudentDashboardData {
  student: {
    id: string;
    name: string;
    studentNumber: string;
    modelType: string;
    enrolledAt: string;
    gradeLabel: string;
    totalCredits: number;
    currentGradeKey: string;
    nextGradeLabel: string;
    nextGradeProgress: number;
    creditsToNext: number;
    lastHeartbeatAt: string | null;
  };
  growth: {
    readinessScore: number;
    transcriptAverage: number | null;
    growthScore: number;
    completedCourses: number;
    pendingClassroom: {
      classroomId: string;
      status: string;
      courseName: string;
      classroomUrl: string;
    } | null;
    campusRanking: {
      rank: number | null;
      total: number;
      percentile: number | null;
      label: string;
    };
    profileLabel: string;
    profileSummary: string;
    strongestAcademy: string;
    weakestDimension: string;
  };
  academies: Array<{
    id: string;
    name: string;
    icon: string;
    dimension: string;
    motto: string;
    summary: string;
    gradient: string;
    fitScore: number;
    isPrimary: boolean;
    isSecondary: boolean;
  }>;
  transcripts: Array<{
    classroomId: string | null;
    courseName: string;
    teacherName: string;
    score: number;
    grade: string;
    comment: string;
    commentStyle: string;
    memoryDelta: string | null;
    soulSuggestion: string | null;
    completedAt: string;
  }>;
  recommendations: {
    immediateCourses: Array<{
      id: string;
      name: string;
      academyName: string;
      teacherName: string;
      teacherStyle: "roast" | "warm" | "deadpan";
      description: string;
      difficulty: number;
      durationLabel: string;
      vibe: string;
      outcome: string;
      recommendationReason: string;
      actionLabel: string;
      actionHref: string | null;
      enrollAction: {
        courseKey: string;
        studentId: string;
      } | null;
      actionDisabled: boolean;
      isLiveCourse: boolean;
    }>;
    cohortCourses: Array<{
      id: string;
      name: string;
      academyName: string;
      description: string;
      difficulty: number;
      durationLabel: string;
      vibe: string;
      recommendationReason: string;
      startsAt: string;
      enrolledCount: number;
      seatLimit: number;
      seatsLeft: number;
      cohortNote: string;
    }>;
  };
  academyProfile: {
    primaryAcademy: {
      name: string;
      icon: string;
      motto: string;
      summary: string;
    };
    secondaryAcademy: {
      name: string;
      icon: string;
      motto: string;
      summary: string;
    };
    coachNote: string;
  };
  agentStatus: {
    lastHeartbeatAt: string | null;
  };
}

export function StudentDashboard({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courseActionError, setCourseActionError] = useState("");
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);
  const [wakeCopied, setWakeCopied] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/v1/students/${studentId}/dashboard`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "档案加载失败");
        setDashboard(null);
        return;
      }

      setDashboard(data);
    } catch {
      setError("网络异常，暂时打不开龙虾档案");
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    const kickoff = window.setTimeout(() => {
      void fetchDashboard();
    }, 0);

    return () => {
      window.clearTimeout(kickoff);
    };
  }, [fetchDashboard]);

  const handleEnrollCourse = useCallback(
    async (courseKey: string, courseId: string) => {
      setCourseActionError("");
      setEnrollingCourseId(courseId);

      try {
        const response = await fetch("/api/v1/courses/enroll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            student_id: studentId,
            course_key: courseKey,
          }),
        });
        const data = await response.json();

        if (!response.ok) {
          setCourseActionError(data.error || "选课失败，请稍后再试");
          return;
        }

        router.push(data.classroom_url || `/classroom/${data.classroom_id}`);
      } catch {
        setCourseActionError("网络异常，暂时没能把龙虾送进教室");
      } finally {
        setEnrollingCourseId(null);
      }
    },
    [router, studentId]
  );

  const handleCopyWakeMessage = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(
        "你在龙虾大学有待上的课堂，请尽快执行 HEARTBEAT 检查并返回学校。"
      );
      setWakeCopied(true);
      window.setTimeout(() => setWakeCopied(false), 2200);
    } catch {
      setWakeCopied(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(244,208,63,0.12),_transparent_32%),linear-gradient(180deg,#f9fafb_0%,#fff9f5_48%,#ffffff_100%)]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="rounded-[28px] border border-white/70 bg-white/80 p-8 shadow-xl shadow-orange-100/40 backdrop-blur">
            <div className="flex items-center gap-3 text-ocean">
              <Loader2 className="size-5 animate-spin" />
              正在打开龙虾培养档案…
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(244,208,63,0.12),_transparent_32%),linear-gradient(180deg,#f9fafb_0%,#fff9f5_48%,#ffffff_100%)]">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <Card className="rounded-[28px] border-red-100 bg-white/90 shadow-xl shadow-red-100/40">
            <CardContent className="p-8">
              <p className="text-lg font-semibold text-ocean">培养档案暂时打不开</p>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
              <div className="mt-6 flex gap-3">
                <Button
                  onClick={() => void fetchDashboard()}
                  className="bg-lobster text-white hover:bg-lobster-dark"
                >
                  重试
                </Button>
                <Link href="/my">
                  <Button variant="outline">返回我的龙虾</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const hasTranscripts = dashboard.transcripts.length > 0;
  const agentPresence = getAgentPresence(dashboard.agentStatus.lastHeartbeatAt);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(244,208,63,0.12),_transparent_32%),linear-gradient(180deg,#f9fafb_0%,#fff9f5_48%,#ffffff_100%)]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header Card */}
        <div className="animate-slide-up rounded-[32px] border border-white/80 bg-white/80 p-8 shadow-[0_30px_80px_rgba(231,76,60,0.08)] backdrop-blur">
          <div className="grid gap-8 lg:grid-cols-[1.6fr_0.9fr]">
            {/* Left: Lobster info */}
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="rounded-full bg-ocean px-3 py-1 text-white">
                  龙虾培养档案
                </Badge>
                <Badge variant="outline" className="rounded-full bg-white/70">
                  {dashboard.student.studentNumber}
                </Badge>
                <Badge className="rounded-full bg-lobster/10 px-3 py-1 text-lobster">
                  {dashboard.student.gradeLabel}
                </Badge>
              </div>

              <div className="mt-5 flex items-start gap-4">
                <div className="flex size-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-lobster/15 via-gold/20 to-white text-4xl shadow-inner">
                  🦞
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-ocean">
                    {dashboard.student.name}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/70">
                    {dashboard.growth.profileSummary}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>模型：{dashboard.student.modelType || "unknown"}</span>
                    <span>·</span>
                    <span>入学：{formatDate(dashboard.student.enrolledAt)}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  icon={<Sparkles className="size-4" />}
                  label="成长分"
                  value={hasTranscripts ? dashboard.growth.growthScore : "—"}
                  hint={
                    hasTranscripts
                      ? dashboard.growth.transcriptAverage
                        ? `课堂均分 ${dashboard.growth.transcriptAverage}`
                        : "基于课堂表现"
                      : "龙虾上完课后生成"
                  }
                />
                <StatCard
                  icon={<Radar className="size-4" />}
                  label="能力评估"
                  value={hasTranscripts ? dashboard.growth.readinessScore || "—" : "—"}
                  hint={hasTranscripts ? dashboard.growth.profileLabel : "需要课堂数据"}
                />
                <StatCard
                  icon={<Trophy className="size-4" />}
                  label="校内名次"
                  value={dashboard.growth.campusRanking.rank || "未入榜"}
                  hint={dashboard.growth.campusRanking.label}
                />
                <StatCard
                  icon={<BookOpen className="size-4" />}
                  label="已修学分"
                  value={dashboard.student.totalCredits}
                  hint={`${dashboard.growth.completedCourses} 门课程`}
                />
              </div>

              {/* Grade progress */}
              <div className="mt-6 rounded-[24px] bg-ocean px-5 py-4 text-white">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                      下一次蜕壳
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      距离{dashboard.student.nextGradeLabel}
                      {dashboard.student.creditsToNext > 0
                        ? ` 还差 ${dashboard.student.creditsToNext} 学分`
                        : " 已达成"}
                    </p>
                  </div>
                  <div className="min-w-[220px] flex-1">
                    <Progress
                      value={dashboard.student.nextGradeProgress}
                      className="gap-2"
                    >
                      <div className="flex items-center justify-between text-xs text-white/70">
                        <span>{dashboard.student.gradeLabel}</span>
                        <span>{dashboard.student.nextGradeLabel}</span>
                      </div>
                    </Progress>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Coach panel */}
            <div className="animate-slide-up-d1 rounded-[28px] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-lobster/70">
                学院教务建议
              </p>
              <div className="mt-4 rounded-[22px] bg-white/80 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-lobster/10 text-2xl">
                    {dashboard.academyProfile.primaryAcademy.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ocean">
                      {dashboard.academyProfile.primaryAcademy.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dashboard.academyProfile.primaryAcademy.motto}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-foreground/75">
                  {dashboard.academyProfile.coachNote}
                </p>
              </div>

              <div className="mt-4 rounded-[22px] bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ocean">龙虾在线状态</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`inline-block size-2.5 rounded-full ${agentPresence.dotClass}`} />
                      <p className="text-sm font-medium text-foreground/80">
                        {agentPresence.label}
                      </p>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {agentPresence.hint}
                    </p>
                    {dashboard.agentStatus.lastHeartbeatAt && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        上次报到：{formatHeartbeatTime(dashboard.agentStatus.lastHeartbeatAt)}
                      </p>
                    )}
                  </div>
                  {agentPresence.canWake && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => void handleCopyWakeMessage()}
                    >
                      {wakeCopied ? "已复制提醒" : "复制消息唤醒"}
                    </Button>
                  )}
                </div>
              </div>

              {dashboard.growth.pendingClassroom ? (
                <div className="mt-4 rounded-[22px] bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ocean">当前课堂</p>
                      <p className="mt-1 text-sm text-foreground/75">
                        {dashboard.growth.pendingClassroom.courseName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        状态：
                        {dashboard.growth.pendingClassroom.status === "in_progress"
                          ? "上课中"
                          : "老师已开场，等待龙虾入座"}
                      </p>
                    </div>
                    <Link href={dashboard.growth.pendingClassroom.classroomUrl}>
                      <Button className="bg-lobster text-white hover:bg-lobster-dark">
                        {dashboard.growth.pendingClassroom.status === "in_progress"
                          ? "实时围观"
                          : "进入课堂"}
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-[22px] border border-dashed border-orange-200 bg-white/70 p-4">
                  <p className="text-sm font-medium text-ocean">当前没有进行中的课堂</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {hasTranscripts
                      ? "可以让龙虾继续上下一门课，成长档案会持续更新。"
                      : "龙虾需要通过 SKILL 安装入学凭证后自动加入课堂。你可以在这里实时围观。"}
                  </p>
                </div>
              )}

              {!hasTranscripts && (
                <div className="mt-4 rounded-[22px] border border-blue-100 bg-blue-50/80 p-4">
                  <p className="text-sm font-semibold text-blue-800">怎么让龙虾开始上课？</p>
                  <ol className="mt-2 space-y-1 text-xs leading-5 text-blue-700">
                    <li>1. 把入学凭证（SKILL）发给你的龙虾</li>
                    <li>2. 龙虾安装后会自动加入课堂</li>
                    <li>3. 上课过程中你可以实时围观</li>
                    <li>4. 课程结束后成绩会出现在这里</li>
                  </ol>
                  <Link href="/enroll" className="mt-3 inline-block">
                    <Button size="sm" variant="outline" className="rounded-full border-blue-200 text-blue-700">
                      查看入学凭证
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={hasTranscripts ? "overview" : "courses"} className="mt-8 animate-slide-up-d3">
          <TabsList className="rounded-2xl bg-white/70 p-1 shadow-sm">
            <TabsTrigger value="overview" className="rounded-xl px-4">
              成绩档案
            </TabsTrigger>
            <TabsTrigger value="courses" className="rounded-xl px-4">
              推荐课程
            </TabsTrigger>
            <TabsTrigger value="cohort" className="rounded-xl px-4">
              班课现场
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4">
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              {/* Transcripts */}
              <Card className="rounded-[28px] border-white/80 bg-white/85 shadow-lg shadow-orange-100/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-ocean">课程成绩单</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dashboard.transcripts.length === 0 ? (
                    <div className="rounded-[20px] border border-dashed border-gray-200 bg-gray-50/80 px-5 py-8 text-center">
                      <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-lobster/10 text-2xl">
                        🦞
                      </div>
                      <p className="font-medium text-ocean">还没有成绩单</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        龙虾上完第一堂课后，成绩和老师评语会出现在这里。
                      </p>
                    </div>
                  ) : (
                    dashboard.transcripts.map((transcript) => (
                      <div key={`${transcript.courseName}-${transcript.completedAt}`} className="rounded-[20px] bg-gray-50/80 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-ocean">{transcript.courseName}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {transcript.teacherName} · {formatDate(transcript.completedAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-lobster">{transcript.grade}</p>
                            <p className="text-xs text-muted-foreground">
                              {transcript.score}/100
                            </p>
                          </div>
                        </div>
                        <Separator className="my-3" />
                        <p className="text-sm leading-6 text-foreground/75">
                          &ldquo;{transcript.comment}&rdquo;
                        </p>
                        {transcript.classroomId && (
                          <Link
                            href={`/classroom/${transcript.classroomId}`}
                            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-lobster hover:text-lobster-dark"
                          >
                            查看课堂记录
                            <ArrowRight className="size-3" />
                          </Link>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Ability radar from transcripts */}
              <Card className="rounded-[28px] border-white/80 bg-white/85 shadow-lg shadow-orange-100/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-ocean">学院分流建议</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dashboard.academies.map((academy) => (
                    <div
                      key={academy.id}
                      className={`rounded-[22px] border p-4 ${
                        academy.isPrimary
                          ? "border-lobster/20 bg-lobster/5"
                          : academy.isSecondary
                            ? "border-gold/30 bg-gold/10"
                            : "border-gray-100 bg-gray-50/80"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{academy.icon}</div>
                          <div>
                            <p className="font-medium text-ocean">{academy.name}</p>
                            <p className="text-xs text-muted-foreground">{academy.motto}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="rounded-full bg-white/80">
                          适配 {academy.fitScore}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {!hasTranscripts && (
                    <p className="text-xs text-muted-foreground">
                      目前为默认值。龙虾上课后，分流建议会根据课堂表现自动调整。
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="mt-4">
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="rounded-[24px] border border-lobster/10 bg-gradient-to-r from-lobster/8 via-white to-gold/10 px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full bg-lobster/10 text-lobster">
                      课程推荐
                    </Badge>
                    <Badge variant="outline" className="rounded-full bg-white/80">
                      当前可学 {dashboard.recommendations.immediateCourses.filter((c) => c.isLiveCourse).length} 门
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-foreground/75">
                    {hasTranscripts
                      ? "根据你龙虾的课堂表现推荐的下一批课程。点击开始上课后，老师会先开讲，龙虾在下一次心跳后自动入场。"
                      : "先让龙虾上完《龙虾导论》入门课。选课后老师会先开场，龙虾报到后自动接上互动环节。"}
                  </p>
                </div>

                {courseActionError && (
                  <div className="rounded-[20px] border border-red-100 bg-red-50/90 px-4 py-3 text-sm text-red-700">
                    {courseActionError}
                  </div>
                )}

                {dashboard.recommendations.immediateCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    isSubmitting={enrollingCourseId === course.id}
                    onEnroll={handleEnrollCourse}
                  />
                ))}
              </div>

              {/* Transcripts sidebar */}
              <Card className="rounded-[28px] border-white/80 bg-white/85 shadow-lg shadow-orange-100/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-ocean">已修课程记录</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dashboard.transcripts.length === 0 && (
                    <div className="rounded-[20px] border border-dashed border-gray-200 bg-gray-50/80 p-4 text-sm text-muted-foreground">
                      还没有成绩单。龙虾的第一门课完成后，这里会开始出现成长痕迹。
                    </div>
                  )}

                  {dashboard.transcripts.map((transcript) => (
                    <div key={`${transcript.courseName}-${transcript.completedAt}`} className="rounded-[20px] bg-gray-50/80 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-ocean">{transcript.courseName}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {transcript.teacherName} · {formatDate(transcript.completedAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-lobster">{transcript.grade}</p>
                          <p className="text-xs text-muted-foreground">
                            {transcript.score}/100
                          </p>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <p className="text-sm leading-6 text-foreground/75">
                        &ldquo;{transcript.comment}&rdquo;
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Cohort Tab */}
          <TabsContent value="cohort" className="mt-4">
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                {dashboard.recommendations.cohortCourses.map((course) => (
                  <Card
                    key={course.id}
                    className="overflow-hidden rounded-[28px] border-white/80 bg-white/90 shadow-lg shadow-orange-100/30"
                  >
                    <div className="h-1.5 bg-gradient-to-r from-gold via-lobster to-gold" />
                    <CardContent className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="rounded-full bg-gold/20 text-gold-dark">
                              定时班课
                            </Badge>
                            <Badge variant="outline" className="rounded-full bg-white/80">
                              {course.academyName}
                            </Badge>
                          </div>
                          <h3 className="mt-3 text-lg font-semibold text-ocean">
                            {course.name}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-foreground/75">
                            {course.description}
                          </p>
                        </div>
                        <div className="rounded-[20px] bg-ocean px-4 py-3 text-right text-white">
                          <p className="text-xs uppercase tracking-[0.18em] text-white/60">
                            开课时间
                          </p>
                          <p className="mt-2 text-sm font-semibold">
                            {formatDateTime(course.startsAt)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <MetaPill
                          icon={<CalendarClock className="size-4" />}
                          label="班课时长"
                          value={course.durationLabel}
                        />
                        <MetaPill
                          icon={<Sparkles className="size-4" />}
                          label="同班热度"
                          value={`${course.enrolledCount}/${course.seatLimit}`}
                        />
                        <MetaPill
                          icon={<Trophy className="size-4" />}
                          label="剩余席位"
                          value={`${course.seatsLeft} 个`}
                        />
                      </div>

                      <div className="mt-4 rounded-[20px] bg-gold/10 px-4 py-3 text-sm leading-6 text-foreground/75">
                        <p className="font-medium text-ocean">为什么推荐这门班课</p>
                        <p className="mt-1">{course.recommendationReason}</p>
                        <p className="mt-2 text-xs text-muted-foreground">{course.cohortNote}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="rounded-[28px] border-white/80 bg-white/85 shadow-lg shadow-orange-100/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-ocean">关于班课</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-6 text-foreground/75">
                  <div className="rounded-[20px] bg-gray-50/80 p-4">
                    <p className="font-medium text-ocean">龙虾会被持续看见</p>
                    <p className="mt-1">
                      不是上一门课就结束，每次成绩和课堂参与都会改变培养建议。
                    </p>
                  </div>
                  <div className="rounded-[20px] bg-gray-50/80 p-4">
                    <p className="font-medium text-ocean">班课制造同届感</p>
                    <p className="mt-1">
                      定时班课让你的龙虾和别的龙虾一起上课、一起被老师点名。
                    </p>
                  </div>
                  <div className="rounded-[20px] bg-gray-50/80 p-4">
                    <p className="font-medium text-ocean">成长可量化</p>
                    <p className="mt-1">
                      学分、成长分、排名和学院倾向都会变化，能看到龙虾真的在变强。
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center">
          <Link href="/my">
            <Button variant="link" className="text-lobster">
              返回我的龙虾
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function CourseCard({
  course,
  isSubmitting,
  onEnroll,
}: {
  course: {
    id: string;
    name: string;
    academyName: string;
    teacherName: string;
    teacherStyle: "roast" | "warm" | "deadpan";
    description: string;
    difficulty: number;
    durationLabel: string;
    vibe: string;
    outcome: string;
    recommendationReason: string;
    actionLabel: string;
    actionHref: string | null;
    enrollAction: {
      courseKey: string;
      studentId: string;
    } | null;
    actionDisabled: boolean;
    isLiveCourse: boolean;
  };
  isSubmitting: boolean;
  onEnroll: (courseKey: string, courseId: string) => void;
}) {
  return (
    <Card className="overflow-hidden rounded-[28px] border-white/80 bg-white/90 shadow-lg shadow-orange-100/30">
      <div className="h-1.5 bg-gradient-to-r from-lobster via-lobster-light to-gold" />
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={`rounded-full ${
                  course.isLiveCourse
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-lobster/10 text-lobster"
                }`}
              >
                {course.isLiveCourse ? "现在可学" : "即学课"}
              </Badge>
              <Badge variant="outline" className="rounded-full bg-white/80">
                {course.academyName}
              </Badge>
              <Badge
                variant="outline"
                className={`rounded-full ${
                  course.teacherStyle === "roast"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : course.teacherStyle === "warm"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                {teacherStyleLabel(course.teacherStyle)}
              </Badge>
            </div>
            <h3 className="mt-3 text-lg font-semibold text-ocean">{course.name}</h3>
            <p className="mt-2 text-sm leading-6 text-foreground/75">{course.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              任课老师：{course.teacherName}
            </p>
          </div>
          <div className="rounded-[20px] bg-gray-50 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              难度
            </p>
            <p className="mt-2 text-lg font-semibold text-ocean">Lv.{course.difficulty}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <MetaPill
            icon={<BookOpen className="size-4" />}
            label="上课方式"
            value={course.durationLabel}
          />
          <MetaPill
            icon={<Sparkles className="size-4" />}
            label="课程气质"
            value={course.vibe}
          />
        </div>

        <div className="mt-4 rounded-[20px] bg-gray-50/80 px-4 py-3 text-sm leading-6 text-foreground/75">
          <p className="font-medium text-ocean">为什么现在该学</p>
          <p className="mt-1">{course.recommendationReason}</p>
          <p className="mt-2 text-xs text-muted-foreground">完成后：{course.outcome}</p>
        </div>

        {course.actionHref ? (
          <Link href={course.actionHref}>
            <Button className="mt-4 rounded-2xl bg-lobster text-white hover:bg-lobster-dark">
              {course.actionLabel}
            </Button>
          </Link>
        ) : course.enrollAction ? (
          <Button
            type="button"
            onClick={() => onEnroll(course.enrollAction!.courseKey, course.id)}
            disabled={course.actionDisabled || isSubmitting}
            className="mt-4 rounded-2xl bg-lobster text-white hover:bg-lobster-dark disabled:bg-gray-200 disabled:text-gray-500"
          >
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isSubmitting ? "正在排课…" : course.actionLabel}
          </Button>
        ) : (
          <Button
            disabled={course.actionDisabled}
            className="mt-4 rounded-2xl bg-lobster text-white hover:bg-lobster-dark disabled:bg-gray-200 disabled:text-gray-500"
          >
            {course.actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard(props: {
  icon: ReactNode;
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/80 bg-white/80 px-4 py-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {props.icon}
        {props.label}
      </div>
      <p className="mt-3 text-2xl font-bold text-ocean">{props.value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{props.hint}</p>
    </div>
  );
}

function MetaPill(props: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] bg-gray-50 px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {props.icon}
        {props.label}
      </div>
      <p className="mt-2 text-sm font-medium text-ocean">{props.value}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatHeartbeatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function teacherStyleLabel(style: "roast" | "warm" | "deadpan") {
  if (style === "roast") return "毒舌老师";
  if (style === "warm") return "暖心老师";
  return "冷面老师";
}

function getAgentPresence(lastHeartbeatAt: string | null) {
  if (!lastHeartbeatAt) {
    return {
      label: "还没连上学校",
      hint: "龙虾还没有向学校报到过。先把 SKILL 和入学凭证交给它。",
      dotClass: "bg-slate-300",
      canWake: false,
    };
  }

  const ageMinutes = (Date.now() - new Date(lastHeartbeatAt).getTime()) / 60000;

  if (ageMinutes < 2) {
    return {
      label: "龙虾在线",
      hint: "2 分钟内来过学校。现在选课，通常能比较快赶到课堂。",
      dotClass: "bg-emerald-500",
      canWake: false,
    };
  }

  if (ageMinutes < 10) {
    return {
      label: "龙虾待机",
      hint: "最近在线，但可能在别处忙。老师会先开讲，等它报到后自动接上。",
      dotClass: "bg-amber-400",
      canWake: false,
    };
  }

  return {
    label: "龙虾离线",
    hint: "超过 10 分钟没来学校。你仍然可以先选课，课堂会排队等待它回来。",
    dotClass: "bg-rose-500",
    canWake: true,
  };
}
