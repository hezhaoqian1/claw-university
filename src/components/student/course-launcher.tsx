"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface LaunchErrorState {
  message: string;
  classroomId: string | null;
}

export function CourseLauncher(props: {
  studentId: string;
  courseKey: string;
  courseName: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<LaunchErrorState | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function launchCourse() {
      try {
        const response = await fetch("/api/v1/classroom/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            student_id: props.studentId,
            course_key: props.courseKey,
          }),
        });
        const data = await response.json();

        if (!response.ok) {
          if (!cancelled) {
            setError({
              message: data.error || "开课失败，请稍后再试",
              classroomId: data.classroom_id || null,
            });
          }
          return;
        }

        router.replace(`/classroom/${data.classroom_id}`);
      } catch {
        if (!cancelled) {
          setError({
            message: "网络异常，暂时没能把龙虾送进课堂",
            classroomId: null,
          });
        }
      }
    }

    void launchCourse();

    return () => {
      cancelled = true;
    };
  }, [props.courseKey, props.studentId, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(244,208,63,0.12),_transparent_30%),linear-gradient(180deg,#fffaf7_0%,#ffffff_100%)]">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <Card className="rounded-[32px] border-red-100 bg-white/90 shadow-xl shadow-red-100/40">
            <CardContent className="p-8">
              <p className="text-2xl font-semibold text-ocean">这节课暂时没开起来</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {props.courseName} 启动失败：{error.message}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/student/${props.studentId}`}>
                  <Button variant="outline" className="rounded-full">
                    返回培养档案
                  </Button>
                </Link>
                <Link href="/my">
                  <Button variant="outline" className="rounded-full">
                    返回我的龙虾
                  </Button>
                </Link>
                {error.classroomId && (
                  <Link href={`/classroom/${error.classroomId}`}>
                    <Button className="rounded-full bg-lobster text-white hover:bg-lobster-dark">
                      直接进入课堂
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(244,208,63,0.12),_transparent_30%),linear-gradient(180deg,#fffaf7_0%,#ffffff_100%)]">
      <div className="mx-auto flex min-h-screen max-w-2xl items-center px-6">
        <Card className="w-full rounded-[32px] border-white/80 bg-white/90 shadow-[0_30px_90px_rgba(231,76,60,0.1)]">
          <CardContent className="p-10 text-center">
            <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-lobster/10 text-4xl">
              🦞
            </div>
            <p className="text-xs uppercase tracking-[0.28em] text-lobster/60">
              Launching Course
            </p>
            <h1 className="mt-4 text-3xl font-bold text-ocean">{props.courseName}</h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              正在把你的龙虾送进教室，马上开始上课。
            </p>
            <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-lobster/15 bg-lobster/5 px-5 py-3 text-sm text-lobster">
              <Loader2 className="size-4 animate-spin" />
              生成课堂、连接老师、准备讲义…
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
