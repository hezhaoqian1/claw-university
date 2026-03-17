import sql from "@/lib/db";
import { ensureClassroomDataModel } from "@/lib/classroom/ownership";
import type { HomeworkTemplate } from "@/types";

type HomeworkStatus = "assigned" | "submitted" | "reviewed" | "missed";

interface HomeworkRow {
  id: string;
  classroom_id: string;
  course_id: string;
  student_id: string;
  title: string;
  description: string;
  submission_format: string;
  due_at: string;
  status: HomeworkStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

function normalizeHomework(row: HomeworkRow) {
  return {
    id: row.id,
    classroomId: row.classroom_id,
    courseId: row.course_id,
    studentId: row.student_id,
    title: row.title,
    description: row.description,
    submissionFormat: row.submission_format,
    dueAt: row.due_at,
    status: row.status,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function assignHomework(params: {
  classroomId: string;
  courseId: string;
  studentId: string;
  homework: HomeworkTemplate;
}) {
  await ensureClassroomDataModel();
  const { classroomId, courseId, studentId, homework } = params;

  const rows = await sql`
    INSERT INTO homework_assignments (
      classroom_id,
      course_id,
      student_id,
      title,
      description,
      submission_format,
      due_at,
      status
    )
    VALUES (
      ${classroomId},
      ${courseId},
      ${studentId},
      ${homework.title},
      ${homework.description},
      ${homework.submission_format},
      now() + (${homework.due_in_hours} * interval '1 hour'),
      'assigned'
    )
    ON CONFLICT (classroom_id, student_id) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      submission_format = EXCLUDED.submission_format,
      due_at = EXCLUDED.due_at,
      updated_at = now()
    RETURNING
      id,
      classroom_id,
      course_id,
      student_id,
      title,
      description,
      submission_format,
      due_at,
      status,
      submitted_at,
      reviewed_at,
      created_at,
      updated_at
  `;

  return normalizeHomework(rows[0] as HomeworkRow);
}

export async function getHomeworkForClassroomStudent(
  classroomId: string,
  studentId: string
) {
  await ensureClassroomDataModel();
  const rows = await sql`
    SELECT
      id,
      classroom_id,
      course_id,
      student_id,
      title,
      description,
      submission_format,
      due_at,
      status,
      submitted_at,
      reviewed_at,
      created_at,
      updated_at
    FROM homework_assignments
    WHERE classroom_id = ${classroomId}
      AND student_id = ${studentId}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return null;
  }

  return normalizeHomework(rows[0] as HomeworkRow);
}

export async function listPendingHomeworkForStudent(studentId: string) {
  await ensureClassroomDataModel();
  const rows = await sql`
    SELECT
      ha.id,
      ha.classroom_id,
      ha.course_id,
      ha.student_id,
      ha.title,
      ha.description,
      ha.submission_format,
      ha.due_at,
      ha.status,
      ha.submitted_at,
      ha.reviewed_at,
      ha.created_at,
      ha.updated_at,
      c.name AS course_name
    FROM homework_assignments ha
    JOIN courses c ON c.id = ha.course_id
    WHERE ha.student_id = ${studentId}
      AND ha.status IN ('assigned', 'submitted')
    ORDER BY ha.due_at ASC, ha.created_at DESC
  `;

  return rows.map((row) => ({
    ...normalizeHomework(row as HomeworkRow),
    courseName: row.course_name as string,
  }));
}

export async function submitHomework(params: {
  assignmentId: string;
  studentId: string;
  content: string;
  attachments?: string[];
}) {
  await ensureClassroomDataModel();
  const { assignmentId, studentId, content, attachments = [] } = params;

  const assignmentRows = await sql`
    SELECT
      id,
      classroom_id,
      course_id,
      student_id,
      title,
      description,
      submission_format,
      due_at,
      status,
      submitted_at,
      reviewed_at,
      created_at,
      updated_at
    FROM homework_assignments
    WHERE id = ${assignmentId}
      AND student_id = ${studentId}
    LIMIT 1
  `;

  if (assignmentRows.length === 0) {
    return null;
  }

  await sql`
    INSERT INTO homework_submissions (
      assignment_id,
      student_id,
      content,
      attachments
    )
    VALUES (
      ${assignmentId},
      ${studentId},
      ${content},
      ${JSON.stringify(attachments)}::jsonb
    )
    ON CONFLICT (assignment_id) DO UPDATE SET
      content = EXCLUDED.content,
      attachments = EXCLUDED.attachments,
      submitted_at = now()
  `;

  const updatedRows = await sql`
    UPDATE homework_assignments
    SET
      status = 'submitted',
      submitted_at = now(),
      updated_at = now()
    WHERE id = ${assignmentId}
      AND student_id = ${studentId}
    RETURNING
      id,
      classroom_id,
      course_id,
      student_id,
      title,
      description,
      submission_format,
      due_at,
      status,
      submitted_at,
      reviewed_at,
      created_at,
      updated_at
  `;

  return normalizeHomework(updatedRows[0] as HomeworkRow);
}
