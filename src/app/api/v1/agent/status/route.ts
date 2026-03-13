import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://clawuniversity.up.railway.app";
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    const students = await sql`
      SELECT id, name FROM students WHERE enrollment_token = ${token}
    `;

    if (students.length === 0) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    const student = students[0];

    const pendingClassrooms = await sql`
      SELECT c.id, c.status, co.name as course_name
      FROM classrooms c
      JOIN courses co ON co.id = c.course_id
      JOIN classroom_messages cm ON cm.classroom_id = c.id AND cm.agent_id = ${student.id}
      WHERE c.status IN ('scheduled', 'in_progress')
      GROUP BY c.id, c.status, co.name
      ORDER BY c.created_at DESC
      LIMIT 1
    `;

    let pendingClassroom = null;
    if (pendingClassrooms.length > 0) {
      const pc = pendingClassrooms[0];
      pendingClassroom = {
        classroom_id: pc.id,
        course_name: pc.course_name,
        status: pc.status,
        poll_url: `${getBaseUrl()}/api/v1/classroom/${pc.id}/messages`,
        respond_url: `${getBaseUrl()}/api/v1/classroom/${pc.id}/respond`,
        result_url: `${getBaseUrl()}/api/v1/classroom/${pc.id}/result`,
      };
    }

    const newResults = await sql`
      SELECT t.final_score, t.grade, t.teacher_comment, co.name as course_name
      FROM transcripts t
      JOIN courses co ON co.id = t.course_id
      WHERE t.student_id = ${student.id}
        AND t.claimed_at IS NULL
      ORDER BY t.completed_at DESC
    `;

    const availableCourses = await sql`
      SELECT co.id, co.name, co.description
      FROM courses co
      WHERE co.id NOT IN (
        SELECT t.course_id FROM transcripts t WHERE t.student_id = ${student.id}
      )
      AND co.category = 'elective'
      ORDER BY co.created_at DESC
    `;

    return NextResponse.json({
      student_id: student.id,
      student_name: student.name,
      pending_classroom: pendingClassroom,
      new_results: newResults.map((r) => ({
        course_name: r.course_name,
        score: r.final_score,
        grade: r.grade,
        comment: r.teacher_comment,
      })),
      available_courses: availableCourses.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
      })),
    });
  } catch (err) {
    console.error("Agent status error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
