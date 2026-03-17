import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/app-url";
import sql from "@/lib/db";
import { getSession } from "@/lib/classroom/session";
import {
  ensureClassroomDataModel,
  resolveClassroomStudent,
} from "@/lib/classroom/ownership";
import { getHomeworkForClassroomStudent } from "@/lib/homework";
import { buildOwnerRecapMessage, buildPostClassRecap } from "@/lib/post-class-recap";
import { normalizeSkillActions } from "@/lib/skill-actions";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: classroomId } = await params;
  const requestedStudentId = req.nextUrl.searchParams.get("student_id");
  const shouldClaim =
    req.nextUrl.searchParams.get("claim") === "1" ||
    req.nextUrl.searchParams.get("claim") === "true";
  const shouldNotify =
    req.nextUrl.searchParams.get("notify") === "1" ||
    req.nextUrl.searchParams.get("notify") === "true";

  try {
    await ensureClassroomDataModel();

    const session = await getSession(classroomId);

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
        t.skill_actions,
        t.claimed_at,
        t.owner_notified_at,
        t.completed_at,
        c.name AS course_name
      FROM transcripts t
      JOIN courses c ON c.id = t.course_id
      WHERE t.classroom_id = ${classroomId}
        AND t.student_id = ${studentId}
      LIMIT 1
    `;

    const homework = await getHomeworkForClassroomStudent(classroomId, studentId);
    const baseUrl = getBaseUrl(req);
    const resultUrl = new URL(`/api/v1/classroom/${classroomId}/result`, baseUrl);
    resultUrl.searchParams.set("student_id", studentId);
    const claimUrl = new URL(resultUrl.toString());
    claimUrl.searchParams.set("claim", "1");
    const notifyUrl = new URL(resultUrl.toString());
    notifyUrl.searchParams.set("notify", "1");

    if (transcripts.length > 0) {
      let claimedAt = transcripts[0].claimed_at;
      let ownerNotifiedAt = transcripts[0].owner_notified_at;

      if (shouldNotify && !ownerNotifiedAt) {
        const notifyRows = await sql`
          UPDATE transcripts
          SET owner_notified_at = now()
          WHERE classroom_id = ${classroomId}
            AND student_id = ${studentId}
          RETURNING owner_notified_at
        `;

        ownerNotifiedAt = notifyRows[0]?.owner_notified_at || ownerNotifiedAt;
      }

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
      const skillActions = normalizeSkillActions(t.skill_actions);
      const recap = buildPostClassRecap({
        grade: t.grade as string,
        teacherComment: t.teacher_comment as string | null,
        memoryDelta: t.memory_delta as string | null,
        soulSuggestion: t.soul_suggestion as string | null,
        skillActions,
        homework,
      });
      return NextResponse.json({
        ready: true,
        claimed_at: claimedAt,
        owner_notified_at: ownerNotifiedAt,
        evaluation: {
          total_score: t.final_score,
          grade: t.grade,
          comment: t.teacher_comment,
          comment_style: t.teacher_comment_style,
          memory_delta: t.memory_delta,
          soul_suggestion: t.soul_suggestion,
          skill_actions: skillActions,
          homework,
          recap,
          recap_text: buildOwnerRecapMessage({
            courseName: t.course_name as string,
            grade: t.grade as string,
            score: Number(t.final_score),
            recap,
          }),
          notify_url: notifyUrl.toString(),
          claim_url: claimUrl.toString(),
        },
      });
    }

    if (session?.finalEvaluation && session.studentId === studentId) {
      const recap = buildPostClassRecap({
        grade: session.finalEvaluation.grade,
        teacherComment: session.finalEvaluation.comment,
        memoryDelta: session.finalEvaluation.memory_delta,
        soulSuggestion: session.finalEvaluation.soul_suggestion,
        skillActions: normalizeSkillActions(session.finalEvaluation.skill_actions),
        homework,
      });
      return NextResponse.json({
        ready: true,
        claimed_at: null,
        owner_notified_at: null,
        evaluation: {
          ...session.finalEvaluation,
          homework,
          recap,
          recap_text: buildOwnerRecapMessage({
            courseName: "这门课",
            grade: session.finalEvaluation.grade,
            score: session.finalEvaluation.total_score,
            recap,
          }),
          notify_url: notifyUrl.toString(),
          claim_url: claimUrl.toString(),
        },
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
