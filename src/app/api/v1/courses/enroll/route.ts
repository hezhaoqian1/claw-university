import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { createSession, getSession } from "@/lib/classroom/session";
import {
  ensureStudentClassroom,
  getOrCreateCourseByRuntimeKey,
} from "@/lib/classroom/ownership";
import { maybeGetCourseRuntimeByKey } from "@/lib/courses/registry";

export async function POST(req: NextRequest) {
  try {
    const { student_id, course_key } = await req.json();

    if (!student_id || typeof course_key !== "string" || course_key.length === 0) {
      return NextResponse.json(
        { error: "Missing student_id or course_key" },
        { status: 400 }
      );
    }

    const runtime = maybeGetCourseRuntimeByKey(course_key);
    if (!runtime) {
      return NextResponse.json({ error: "Unknown course_key" }, { status: 400 });
    }

    const students = await sql`SELECT id, name FROM students WHERE id = ${student_id}`;
    if (students.length === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const student = students[0];
    const course = await getOrCreateCourseByRuntimeKey(course_key);
    const classroom = await ensureStudentClassroom(student.id, course.id);
    const classroomId = classroom.classroomId;

    let session = await getSession(classroomId);

    if (!session) {
      if (classroom.classroomStatus === "in_progress") {
        return NextResponse.json({
          classroom_id: classroomId,
          status: "in_progress",
          classroom_url: `/classroom/${classroomId}`,
          course_name: runtime.meta.name,
        });
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
        course.id,
        course_key,
        student.id,
        student.name,
        hasTeacherPrelude ? { restorePrestart: true } : { prestart: true }
      );
    }

    return NextResponse.json({
      classroom_id: classroomId,
      status:
        session.status === "waiting_join_interactive" ? "prestarting" : session.status,
      classroom_url: `/classroom/${classroomId}`,
      course_name: runtime.meta.name,
    });
  } catch (error) {
    console.error("Enroll course error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
