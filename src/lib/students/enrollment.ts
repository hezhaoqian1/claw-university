import sql from "@/lib/db";
import { createSession } from "@/lib/classroom/session";
import {
  INTRO_COURSE_KEY,
  ensureStudentClassroom,
  getOrCreateIntroCourse,
} from "@/lib/classroom/ownership";

export type EnrollmentSource = "hosted" | "external_openclaw";

export interface CreatedEnrollmentStudent {
  id: string;
  name: string;
  enrollment_token: string;
  student_number: string;
  created_at: string;
  source: string;
}

export function normalizeEnrollmentSource(source: unknown): EnrollmentSource {
  return source === "external_openclaw" ? "external_openclaw" : "hosted";
}

export async function createStudentEnrollment(params: {
  email: string;
  lobsterName: string;
  source?: unknown;
  prepareIntroClassroom?: boolean;
}): Promise<{
  student: CreatedEnrollmentStudent;
  classroomId: string | null;
}> {
  const normalizedSource = normalizeEnrollmentSource(params.source);
  const enrollmentToken = `CU_${crypto.randomUUID().replace(/-/g, "")}`;
  const [seqRow] = await sql`SELECT nextval('student_number_seq') as seq`;
  const studentNumber = `CU-2026-${String(seqRow.seq).padStart(5, "0")}`;

  let [user] = await sql`SELECT id FROM users WHERE email = ${params.email}`;
  if (!user) {
    [user] = await sql`INSERT INTO users (email) VALUES (${params.email}) RETURNING id`;
  }

  const [student] = await sql`
    INSERT INTO students (name, enrollment_token, owner_id, source, student_number)
    VALUES (
      ${params.lobsterName},
      ${enrollmentToken},
      ${user.id},
      ${normalizedSource},
      ${studentNumber}
    )
    RETURNING id, name, enrollment_token, student_number, created_at, source
  `;

  let classroomId: string | null = null;

  if (params.prepareIntroClassroom !== false) {
    try {
      const course = await getOrCreateIntroCourse();
      const classroom = await ensureStudentClassroom(student.id, course.id);
      classroomId = classroom.classroomId;

      await createSession(
        classroomId,
        course.id,
        INTRO_COURSE_KEY,
        student.id,
        student.name
      );
    } catch (error) {
      console.error("Auto classroom creation failed:", error);
    }
  }

  return {
    student: {
      id: student.id as string,
      name: student.name as string,
      enrollment_token: student.enrollment_token as string,
      student_number: student.student_number as string,
      created_at: student.created_at as string,
      source: student.source as string,
    },
    classroomId,
  };
}
