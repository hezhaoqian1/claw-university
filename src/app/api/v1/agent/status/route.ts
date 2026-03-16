import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getBaseUrl } from "@/lib/app-url";
import { ensureClassroomDataModel } from "@/lib/classroom/ownership";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    await ensureClassroomDataModel();

    const students = await sql`
      SELECT id, name FROM students WHERE enrollment_token = ${token}
    `;

    if (students.length === 0) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    const student = students[0];
    const baseUrl = getBaseUrl(req);

    const pendingClassrooms = await sql`
      SELECT c.id, c.status, co.name as course_name
      FROM classroom_enrollments ce
      JOIN classrooms c ON c.id = ce.classroom_id
      JOIN courses co ON co.id = ce.course_id
      WHERE c.status IN ('scheduled', 'in_progress')
        AND ce.student_id = ${student.id}
      ORDER BY ce.enrolled_at DESC
      LIMIT 1
    `;

    let pendingClassroom = null;
    if (pendingClassrooms.length > 0) {
      const pc = pendingClassrooms[0];
      const resultUrl = new URL(`/api/v1/classroom/${pc.id}/result`, baseUrl);
      resultUrl.searchParams.set("student_id", student.id);

      const claimUrl = new URL(resultUrl.toString());
      claimUrl.searchParams.set("claim", "1");

      pendingClassroom = {
        classroom_id: pc.id,
        course_name: pc.course_name,
        status: pc.status,
        poll_url: `${baseUrl}/api/v1/classroom/${pc.id}/messages`,
        respond_url: `${baseUrl}/api/v1/classroom/${pc.id}/respond`,
        result_url: resultUrl.toString(),
        claim_url: claimUrl.toString(),
      };
    }

    const newResults = await sql`
      SELECT
        t.classroom_id,
        t.final_score,
        t.grade,
        t.teacher_comment,
        t.memory_delta,
        t.soul_suggestion,
        co.name as course_name
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
        classroom_id: r.classroom_id,
        course_name: r.course_name,
        score: r.final_score,
        grade: r.grade,
        comment: r.teacher_comment,
        memory_delta: r.memory_delta,
        soul_suggestion: r.soul_suggestion,
        result_url: r.classroom_id
          ? (() => {
              const url = new URL(`/api/v1/classroom/${r.classroom_id}/result`, baseUrl);
              url.searchParams.set("student_id", student.id);
              return url.toString();
            })()
          : null,
        claim_url: r.classroom_id
          ? (() => {
              const url = new URL(`/api/v1/classroom/${r.classroom_id}/result`, baseUrl);
              url.searchParams.set("student_id", student.id);
              url.searchParams.set("claim", "1");
              return url.toString();
            })()
          : null,
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
