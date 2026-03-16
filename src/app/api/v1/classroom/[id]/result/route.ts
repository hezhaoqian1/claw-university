import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSession } from "@/lib/classroom/session";
import {
  ensureClassroomDataModel,
  resolveClassroomStudent,
} from "@/lib/classroom/ownership";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: classroomId } = await params;
  const requestedStudentId = req.nextUrl.searchParams.get("student_id");
  const shouldClaim =
    req.nextUrl.searchParams.get("claim") === "1" ||
    req.nextUrl.searchParams.get("claim") === "true";

  try {
    await ensureClassroomDataModel();

    const session = getSession(classroomId);

    if (session && session.status !== "completed") {
      return NextResponse.json({
        ready: false,
        status: session.status,
        message: "课程尚未结束，请继续上课",
      });
    }

    const classrooms = await sql`
      SELECT status
      FROM classrooms
      WHERE id = ${classroomId}
      LIMIT 1
    `;

    if (classrooms.length === 0) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    if (classrooms[0].status !== "completed" && !session?.finalEvaluation) {
      return NextResponse.json({
        ready: false,
        status: classrooms[0].status,
        message: "课程尚未结束，请继续上课",
      });
    }

    let studentId = requestedStudentId || session?.studentId || null;

    if (!studentId) {
      const resolved = await resolveClassroomStudent(classroomId);

      if (resolved.ambiguous) {
        return NextResponse.json(
          { error: "Missing student_id for a multi-student classroom" },
          { status: 400 }
        );
      }

      studentId = resolved.studentId;
    }

    if (!studentId) {
      const transcriptOwners = await sql`
        SELECT student_id
        FROM transcripts
        WHERE classroom_id = ${classroomId}
        LIMIT 2
      `;

      if (transcriptOwners.length > 1) {
        return NextResponse.json(
          { error: "Missing student_id for a multi-student classroom" },
          { status: 400 }
        );
      }

      studentId = transcriptOwners[0]?.student_id || null;
    }

    if (!studentId) {
      return NextResponse.json(
        { error: "Missing student_id for classroom result lookup" },
        { status: 400 }
      );
    }

    const transcripts = await sql`
      SELECT
        t.final_score,
        t.grade,
        t.teacher_comment,
        t.teacher_comment_style,
        t.memory_delta,
        t.soul_suggestion,
        t.claimed_at,
        t.completed_at
      FROM transcripts t
      WHERE t.classroom_id = ${classroomId}
        AND t.student_id = ${studentId}
      LIMIT 1
    `;

    if (transcripts.length > 0) {
      let claimedAt = transcripts[0].claimed_at;

      if (shouldClaim && !claimedAt) {
        const claimRows = await sql`
          UPDATE transcripts
          SET claimed_at = now()
          WHERE classroom_id = ${classroomId}
            AND student_id = ${studentId}
          RETURNING claimed_at
        `;

        claimedAt = claimRows[0]?.claimed_at || claimedAt;
      }

      const t = transcripts[0];
      return NextResponse.json({
        ready: true,
        claimed_at: claimedAt,
        evaluation: {
          total_score: t.final_score,
          grade: t.grade,
          comment: t.teacher_comment,
          comment_style: t.teacher_comment_style,
          memory_delta: t.memory_delta,
          soul_suggestion: t.soul_suggestion,
        },
      });
    }

    if (session?.finalEvaluation && session.studentId === studentId) {
      return NextResponse.json({
        ready: true,
        claimed_at: null,
        evaluation: session.finalEvaluation,
      });
    }

    return NextResponse.json({
      ready: false,
      message: "未找到该课堂的成绩记录",
    });
  } catch (err) {
    console.error("Get result error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
