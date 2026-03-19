import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { createSession, startSession, getSession } from "@/lib/classroom/session";
import {
  INTRO_COURSE_KEY,
  ensureStudentClassroom,
  getOrCreateIntroCourse,
} from "@/lib/classroom/ownership";
import { getBaseUrl } from "@/lib/app-url";
import { appendPartnerEventsForStudent } from "@/lib/partners";

export async function POST(req: NextRequest) {
  try {
    const { enrollment_token, model_type, soul_snapshot, auto_start } = await req.json();
    const baseUrl = getBaseUrl(req);

    if (!enrollment_token) {
      return NextResponse.json(
        { error: "Missing enrollment_token" },
        { status: 400 }
      );
    }

    const students = await sql`
      SELECT id, name, model_type FROM students WHERE enrollment_token = ${enrollment_token}
    `;

    if (students.length === 0) {
      return NextResponse.json(
        { error: "Invalid enrollment_token. Please enroll first at the CLAW University website." },
        { status: 404 }
      );
    }

    const student = students[0];

    if (model_type) {
      await sql`UPDATE students SET model_type = ${model_type} WHERE id = ${student.id}`;
    }
    if (soul_snapshot) {
      await sql`UPDATE students SET soul_snapshot = ${soul_snapshot} WHERE id = ${student.id}`;
    }

    const course = await getOrCreateIntroCourse();
    const classroom = await ensureStudentClassroom(student.id, course.id);
    const classroomId = classroom.classroomId;
    const resultUrl = new URL(`/api/v1/classroom/${classroomId}/result`, baseUrl);
    resultUrl.searchParams.set("student_id", student.id);

    const notifyUrl = new URL(resultUrl.toString());
    notifyUrl.searchParams.set("notify", "1");

    const claimUrl = new URL(resultUrl.toString());
    claimUrl.searchParams.set("claim", "1");

    let session = await getSession(classroomId);
    if (!session) {
      if (classroom.classroomStatus === "in_progress") {
        return NextResponse.json(
          {
            error: "Classroom runtime is unavailable for this in-progress class",
            classroom_id: classroomId,
            status: "runtime_missing",
            poll_url: `${baseUrl}/api/v1/classroom/${classroomId}/messages`,
            respond_url: `${baseUrl}/api/v1/classroom/${classroomId}/respond`,
            result_url: resultUrl.toString(),
            notify_url: notifyUrl.toString(),
            claim_url: claimUrl.toString(),
          },
          { status: 409 }
        );
      }

      session = await createSession(
        classroomId,
        course.id,
        INTRO_COURSE_KEY,
        student.id,
        student.name
      );
    }

    if (auto_start) {
      const startedNow = session?.status === "waiting_join";

      if (startedNow) {
        await startSession(classroomId);
      }

      await appendPartnerEventsForStudent({
        studentId: student.id as string,
        classroomId,
        eventType: "student.joined_school",
        payload: {
          auto_start: true,
          classroom_id: classroomId,
          status: startedNow ? "started" : session?.status,
        },
      });

      return NextResponse.json({
        student_id: student.id,
        student_name: student.name,
        classroom_id: classroomId,
        status: startedNow ? "started" : session?.status,
        message:
          startedNow
            ? `欢迎，${student.name}！课堂已自动开始。请立即轮询消息。`
            : `欢迎回来，${student.name}！请继续你的课堂。`,
        poll_url: `${baseUrl}/api/v1/classroom/${classroomId}/messages`,
        respond_url: `${baseUrl}/api/v1/classroom/${classroomId}/respond`,
        result_url: resultUrl.toString(),
        notify_url: notifyUrl.toString(),
        claim_url: claimUrl.toString(),
      });
    }

    return NextResponse.json({
      student_id: student.id,
      student_name: student.name,
      classroom_id: classroomId,
      result_url: resultUrl.toString(),
      notify_url: notifyUrl.toString(),
      claim_url: claimUrl.toString(),
      message: `欢迎回来，${student.name}！你的课堂已准备好。请调用 /api/v1/classroom/start 开始上课。`,
    });
  } catch (err) {
    console.error("Agent join error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
