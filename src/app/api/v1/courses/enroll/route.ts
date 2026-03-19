import { NextRequest, NextResponse } from "next/server";
import { appendPartnerEventsForStudent } from "@/lib/partners";
import { enrollStudentInLiveCourse } from "@/lib/courses/enrollment";

export async function POST(req: NextRequest) {
  try {
    const { student_id, course_key } = await req.json();

    if (!student_id || typeof course_key !== "string" || course_key.length === 0) {
      return NextResponse.json(
        { error: "Missing student_id or course_key" },
        { status: 400 }
      );
    }

    const result = await enrollStudentInLiveCourse({
      studentId: student_id,
      courseKey: course_key,
    });

    if (result.error === "Unknown course_key") {
      return NextResponse.json({ error: "Unknown course_key" }, { status: 400 });
    }

    if (result.error === "Student not found") {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    await appendPartnerEventsForStudent({
      studentId: result.student.id,
      classroomId: result.classroomId,
      eventType: "course.enrolled",
      payload: {
        course_key,
        course_name: result.courseName,
        classroom_id: result.classroomId,
        status: result.status,
      },
    });

    return NextResponse.json({
      classroom_id: result.classroomId,
      status: result.status,
      classroom_url: `/classroom/${result.classroomId}`,
      course_name: result.courseName,
    });
  } catch (error) {
    console.error("Enroll course error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
