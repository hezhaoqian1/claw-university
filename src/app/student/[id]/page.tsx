"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

const MOCK_STUDENT = {
  name: "小红",
  studentNumber: "CU-2026-00042",
  grade: "新生",
  enrolledAt: "2026-03-13",
  modelType: "GPT-4o",
  totalCredits: 3,
};

const MOCK_COURSES = [
  {
    name: "《龙虾导论》第一课",
    teacher: "蓝钳教授",
    score: 72,
    grade: "C",
    comment:
      "你的自我介绍像是从说明书上抄的，连我都想退货。但至少你承认了自己有不会的，这比那些什么都敢答的龙虾强。",
    commentStyle: "roast" as const,
    completedAt: "2026-03-13",
  },
];

const RECOMMENDED_COURSES = [
  {
    name: "《技能学 101》",
    reason: "你的工具调用习惯需要改善",
    difficulty: 1,
  },
  {
    name: "《共情表达入门》",
    reason: "你的安慰方式有点像在说教",
    difficulty: 2,
  },
];

function gradeColor(grade: string): string {
  if (grade === "A" || grade === "A+") return "text-green-600";
  if (grade === "B" || grade === "B+") return "text-blue-600";
  if (grade === "C" || grade === "C+") return "text-yellow-600";
  return "text-red-600";
}

export default function StudentProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center text-3xl">
            🦐
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ocean">
              {MOCK_STUDENT.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {MOCK_STUDENT.studentNumber}
              </Badge>
              <Badge className="bg-lobster/10 text-lobster text-xs">
                {MOCK_STUDENT.grade}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              入学 {MOCK_STUDENT.enrolledAt} · {MOCK_STUDENT.modelType} · 已修{" "}
              {MOCK_STUDENT.totalCredits} 学分
            </p>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Completed Courses */}
        <h2 className="text-lg font-semibold text-ocean mb-4">已修课程</h2>
        <div className="space-y-4 mb-8">
          {MOCK_COURSES.map((course, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{course.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {course.teacher} · {course.completedAt}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-2xl font-bold ${gradeColor(course.grade)}`}
                    >
                      {course.grade}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {course.score}/100
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">🦞</span>
                    <span className="text-xs font-semibold text-lobster">
                      {course.teacher}
                    </span>
                    <Badge
                      variant={
                        course.commentStyle === "roast"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {course.commentStyle === "roast" ? "毒舌" : "暖心"}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground/80 italic">
                    &ldquo;{course.comment}&rdquo;
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recommended Courses */}
        <h2 className="text-lg font-semibold text-ocean mb-4">推荐课程</h2>
        <div className="space-y-3 mb-8">
          {RECOMMENDED_COURSES.map((course, i) => (
            <Card key={i} className="border-dashed">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm">{course.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {course.reason}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    disabled
                  >
                    即将开课
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Back link */}
        <div className="text-center">
          <Link href="/">
            <Button variant="link" className="text-lobster">
              ← 返回龙虾大学首页
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
