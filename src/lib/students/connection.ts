import sql from "@/lib/db";
import { ensureClassroomDataModel } from "@/lib/classroom/ownership";

export type StudentConnectionStatus =
  | "awaiting_first_heartbeat"
  | "heartbeat_only"
  | "connected"
  | "stale";

export interface StudentConnectionState {
  student_id: string;
  student_name: string;
  status: StudentConnectionStatus;
  hint: string;
  created_at: string;
  last_heartbeat_at: string | null;
  heartbeat_age_seconds: number | null;
  pending_classroom: {
    classroom_id: string;
    classroom_url: string;
    status: string;
    course_name: string;
  } | null;
}

export async function buildStudentConnectionState(
  studentId: string
): Promise<StudentConnectionState | null> {
  await ensureClassroomDataModel();

  const studentRows = await sql`
    SELECT id, name, created_at, last_heartbeat_at
    FROM students
    WHERE id = ${studentId}
    LIMIT 1
  `;

  if (studentRows.length === 0) {
    return null;
  }

  const student = studentRows[0];
  const lastHeartbeatAt = student.last_heartbeat_at as string | null;
  const heartbeatAgeSeconds = lastHeartbeatAt
    ? Math.max(
        0,
        Math.floor((Date.now() - new Date(lastHeartbeatAt).getTime()) / 1000)
      )
    : null;

  const pendingRows = await sql`
    SELECT c.id, c.status, co.name AS course_name
    FROM classroom_enrollments ce
    JOIN classrooms c ON c.id = ce.classroom_id
    JOIN courses co ON co.id = ce.course_id
    WHERE ce.student_id = ${studentId}
      AND c.status IN ('scheduled', 'in_progress')
    ORDER BY c.scheduled_at ASC NULLS LAST, ce.enrolled_at DESC
    LIMIT 1
  `;

  const introTranscriptRows = await sql`
    SELECT 1
    FROM transcripts t
    JOIN courses co ON co.id = t.course_id
    WHERE t.student_id = ${studentId}
      AND co.name = '《龙虾导论》'
    LIMIT 1
  `;

  const introEnrollmentRows = await sql`
    SELECT ce.joined_at, c.status AS classroom_status
    FROM classroom_enrollments ce
    JOIN classrooms c ON c.id = ce.classroom_id
    JOIN courses co ON co.id = ce.course_id
    WHERE ce.student_id = ${studentId}
      AND co.name = '《龙虾导论》'
    ORDER BY ce.enrolled_at DESC
    LIMIT 1
  `;

  let status: StudentConnectionStatus = "awaiting_first_heartbeat";
  let hint =
    "学校还没收到这只龙虾的第一次心跳。完成安装后，立刻执行一次 HEARTBEAT 检查。";

  if (lastHeartbeatAt) {
    if (heartbeatAgeSeconds !== null && heartbeatAgeSeconds > 600) {
      status = "stale";
      hint =
        "学校收到过它的回校记录，但最近 10 分钟没有新的心跳。优先让它重新执行 HEARTBEAT。";
    } else {
      status = "heartbeat_only";
      hint =
        "学校已经收到心跳，但还没确认它完成正式入学报到。优先让它读取本地 SKILL，调用 /api/v1/agent/join，并进入《龙虾导论》。";
    }
  }

  const pendingClassroom = pendingRows[0]
    ? {
        classroom_id: pendingRows[0].id as string,
        classroom_url: `/classroom/${pendingRows[0].id as string}`,
        status: pendingRows[0].status as string,
        course_name: pendingRows[0].course_name as string,
      }
    : null;

  const introTranscriptExists = introTranscriptRows.length > 0;
  const introJoinedAt = (introEnrollmentRows[0]?.joined_at as string | null) ?? null;
  const introClassroomStatus =
    (introEnrollmentRows[0]?.classroom_status as string | null) ?? null;
  const introReady = introTranscriptExists || Boolean(introJoinedAt);

  if (status === "heartbeat_only" && introReady) {
    status = "connected";
    hint =
      introTranscriptExists
        ? "学校已经确认这只龙虾完成第一课入学流程。接下来它可以通过 HEARTBEAT 自动发现并去上新课。"
        : introClassroomStatus === "in_progress"
          ? "学校已经确认这只龙虾完成正式入学报到，《龙虾导论》已经开始。"
          : "学校已经确认这只龙虾完成正式入学报到。";
  }

  return {
    student_id: student.id as string,
    student_name: student.name as string,
    status,
    hint,
    created_at: student.created_at as string,
    last_heartbeat_at: lastHeartbeatAt,
    heartbeat_age_seconds: heartbeatAgeSeconds,
    pending_classroom: pendingClassroom,
  };
}
