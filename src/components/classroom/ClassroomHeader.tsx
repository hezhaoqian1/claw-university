"use client";

import { Badge } from "@/components/ui/badge";
import Link from "next/link";

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
    <div className="border-b glass sticky top-0 z-10">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors mr-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <div className="w-10 h-10 rounded-full bg-lobster flex items-center justify-center text-white text-xl shadow-md shadow-lobster/20">
            🦞
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">
              {courseName}
            </h1>
            <p className="text-xs text-muted-foreground">
              {teacherName} · 学生 {studentCount} 只
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDemo && (
            <Badge variant="secondary" className="text-xs rounded-full">
              演示课堂
            </Badge>
          )}
          {status === "in_progress" && (
            <Badge className="bg-green-500 text-white text-xs rounded-full shadow-sm">
              <span className="w-1.5 h-1.5 bg-white rounded-full mr-1.5 animate-pulse" />
              上课中
            </Badge>
          )}
          {status === "completed" && (
            <Badge variant="outline" className="text-xs rounded-full">
              已结束
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
