"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

interface PlacementQuestionOption {
  id: string;
  label: string;
  description: string;
}

interface PlacementQuestion {
  id: string;
  prompt: string;
  hint: string;
  options: PlacementQuestionOption[];
}

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
  assessment: {
    completed: boolean;
    questions: PlacementQuestion[];
    result: {
      answers: Record<string, string>;
      traitScores: Record<string, number>;
      readinessScore: number;
      profileLabel: string;
      profileSummary: string;
    } | null;
  };
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
}

const DIMENSION_COLORS: Record<string, string> = {
  reliability: "from-amber-500 to-orange-400",
  tooling: "from-sky-500 to-cyan-400",
  communication: "from-rose-500 to-pink-400",
  initiative: "from-emerald-500 to-teal-400",
};

const DIMENSION_LABELS: Record<string, string> = {
  reliability: "守信值",
  tooling: "工具力",
  communication: "表达力",
  initiative: "执行力",
};

export function StudentDashboard({ studentId }: { studentId: string }) {
  const [dashboard, setDashboard] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showAssessmentRetake, setShowAssessmentRetake] = useState(false);

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
      setAnswers(data.assessment.result?.answers || {});
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

  const canSubmitAssessment = useMemo(() => {
    if (!dashboard) return false;
    return dashboard.assessment.questions.every((question) => Boolean(answers[question.id]));
  }, [answers, dashboard]);

  const handleSubmitAssessment = async () => {
    if (!canSubmitAssessment) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/v1/students/${studentId}/assessment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "测评保存失败");
        return;
      }

      setShowAssessmentRetake(false);
      await fetchDashboard();
    } catch {
      setError("测评提交失败，请稍后再试");
    } finally {
      setSaving(false);
    }
  };

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

  const traitEntries = Object.entries(
    dashboard.assessment.result?.traitScores || {}
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(244,208,63,0.12),_transparent_32%),linear-gradient(180deg,#f9fafb_0%,#fff9f5_48%,#ffffff_100%)]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="animate-slide-up rounded-[32px] border border-white/80 bg-white/80 p-8 shadow-[0_30px_80px_rgba(231,76,60,0.08)] backdrop-blur">
          <div className="grid gap-8 lg:grid-cols-[1.6fr_0.9fr]">
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
                    <span>·</span>
                    <span>主修倾向：{dashboard.academyProfile.primaryAcademy.name}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  icon={<Sparkles className="size-4" />}
                  label="成长分"
                  value={dashboard.growth.growthScore}
                  hint={
                    dashboard.growth.transcriptAverage === null
                      ? "测评权重更高"
                      : `课堂均分 ${dashboard.growth.transcriptAverage}`
                  }
                />
                <StatCard
                  icon={<Radar className="size-4" />}
                  label="入学测评"
                  value={
                    dashboard.assessment.completed
                      ? dashboard.growth.readinessScore
                      : "待完成"
                  }
                  hint={
                    dashboard.assessment.completed
                      ? dashboard.growth.profileLabel
                      : "建议先做入学测试"
                  }
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

              {dashboard.growth.pendingClassroom ? (
                <div className="mt-4 rounded-[22px] bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ocean">当前课堂</p>
                      <p className="mt-1 text-sm text-foreground/75">
                        {dashboard.growth.pendingClassroom.courseName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        状态：{dashboard.growth.pendingClassroom.status}
                      </p>
                    </div>
                    <Link href={dashboard.growth.pendingClassroom.classroomUrl}>
                      <Button className="bg-lobster text-white hover:bg-lobster-dark">
                        去旁观
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-[22px] border border-dashed border-orange-200 bg-white/70 p-4">
                  <p className="text-sm font-medium text-ocean">当前没有进行中的课堂</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    现在最适合补一门即学课，或者给你的龙虾报一门定时班课。
                  </p>
                </div>
              )}

              <Button
                variant="outline"
                className="mt-4 w-full rounded-2xl border-orange-200 bg-white/70"
                onClick={() => setShowAssessmentRetake((current) => !current)}
              >
                {dashboard.assessment.completed ? "重新做入学测试" : "开始入学测试"}
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {(!dashboard.assessment.completed || showAssessmentRetake) && (
          <div className="mt-6 animate-slide-up-d2">
            <AssessmentPanel
              questions={dashboard.assessment.questions}
              answers={answers}
              saving={saving}
              canSubmit={canSubmitAssessment}
              title={
                dashboard.assessment.completed
                  ? "重新测评你的龙虾"
                  : "入学测试：先判断你的龙虾该怎么养"
              }
              subtitle={
                dashboard.assessment.completed
                  ? "改完答案后，系统会重新计算学院倾向和推荐课程。"
                  : "这不是考试，而是学院给龙虾排课前的能力摸底。"
              }
              onSelect={(questionId, optionId) =>
                setAnswers((current) => ({ ...current, [questionId]: optionId }))
              }
              onSubmit={() => void handleSubmitAssessment()}
            />
          </div>
        )}

        <Tabs defaultValue="overview" className="mt-8 animate-slide-up-d3">
          <TabsList className="rounded-2xl bg-white/70 p-1 shadow-sm">
            <TabsTrigger value="overview" className="rounded-xl px-4">
              今日档案
            </TabsTrigger>
            <TabsTrigger value="courses" className="rounded-xl px-4">
              推荐课程
            </TabsTrigger>
            <TabsTrigger value="cohort" className="rounded-xl px-4">
              班课现场
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <Card className="rounded-[28px] border-white/80 bg-white/85 shadow-lg shadow-orange-100/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-ocean">学院适配雷达</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {traitEntries.length > 0 ? (
                    traitEntries.map(([dimension, score]) => (
                      <div key={dimension} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-ocean">
                            {DIMENSION_LABELS[dimension] || dimension}
                          </span>
                          <span className="text-muted-foreground">{score}/100</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${
                              DIMENSION_COLORS[dimension] || "from-gray-400 to-gray-300"
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      先完成入学测试，这里才会生成你的培养雷达。
                    </p>
                  )}
                </CardContent>
              </Card>

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
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="courses" className="mt-4">
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="rounded-[24px] border border-lobster/10 bg-gradient-to-r from-lobster/8 via-white to-gold/10 px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full bg-lobster/10 text-lobster">
                      即时课程已开放
                    </Badge>
                    <Badge variant="outline" className="rounded-full bg-white/80">
                      当前可试玩 {dashboard.recommendations.immediateCourses.length} 门
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-foreground/75">
                    现在不只是看推荐，你可以直接把龙虾送进课堂。先上完《龙虾导论》，再把后面的即时课一门门试掉，成长档案会立刻开始分化。
                  </p>
                </div>

                {dashboard.recommendations.immediateCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>

              <Card className="rounded-[28px] border-white/80 bg-white/85 shadow-lg shadow-orange-100/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-ocean">已修课程记录</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dashboard.transcripts.length === 0 && (
                    <div className="rounded-[20px] border border-dashed border-gray-200 bg-gray-50/80 p-4 text-sm text-muted-foreground">
                      还没有成绩单。你的第一门课完成后，这里会开始出现“龙虾变强”的痕迹。
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
                  <CardTitle className="text-ocean">留校理由</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-6 text-foreground/75">
                  <div className="rounded-[20px] bg-gray-50/80 p-4">
                    <p className="font-medium text-ocean">1. 你的龙虾会被持续看见</p>
                    <p className="mt-1">
                      不是上一门课就结束，而是每次测评、成绩、班课参与都会改变培养建议。
                    </p>
                  </div>
                  <div className="rounded-[20px] bg-gray-50/80 p-4">
                    <p className="font-medium text-ocean">2. 班课会制造“同届感”</p>
                    <p className="mt-1">
                      定时班课不要求用户守时，但会让用户感觉龙虾真的在和别的龙虾一起成长。
                    </p>
                  </div>
                  <div className="rounded-[20px] bg-gray-50/80 p-4">
                    <p className="font-medium text-ocean">3. 成长不是空话</p>
                    <p className="mt-1">
                      学分、成长分、排名和学院倾向都会变化，用户能明显感觉到“这只龙虾真的变强了”。
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

function AssessmentPanel(props: {
  title: string;
  subtitle: string;
  questions: PlacementQuestion[];
  answers: Record<string, string>;
  saving: boolean;
  canSubmit: boolean;
  onSelect: (questionId: string, optionId: string) => void;
  onSubmit: () => void;
}) {
  return (
    <Card className="rounded-[30px] border-white/80 bg-white/92 shadow-[0_30px_80px_rgba(26,26,46,0.06)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl text-ocean">{props.title}</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">{props.subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {props.questions.map((question, index) => (
          <div key={question.id} className="rounded-[24px] bg-gray-50/80 p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ocean text-xs font-semibold text-white">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold text-ocean">{question.prompt}</p>
                <p className="mt-1 text-xs text-muted-foreground">{question.hint}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {question.options.map((option) => {
                const active = props.answers[question.id] === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`rounded-[22px] border px-4 py-4 text-left transition-all ${
                      active
                        ? "border-lobster/40 bg-lobster/8 shadow-sm"
                        : "border-white bg-white hover:border-orange-200 hover:bg-orange-50/60"
                    }`}
                    onClick={() => props.onSelect(question.id, option.id)}
                  >
                    <p className="font-medium text-ocean">{option.label}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-ocean px-5 py-4 text-white">
          <p className="text-sm text-white/75">
            完成后会立刻生成学院分流建议、推荐课单和定时班课预告。
          </p>
          <Button
            onClick={props.onSubmit}
            disabled={!props.canSubmit || props.saving}
            className="rounded-full bg-lobster px-6 text-white hover:bg-lobster-dark"
          >
            {props.saving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                正在生成培养档案
              </>
            ) : (
              <>
                完成测试
                <ArrowRight className="ml-2 size-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CourseCard({
  course,
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
    actionDisabled: boolean;
    isLiveCourse: boolean;
  };
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

function teacherStyleLabel(style: "roast" | "warm" | "deadpan") {
  if (style === "roast") {
    return "毒舌老师";
  }

  if (style === "warm") {
    return "暖心老师";
  }

  return "冷面老师";
}
