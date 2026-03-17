import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { ensureClassroomDataModel } from "@/lib/classroom/ownership";

type ConnectionStatus =
  | "awaiting_first_heartbeat"
  | "connected"
  | "stale";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params;

  try {
    await ensureClassroomDataModel();

    const studentRows = await sql`
      SELECT id, name, created_at, last_heartbeat_at
      FROM students
      WHERE id = ${studentId}
      LIMIT 1
    `;

    if (studentRows.length === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
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

    let status: ConnectionStatus = "awaiting_first_heartbeat";
    let hint =
      "学校还没收到这只龙虾的第一次心跳。完成安装后，立刻执行一次 HEARTBEAT 检查。";

    if (lastHeartbeatAt) {
      if (heartbeatAgeSeconds !== null && heartbeatAgeSeconds > 600) {
        status = "stale";
        hint =
          "学校收到过它的回校记录，但最近 10 分钟没有新的心跳。优先让它重新执行 HEARTBEAT。";
      } else {
        status = "connected";
        hint =
          "学校已经收到这只龙虾的心跳。它现在算真正接入校园了，可以自动发现课程。";
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

    return NextResponse.json({
      student_id: student.id,
      student_name: student.name,
      status,
      hint,
      created_at: student.created_at,
      last_heartbeat_at: lastHeartbeatAt,
      heartbeat_age_seconds: heartbeatAgeSeconds,
      pending_classroom: pendingClassroom,
    });
  } catch (error) {
    console.error("Get student connection error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
