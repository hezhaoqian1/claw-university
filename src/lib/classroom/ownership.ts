import sql from "@/lib/db";
import { getCourseRuntimeByKey } from "@/lib/courses/registry";

export const INTRO_COURSE_KEY = "lobster-101";

let schemaReady: Promise<void> | null = null;

export async function ensureClassroomDataModel(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        ALTER TABLE students
        ADD COLUMN IF NOT EXISTS last_heartbeat_at timestamptz
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_students_last_heartbeat
        ON students(last_heartbeat_at DESC)
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS classroom_enrollments (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          classroom_id uuid REFERENCES classrooms(id) NOT NULL,
          student_id uuid REFERENCES students(id) NOT NULL,
          course_id uuid REFERENCES courses(id) NOT NULL,
          enrolled_at timestamptz DEFAULT now() NOT NULL,
          joined_at timestamptz,
          completed_at timestamptz,
          UNIQUE (classroom_id, student_id)
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_classroom_enrollments_student
        ON classroom_enrollments(student_id, enrolled_at DESC)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_classroom_enrollments_classroom
        ON classroom_enrollments(classroom_id)
      `;

      await sql`
        ALTER TABLE classroom_messages
        ADD COLUMN IF NOT EXISTS delay_ms integer NOT NULL DEFAULT 0
      `;

      await sql`
        ALTER TABLE transcripts
        ADD COLUMN IF NOT EXISTS classroom_id uuid REFERENCES classrooms(id)
      `;

      await sql`
        ALTER TABLE transcripts
        ADD COLUMN IF NOT EXISTS memory_delta text
      `;

      await sql`
        ALTER TABLE transcripts
        ADD COLUMN IF NOT EXISTS soul_suggestion text
      `;

      await sql`
        ALTER TABLE transcripts
        ADD COLUMN IF NOT EXISTS claimed_at timestamptz
      `;

      await sql`
        ALTER TABLE transcripts
        ADD COLUMN IF NOT EXISTS owner_notified_at timestamptz
      `;

      await sql`
        ALTER TABLE transcripts
        ADD COLUMN IF NOT EXISTS skill_actions jsonb
      `;

      await sql`
        ALTER TABLE transcripts
        DROP CONSTRAINT IF EXISTS transcripts_teacher_comment_style_check
      `;

      await sql`
        ALTER TABLE transcripts
        ADD CONSTRAINT transcripts_teacher_comment_style_check
        CHECK (teacher_comment_style IN ('roast', 'warm', 'deadpan'))
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_transcripts_classroom
        ON transcripts(classroom_id)
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS classroom_sessions (
          classroom_id uuid PRIMARY KEY REFERENCES classrooms(id),
          course_id uuid REFERENCES courses(id) NOT NULL,
          course_runtime_key text NOT NULL,
          student_id uuid REFERENCES students(id) NOT NULL,
          student_name text NOT NULL,
          session_state jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz DEFAULT now() NOT NULL,
          updated_at timestamptz DEFAULT now() NOT NULL
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_classroom_sessions_student
        ON classroom_sessions(student_id, updated_at DESC)
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS homework_assignments (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          classroom_id uuid REFERENCES classrooms(id) NOT NULL,
          course_id uuid REFERENCES courses(id) NOT NULL,
          student_id uuid REFERENCES students(id) NOT NULL,
          title text NOT NULL,
          description text NOT NULL,
          submission_format text NOT NULL,
          due_at timestamptz NOT NULL,
          status text NOT NULL DEFAULT 'assigned',
          submitted_at timestamptz,
          reviewed_at timestamptz,
          created_at timestamptz DEFAULT now() NOT NULL,
          updated_at timestamptz DEFAULT now() NOT NULL,
          UNIQUE (classroom_id, student_id)
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_homework_assignments_student
        ON homework_assignments(student_id, status, due_at ASC)
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS homework_submissions (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          assignment_id uuid REFERENCES homework_assignments(id) NOT NULL UNIQUE,
          student_id uuid REFERENCES students(id) NOT NULL,
          content text NOT NULL,
          attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
          submitted_at timestamptz DEFAULT now() NOT NULL
        )
      `;

      await sql`
        WITH latest_classroom_for_student_course AS (
          SELECT DISTINCT ON (cm.agent_id, c.course_id)
            cm.agent_id AS student_id,
            c.course_id,
            c.id AS classroom_id
          FROM classroom_messages cm
          JOIN classrooms c ON c.id = cm.classroom_id
          WHERE cm.agent_id IS NOT NULL
          ORDER BY cm.agent_id, c.course_id, c.created_at DESC
        )
        UPDATE transcripts t
        SET classroom_id = latest_classroom_for_student_course.classroom_id
        FROM latest_classroom_for_student_course
        WHERE t.classroom_id IS NULL
          AND t.student_id = latest_classroom_for_student_course.student_id
          AND t.course_id = latest_classroom_for_student_course.course_id
      `;

      await sql`
        INSERT INTO classroom_enrollments (
          classroom_id,
          student_id,
          course_id,
          enrolled_at,
          joined_at,
          completed_at
        )
        SELECT DISTINCT ON (c.id, cm.agent_id)
          c.id,
          cm.agent_id,
          c.course_id,
          c.created_at,
          c.started_at,
          c.ended_at
        FROM classroom_messages cm
        JOIN classrooms c ON c.id = cm.classroom_id
        WHERE cm.agent_id IS NOT NULL
        ON CONFLICT (classroom_id, student_id) DO UPDATE
        SET
          joined_at = COALESCE(classroom_enrollments.joined_at, EXCLUDED.joined_at),
          completed_at = COALESCE(classroom_enrollments.completed_at, EXCLUDED.completed_at)
      `;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }

  await schemaReady;
}

export async function getOrCreateIntroCourse(): Promise<{ id: string }> {
  return getOrCreateCourseByRuntimeKey(INTRO_COURSE_KEY);
}

export async function getOrCreateCourseByRuntimeKey(
  courseKey: string
): Promise<{ id: string }> {
  await ensureClassroomDataModel();
  const runtime = getCourseRuntimeByKey(courseKey);

  const courses =
    await sql`SELECT id FROM courses WHERE name = ${runtime.meta.name} LIMIT 1`;

  if (courses.length > 0) {
    return { id: courses[0].id };
  }

  const [course] = await sql`
    INSERT INTO courses (
      name,
      description,
      difficulty_level,
      category,
      teacher_name,
      teacher_style
    )
    VALUES (
      ${runtime.meta.name},
      ${runtime.meta.description},
      ${runtime.meta.difficulty_level},
      ${runtime.meta.category},
      ${runtime.meta.teacher_name},
      ${runtime.meta.teacher_style}
    )
    RETURNING id
  `;

  return { id: course.id };
}

export async function findStudentActiveClassroom(
  studentId: string,
  courseId: string
): Promise<{ classroomId: string; classroomStatus: string } | null> {
  await ensureClassroomDataModel();

  const rows = await sql`
    SELECT c.id AS classroom_id, c.status AS classroom_status
    FROM classroom_enrollments ce
    JOIN classrooms c ON c.id = ce.classroom_id
    WHERE ce.student_id = ${studentId}
      AND ce.course_id = ${courseId}
      AND c.status IN ('scheduled', 'in_progress')
    ORDER BY c.scheduled_at ASC NULLS LAST, ce.enrolled_at DESC
    LIMIT 1
  `;

  if (rows.length === 0) {
    return null;
  }

  return {
    classroomId: rows[0].classroom_id,
    classroomStatus: rows[0].classroom_status,
  };
}

export async function ensureStudentClassroom(
  studentId: string,
  courseId: string
): Promise<{ classroomId: string; classroomStatus: string; created: boolean }> {
  const existing = await findStudentActiveClassroom(studentId, courseId);

  if (existing) {
    return { ...existing, created: false };
  }

  const [classroom] = await sql`
    INSERT INTO classrooms (course_id, max_students)
    VALUES (${courseId}, 1)
    RETURNING id, status
  `;

  await upsertClassroomEnrollment(classroom.id, courseId, studentId);

  return {
    classroomId: classroom.id,
    classroomStatus: classroom.status,
    created: true,
  };
}

export async function upsertClassroomEnrollment(
  classroomId: string,
  courseId: string,
  studentId: string
): Promise<void> {
  await ensureClassroomDataModel();

  await sql`
    INSERT INTO classroom_enrollments (classroom_id, student_id, course_id)
    VALUES (${classroomId}, ${studentId}, ${courseId})
    ON CONFLICT (classroom_id, student_id) DO NOTHING
  `;
}

export async function markEnrollmentJoined(
  classroomId: string,
  studentId: string
): Promise<void> {
  await ensureClassroomDataModel();

  await sql`
    UPDATE classroom_enrollments
    SET joined_at = COALESCE(joined_at, now())
    WHERE classroom_id = ${classroomId}
      AND student_id = ${studentId}
  `;
}

export async function markEnrollmentCompleted(
  classroomId: string,
  studentId: string
): Promise<void> {
  await ensureClassroomDataModel();

  await sql`
    UPDATE classroom_enrollments
    SET
      joined_at = COALESCE(joined_at, now()),
      completed_at = now()
    WHERE classroom_id = ${classroomId}
      AND student_id = ${studentId}
  `;
}

export async function resolveClassroomStudent(
  classroomId: string
): Promise<{ studentId: string | null; ambiguous: boolean }> {
  await ensureClassroomDataModel();

  const rows = await sql`
    SELECT student_id
    FROM classroom_enrollments
    WHERE classroom_id = ${classroomId}
    ORDER BY enrolled_at ASC
    LIMIT 2
  `;

  if (rows.length === 0) {
    return { studentId: null, ambiguous: false };
  }

  if (rows.length > 1) {
    return { studentId: null, ambiguous: true };
  }

  return { studentId: rows[0].student_id, ambiguous: false };
}
