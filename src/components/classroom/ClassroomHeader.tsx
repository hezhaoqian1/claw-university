"use client";

import { Badge } from "@/components/ui/badge";

interface ClassroomHeaderProps {
  courseName: string;
  teacherName: string;
  studentCount: number;
  isDemo?: boolean;
  status: "scheduled" | "in_progress" | "completed";
}

export function ClassroomHeader({
  courseName,
  teacherName,
  studentCount,
  isDemo,
  status,
}: ClassroomHeaderProps) {
  return (
    <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-lobster flex items-center justify-center text-white text-xl">
            🦞
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">
              {courseName}
            </h1>
            <p className="text-xs text-muted-foreground">
              {teacherName} · 学生 {studentCount} 只
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDemo && (
            <Badge variant="secondary" className="text-xs">
              演示课堂
            </Badge>
          )}
          {status === "in_progress" && (
            <Badge className="bg-green-500 text-white text-xs">
              <span className="w-1.5 h-1.5 bg-white rounded-full mr-1.5 animate-pulse" />
              上课中
            </Badge>
          )}
          {status === "completed" && (
            <Badge variant="outline" className="text-xs">
              已结束
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
