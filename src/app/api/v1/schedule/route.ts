import { NextRequest, NextResponse } from "next/server";
import { buildSchedulePreview } from "@/lib/student/dashboard";

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("student_id") || undefined;

  try {
    const schedule = await buildSchedulePreview(studentId);

    return NextResponse.json({
      course_catalog: schedule.recommendations,
      academies: schedule.academies.map((academy) => ({
        id: academy.id,
        name: academy.name,
        motto: academy.motto,
        summary: academy.summary,
      })),
      personalized_for: schedule.personalizedFor,
      generated_at: schedule.generatedAt,
      hint: "课程卡片合同现在由 experience/runtime/action 三层组成，前端可以按 offeringMode 自己分组。",
    });
  } catch (error) {
    console.error("Get academy schedule error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
