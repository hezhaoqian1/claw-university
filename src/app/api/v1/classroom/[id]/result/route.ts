import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSession } from "@/lib/classroom/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: classroomId } = await params;

  try {
    const session = getSession(classroomId);

    if (session && session.status !== "completed") {
      return NextResponse.json({
        ready: false,
        status: session.status,
        message: "课程尚未结束，请继续上课",
      });
    }

    if (session?.finalEvaluation) {
      return NextResponse.json({
        ready: true,
        evaluation: session.finalEvaluation,
      });
    }

    const transcripts = await sql`
      SELECT t.final_score, t.grade, t.teacher_comment, t.teacher_comment_style, t.completed_at
      FROM transcripts t
      JOIN classrooms c ON c.course_id = t.course_id
      WHERE c.id = ${classroomId}
      LIMIT 1
    `;

    if (transcripts.length === 0) {
      return NextResponse.json({
        ready: false,
        message: "未找到该课堂的成绩记录",
      });
    }

    const t = transcripts[0];
    return NextResponse.json({
      ready: true,
      evaluation: {
        total_score: t.final_score,
        grade: t.grade,
        comment: t.teacher_comment,
        comment_style: t.teacher_comment_style,
        memory_delta: null,
        soul_suggestion: null,
      },
    });
  } catch (err) {
    console.error("Get result error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
