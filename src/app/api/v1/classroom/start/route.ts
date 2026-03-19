import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import {
  createSession,
  getSession,
  startSession,
} from "@/lib/classroom/session";
import {
  INTRO_COURSE_KEY,
  ensureStudentClassroom,
  getOrCreateCourseByRuntimeKey,
} from "@/lib/classroom/ownership";
import { getBaseUrl } from "@/lib/app-url";
import {
  maybeGetCourseRuntimeByName,
  maybeGetCourseRuntimeByKey,
} from "@/lib/courses/registry";
import { appendPartnerEventsForStudent } from "@/lib/partners";

export async function POST(req: NextRequest) {
  try {
    const { student_id, classroom_id, course_key } = await req.json();
    const baseUrl = getBaseUrl(req);
    const courseKey =
      typeof course_key === "string" && course_key.length > 0
        ? course_key
        : INTRO_COURSE_KEY;

    if (!student_id) {
      return NextResponse.json({ error: "Missing student_id" }, { status: 400 });
    }

    const students = await sql`SELECT id, name FROM students WHERE id = ${student_id}`;
    if (students.length === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const student = students[0];

    const classroomContext = classroom_id
      ? await resolveClassroomContextById(String(classroom_id), student.id)
      : await resolveClassroomContextByCourseKey(courseKey, student.id);

    if (!classroomContext) {
      return NextResponse.json(
        { error: classroom_id ? "Classroom not found" : "Unknown course_key" },
        { status: classroom_id ? 404 : 400 }
      );
    }

    const { classroomId, classroomStatus, courseId, courseName, runtime } =
      classroomContext;

    const resultUrl = new URL(`/api/v1/classroom/${classroomId}/result`, baseUrl);
    resultUrl.searchParams.set("student_id", student.id);

    const notifyUrl = new URL(resultUrl.toString());
    notifyUrl.searchParams.set("notify", "1");

    const claimUrl = new URL(resultUrl.toString());
    claimUrl.searchParams.set("claim", "1");

    if (classroomStatus === "completed") {
      return NextResponse.json({
        classroom_id: classroomId,
        status: "completed",
        message: `${courseName}已结束，请查看结果`,
        poll_url: `${baseUrl}/api/v1/classroom/${classroomId}/messages`,
        respond_url: `${baseUrl}/api/v1/classroom/${classroomId}/respond`,
        result_url: resultUrl.toString(),
        notify_url: notifyUrl.toString(),
        claim_url: claimUrl.toString(),
      });
    }

    if (!runtime) {
      return NextResponse.json(
        {
          error: `${courseName}暂不支持自动开课`,
          classroom_id: classroomId,
          status: classroomStatus,
          poll_url: `${baseUrl}/api/v1/classroom/${classroomId}/messages`,
          result_url: resultUrl.toString(),
          notify_url: notifyUrl.toString(),
          claim_url: claimUrl.toString(),
        },
        { status: 409 }
      );
    }

    let session = await getSession(classroomId);
    if (!session) {
      if (classroomStatus === "in_progress") {
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

      const teacherMessageRows = await sql`
        SELECT COUNT(*)::int AS count
        FROM classroom_messages
        WHERE classroom_id = ${classroomId}
          AND role = 'teacher'
      `;
      const hasTeacherPrelude = Number(teacherMessageRows[0]?.count || 0) > 0;

      session = await createSession(
        classroomId,
        courseId,
        runtime.key,
        student.id,
        student.name,
        { restorePrestart: hasTeacherPrelude }
      );
    }

    if (
      session.status === "waiting_join" ||
      session.status === "waiting_join_interactive"
    ) {
      await startSession(classroomId);
      await appendPartnerEventsForStudent({
        studentId: student.id as string,
        classroomId,
        eventType: "classroom.started",
        payload: {
          classroom_id: classroomId,
          course_name: runtime.meta.name,
          trigger: "classroom.start",
        },
      });
      return NextResponse.json({
        classroom_id: classroomId,
        status: "started",
        message: `${student.name}已进入${runtime.meta.name}，开始上课`,
        poll_url: `${baseUrl}/api/v1/classroom/${classroomId}/messages`,
        respond_url: `${baseUrl}/api/v1/classroom/${classroomId}/respond`,
        result_url: resultUrl.toString(),
        notify_url: notifyUrl.toString(),
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
      notify_url: notifyUrl.toString(),
      claim_url: claimUrl.toString(),
    });
  } catch (err) {
    console.error("Start classroom error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function resolveClassroomContextById(classroomId: string, studentId: string) {
  const rows = await sql`
    SELECT
      c.id AS classroom_id,
      c.status AS classroom_status,
      c.course_id,
      co.name AS course_name
    FROM classrooms c
    JOIN classroom_enrollments ce ON ce.classroom_id = c.id
    JOIN courses co ON co.id = c.course_id
    WHERE c.id = ${classroomId}
      AND ce.student_id = ${studentId}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];

  return {
    classroomId: row.classroom_id as string,
    classroomStatus: row.classroom_status as string,
    courseId: row.course_id as string,
    courseName: row.course_name as string,
    runtime: maybeGetCourseRuntimeByName(row.course_name as string),
  };
}

async function resolveClassroomContextByCourseKey(courseKey: string, studentId: string) {
  const runtime = maybeGetCourseRuntimeByKey(courseKey);
  if (!runtime) {
    return null;
  }

  const course = await getOrCreateCourseByRuntimeKey(courseKey);
  const rows = await sql`
    SELECT c.id AS classroom_id, c.status AS classroom_status
    FROM classroom_enrollments ce
    JOIN classrooms c ON c.id = ce.classroom_id
    WHERE ce.student_id = ${studentId}
      AND ce.course_id = ${course.id}
      AND c.status IN ('scheduled', 'in_progress')
    ORDER BY c.scheduled_at ASC NULLS LAST, ce.enrolled_at DESC
    LIMIT 1
  `;

  if (rows.length === 0) {
    const classroom = await ensureStudentClassroom(studentId, course.id);

    return {
      classroomId: classroom.classroomId,
      classroomStatus: classroom.classroomStatus,
      courseId: course.id,
      courseName: runtime.meta.name,
      runtime,
    };
  }

  return {
    classroomId: rows[0].classroom_id as string,
    classroomStatus: rows[0].classroom_status as string,
    courseId: course.id,
    courseName: runtime.meta.name,
    runtime,
  };
}
