import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSession } from "@/lib/classroom/session";

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
    const classroomStatus = session?.status || "unknown";
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
