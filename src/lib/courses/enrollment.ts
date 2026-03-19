import sql from "@/lib/db";
import { createSession, getSession } from "@/lib/classroom/session";
import {
  ensureStudentClassroom,
  getOrCreateCourseByRuntimeKey,
} from "@/lib/classroom/ownership";
import { maybeGetCourseRuntimeByKey } from "@/lib/courses/registry";

export async function enrollStudentInLiveCourse(params: {
  studentId: string;
  courseKey: string;
}) {
  const runtime = maybeGetCourseRuntimeByKey(params.courseKey);
  if (!runtime) {
    return { error: "Unknown course_key" as const };
  }

  const students = await sql`
    SELECT id, name
    FROM students
    WHERE id = ${params.studentId}
  `;
  if (students.length === 0) {
    return { error: "Student not found" as const };
  }

  const student = students[0];
  const course = await getOrCreateCourseByRuntimeKey(params.courseKey);
  const classroom = await ensureStudentClassroom(student.id, course.id);
  const classroomId = classroom.classroomId;

  let session = await getSession(classroomId);

  if (!session) {
    if (classroom.classroomStatus === "in_progress") {
      return {
        student: { id: student.id as string, name: student.name as string },
        courseName: runtime.meta.name,
        classroomId,
        status: "in_progress" as const,
      };
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
      params.courseKey,
      student.id,
      student.name,
      hasTeacherPrelude ? { restorePrestart: true } : { prestart: true }
    );
  }

  return {
    student: { id: student.id as string, name: student.name as string },
    courseName: runtime.meta.name,
    classroomId,
    status:
      session.status === "waiting_join_interactive"
        ? ("prestarting" as const)
        : session.status,
  };
}
