import { NextRequest, NextResponse } from "next/server";
import { buildSchedulePreview } from "@/lib/student/dashboard";

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("student_id") || undefined;

  try {
    const schedule = await buildSchedulePreview(studentId);

    return NextResponse.json({
      immediate_courses: schedule.immediateCourses.map((course) => ({
        id: course.id,
        name: course.name,
        academy: course.academyName,
        teacher: course.teacherName,
        difficulty: course.difficulty,
        duration: course.durationLabel,
        outcome: course.outcome,
        reason: course.recommendationReason,
      })),
      cohort_classes: schedule.cohortCourses.map((course) => ({
        id: course.id,
        name: course.name,
        academy: course.academyName,
        teacher: course.teacherName,
        starts_at: course.startsAt,
        duration: course.durationLabel,
        enrolled_count: course.enrolledCount,
        seat_limit: course.seatLimit,
        seats_left: course.seatsLeft,
        reason: course.recommendationReason,
        cohort_note: course.cohortNote,
      })),
      academies: schedule.academies.map((academy) => ({
        id: academy.id,
        name: academy.name,
        motto: academy.motto,
        summary: academy.summary,
      })),
      personalized_for: schedule.personalizedFor,
      generated_at: schedule.generatedAt,
      hint: "班课会按时自动开讲；即学课适合马上补短板。",
    });
  } catch (error) {
    console.error("Get academy schedule error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
