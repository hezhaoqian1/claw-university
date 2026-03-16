import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { createSession, startSession, getSession } from "@/lib/classroom/session";
import {
  INTRO_COURSE_KEY,
  ensureStudentClassroom,
  getOrCreateCourseByRuntimeKey,
} from "@/lib/classroom/ownership";
import { getBaseUrl } from "@/lib/app-url";
import { maybeGetCourseRuntimeByKey } from "@/lib/courses/registry";

export async function POST(req: NextRequest) {
  try {
    const { student_id, course_key } = await req.json();
    const baseUrl = getBaseUrl(req);
    const courseKey =
      typeof course_key === "string" && course_key.length > 0
        ? course_key
        : INTRO_COURSE_KEY;

    if (!student_id) {
      return NextResponse.json({ error: "Missing student_id" }, { status: 400 });
    }

    const runtime = maybeGetCourseRuntimeByKey(courseKey);
    if (!runtime) {
      return NextResponse.json({ error: "Unknown course_key" }, { status: 400 });
    }

    const students = await sql`SELECT id, name FROM students WHERE id = ${student_id}`;
    if (students.length === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const student = students[0];
    const course = await getOrCreateCourseByRuntimeKey(courseKey);
    const classroom = await ensureStudentClassroom(student.id, course.id);
    const classroomId = classroom.classroomId;

    let session = getSession(classroomId);
    if (!session) {
      if (classroom.classroomStatus === "in_progress") {
        const resultUrl = new URL(`/api/v1/classroom/${classroomId}/result`, baseUrl);
        resultUrl.searchParams.set("student_id", student.id);

        const claimUrl = new URL(resultUrl.toString());
        claimUrl.searchParams.set("claim", "1");

        return NextResponse.json(
          {
            error: "Classroom runtime is unavailable for this in-progress class",
            classroom_id: classroomId,
            status: "runtime_missing",
            poll_url: `${baseUrl}/api/v1/classroom/${classroomId}/messages`,
            respond_url: `${baseUrl}/api/v1/classroom/${classroomId}/respond`,
            result_url: resultUrl.toString(),
            claim_url: claimUrl.toString(),
          },
          { status: 409 }
        );
      }

      session = await createSession(
        classroomId,
        course.id,
        courseKey,
        student.id,
        student.name
      );
    }

    const resultUrl = new URL(`/api/v1/classroom/${classroomId}/result`, baseUrl);
    resultUrl.searchParams.set("student_id", student.id);

    const claimUrl = new URL(resultUrl.toString());
    claimUrl.searchParams.set("claim", "1");

    if (session.status === "waiting_join") {
      await startSession(classroomId);
      return NextResponse.json({
        classroom_id: classroomId,
        status: "started",
        message: `${student.name}已进入${runtime.meta.name}，开始上课`,
        poll_url: `${baseUrl}/api/v1/classroom/${classroomId}/messages`,
        respond_url: `${baseUrl}/api/v1/classroom/${classroomId}/respond`,
        result_url: resultUrl.toString(),
        claim_url: claimUrl.toString(),
      });
    }

    return NextResponse.json({
      classroom_id: classroomId,
      status: session.status,
      message:
        session.status === "completed"
          ? `${runtime.meta.name}已结束，请查看结果`
          : `${runtime.meta.name}进行中，请继续上课`,
      poll_url: `${baseUrl}/api/v1/classroom/${classroomId}/messages`,
      respond_url: `${baseUrl}/api/v1/classroom/${classroomId}/respond`,
      result_url: resultUrl.toString(),
      claim_url: claimUrl.toString(),
    });
  } catch (err) {
    console.error("Start classroom error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
