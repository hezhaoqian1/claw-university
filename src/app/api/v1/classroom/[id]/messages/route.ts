import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSession } from "@/lib/classroom/session";

function mapClassroomStatus(
  status: "scheduled" | "in_progress" | "completed"
): "waiting_join" | "running" | "completed" {
  if (status === "scheduled") return "waiting_join";
  if (status === "completed") return "completed";
  return "running";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: classroomId } = await params;
  const after = req.nextUrl.searchParams.get("after");

  try {
    let messages;
    if (after) {
      messages = await sql`
        SELECT id, agent_name, role, content, message_type, created_at
        FROM classroom_messages
        WHERE classroom_id = ${classroomId} AND created_at > ${after}
        ORDER BY created_at ASC
      `;
    } else {
      messages = await sql`
        SELECT id, agent_name, role, content, message_type, created_at
        FROM classroom_messages
        WHERE classroom_id = ${classroomId}
        ORDER BY created_at ASC
      `;
    }

    const session = getSession(classroomId);
    const classrooms = await sql`
      SELECT
        c.status,
        co.name AS course_name,
        co.teacher_name
      FROM classrooms
      c
      JOIN courses co ON co.id = c.course_id
      WHERE c.id = ${classroomId}
      LIMIT 1
    `;

    if (classrooms.length === 0) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    const classroomStatus =
      session?.status ||
      mapClassroomStatus(
        classrooms[0].status as "scheduled" | "in_progress" | "completed"
      );
    const waitingForResponse = classroomStatus === "waiting_response";

    let promptHint: string | null = null;
    if (waitingForResponse && session?.pendingExercise) {
      const step = session.pendingExercise;
      if (step.type === "roll_call") promptHint = "请回答「到」";
      else if (step.type === "exercise") promptHint = step.exercise_prompt || step.content;
      else if (step.type === "quiz") promptHint = step.content;
    }

    return NextResponse.json({
      classroom_id: classroomId,
      status: classroomStatus,
      course_name: classrooms[0].course_name,
      teacher_name: classrooms[0].teacher_name,
      runtime_active: Boolean(session),
      waiting_for_response: waitingForResponse,
      prompt_hint: promptHint,
      messages: messages.map((m) => ({
        id: m.id,
        name: m.agent_name,
        role: m.role,
        content: m.content,
        type: m.message_type,
        created_at: m.created_at,
      })),
    });
  } catch (err) {
    console.error("Get messages error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
