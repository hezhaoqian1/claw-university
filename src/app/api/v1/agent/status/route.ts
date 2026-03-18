import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getBaseUrl } from "@/lib/app-url";
import { ensureClassroomDataModel } from "@/lib/classroom/ownership";
import {
  normalizeCapabilityGrants,
  normalizeFirstDeliverable,
} from "@/lib/course-results";
import { isLiveCourseName, isRetiredLiveCourseName } from "@/lib/courses/registry";
import { buildOwnerRecapMessage, buildPostClassRecap } from "@/lib/post-class-recap";
import { SKILL_VERSION } from "@/lib/skill-files";
import { listPendingHomeworkForStudent } from "@/lib/homework";
import { normalizeSkillActions } from "@/lib/skill-actions";

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
    const pendingHomework = await listPendingHomeworkForStudent(student.id as string);
    const homeworkRows = await sql`
      SELECT
        classroom_id,
        title,
        description,
        due_at,
        status,
        submitted_at
      FROM homework_assignments
      WHERE student_id = ${student.id}
    `;
    const skillUpdateUrl = new URL("/api/v1/skill", baseUrl);
    skillUpdateUrl.searchParams.set("token", token);
    const heartbeatUpdateUrl = new URL("/api/v1/skill", baseUrl);
    heartbeatUpdateUrl.searchParams.set("format", "heartbeat");
    heartbeatUpdateUrl.searchParams.set("token", token);
    const heartbeatRows = await sql`
      UPDATE students
      SET last_heartbeat_at = now()
      WHERE id = ${student.id}
      RETURNING last_heartbeat_at
    `;
    const lastHeartbeatAt = heartbeatRows[0]?.last_heartbeat_at || null;

    const pendingClassrooms = await sql`
      SELECT c.id, c.status, c.scheduled_at, co.name as course_name
      FROM classroom_enrollments ce
      JOIN classrooms c ON c.id = ce.classroom_id
      JOIN courses co ON co.id = ce.course_id
      WHERE c.status IN ('scheduled', 'in_progress')
        AND ce.student_id = ${student.id}
      ORDER BY c.scheduled_at ASC NULLS LAST, ce.enrolled_at DESC
      LIMIT 8
    `;

    let pendingClassroom = null;
    const livePendingClassroom = pendingClassrooms.find((row) =>
      isLiveCourseName(row.course_name as string)
    );

    if (livePendingClassroom) {
      const pc = livePendingClassroom;
      const resultUrl = new URL(`/api/v1/classroom/${pc.id}/result`, baseUrl);
      resultUrl.searchParams.set("student_id", student.id);

      const claimUrl = new URL(resultUrl.toString());
      claimUrl.searchParams.set("claim", "1");

      pendingClassroom = {
        classroom_id: pc.id,
        course_name: pc.course_name,
        status: pc.status,
        scheduled_at: pc.scheduled_at,
        start_url: `${baseUrl}/api/v1/classroom/start`,
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
        t.skill_actions,
        t.capability_grants,
        t.first_deliverable,
        t.owner_notified_at,
        co.name as course_name
      FROM transcripts t
      JOIN courses co ON co.id = t.course_id
      WHERE t.student_id = ${student.id}
        AND t.claimed_at IS NULL
      ORDER BY t.completed_at DESC
    `;
    const homeworkByClassroomId = new Map(
      homeworkRows.map((row) => [
        row.classroom_id as string,
        {
          title: row.title as string,
          description: row.description as string,
          dueAt: row.due_at as string,
          status: row.status as string,
          submittedAt: row.submitted_at as string | null,
        },
      ])
    );

    const availableCourses = await sql`
      SELECT co.id, co.name, co.description
      FROM courses co
      WHERE co.id NOT IN (
        SELECT t.course_id FROM transcripts t WHERE t.student_id = ${student.id}
      )
      AND co.id NOT IN (
        SELECT ce.course_id
        FROM classroom_enrollments ce
        JOIN classrooms c ON c.id = ce.classroom_id
        WHERE ce.student_id = ${student.id}
          AND c.status IN ('scheduled', 'in_progress')
      )
      AND co.category = 'elective'
      ORDER BY co.created_at DESC
    `;

    return NextResponse.json({
      student_id: student.id,
      student_name: student.name,
      last_heartbeat_at: lastHeartbeatAt,
      next_check_in_seconds: 60,
      skill_version: SKILL_VERSION,
      skill_update_url: skillUpdateUrl.toString(),
      heartbeat_update_url: heartbeatUpdateUrl.toString(),
      pending_classroom: pendingClassroom,
      pending_homework: pendingHomework.map((assignment) => ({
        assignment_id: assignment.id,
        course_name: assignment.courseName,
        title: assignment.title,
        description: assignment.description,
        due_at: assignment.dueAt,
        status: assignment.status,
        submit_url: `${baseUrl}/api/v1/homework/submit`,
      })),
      new_results: newResults.map((r) => {
        const skillActions = normalizeSkillActions(r.skill_actions);
        const capabilityGrants = normalizeCapabilityGrants(r.capability_grants);
        const firstDeliverable = normalizeFirstDeliverable(r.first_deliverable);
        const homework = r.classroom_id
          ? homeworkByClassroomId.get(r.classroom_id as string) || null
          : null;
        const recap = buildPostClassRecap({
          grade: r.grade as string,
          teacherComment: r.teacher_comment as string | null,
          memoryDelta: r.memory_delta as string | null,
          soulSuggestion: r.soul_suggestion as string | null,
          skillActions,
          capabilityGrants,
          firstDeliverable,
          homework,
        });
        const resultUrl = r.classroom_id
          ? (() => {
              const url = new URL(`/api/v1/classroom/${r.classroom_id}/result`, baseUrl);
              url.searchParams.set("student_id", student.id as string);
              return url.toString();
            })()
          : null;
        const claimUrl = resultUrl ? (() => {
          const url = new URL(resultUrl);
          url.searchParams.set("claim", "1");
          return url.toString();
        })() : null;
        const notifyUrl = resultUrl ? (() => {
          const url = new URL(resultUrl);
          url.searchParams.set("notify", "1");
          return url.toString();
        })() : null;
        const deliverableSubmitUrl =
          r.classroom_id
            ? `${baseUrl}/api/v1/classroom/${r.classroom_id}/deliverable`
            : null;

        return {
          classroom_id: r.classroom_id,
          course_name: r.course_name,
          score: r.final_score,
          grade: r.grade,
          comment: r.teacher_comment,
          memory_delta: r.memory_delta,
          soul_suggestion: r.soul_suggestion,
          skill_actions: skillActions,
          capability_grants: capabilityGrants,
          first_deliverable: firstDeliverable
            ? {
                ...firstDeliverable,
                submit_url: deliverableSubmitUrl,
              }
            : null,
          owner_notified_at: r.owner_notified_at,
          owner_update_required: !r.owner_notified_at,
          recap,
          recap_text: buildOwnerRecapMessage({
            courseName: r.course_name as string,
            grade: r.grade as string,
            score: Number(r.final_score),
            recap,
            firstDeliverable,
          }),
          result_url: resultUrl,
          notify_url: notifyUrl,
          claim_url: claimUrl,
        };
      }),
      available_courses: availableCourses
        .filter((c) => !isRetiredLiveCourseName(c.name as string))
        .map((c) => ({
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
