import sql from "@/lib/db";
import { getSession } from "@/lib/classroom/session";
import { ensureClassroomDataModel } from "@/lib/classroom/ownership";

export interface PlatformClassroomMessage {
  id: string;
  name: string;
  role: "teacher" | "student" | "system";
  content: string;
  type: string;
  delay_ms: number;
  created_at: string;
}

export interface PlatformClassroomMessagesResponse {
  classroom_id: string;
  status: string;
  course_name: string;
  teacher_name: string;
  runtime_active: boolean;
  waiting_for_response: boolean;
  prompt_hint: string | null;
  messages: PlatformClassroomMessage[];
}

function mapClassroomStatus(
  status: "scheduled" | "in_progress" | "completed"
): "waiting_join" | "running" | "completed" {
  if (status === "scheduled") return "waiting_join";
  if (status === "completed") return "completed";
  return "running";
}

export async function buildPlatformClassroomMessages(params: {
  classroomId: string;
  after?: string | null;
}): Promise<PlatformClassroomMessagesResponse | null> {
  const { classroomId, after } = params;

  await ensureClassroomDataModel();

  const messages = after
    ? await sql`
        SELECT id, agent_name, role, content, message_type, delay_ms, created_at
        FROM classroom_messages
        WHERE classroom_id = ${classroomId} AND created_at > ${after}
        ORDER BY created_at ASC
      `
    : await sql`
        SELECT id, agent_name, role, content, message_type, delay_ms, created_at
        FROM classroom_messages
        WHERE classroom_id = ${classroomId}
        ORDER BY created_at ASC
      `;

  const session = await getSession(classroomId);
  const classrooms = await sql`
    SELECT
      c.status,
      co.name AS course_name,
      co.teacher_name,
      EXISTS (
        SELECT 1
        FROM classroom_messages cm
        WHERE cm.classroom_id = c.id
          AND cm.role = 'teacher'
      ) AS has_teacher_messages
    FROM classrooms c
    JOIN courses co ON co.id = c.course_id
    WHERE c.id = ${classroomId}
    LIMIT 1
  `;

  if (classrooms.length === 0) {
    return null;
  }

  const prestartedWithoutRuntime =
    !session &&
    classrooms[0].status === "scheduled" &&
    Boolean(classrooms[0].has_teacher_messages);

  const classroomStatus =
    session?.status ||
    (prestartedWithoutRuntime
      ? "waiting_join_interactive"
      : mapClassroomStatus(
          classrooms[0].status as "scheduled" | "in_progress" | "completed"
        ));
  const waitingForResponse =
    classroomStatus === "waiting_response" || classroomStatus === "unlocking";

  let promptHint: string | null = null;
  if (waitingForResponse && session?.pendingExercise) {
    const step = session.pendingExercise;
    if (step.type === "roll_call") promptHint = "请回答「到」";
    else if (step.type === "exercise") promptHint = step.exercise_prompt || step.content;
    else if (step.type === "quiz") promptHint = step.content;
    else if (step.type === "tool_unlock") {
      promptHint =
        step.unlock_prompt ||
        "现在在课堂里安装老师授予的技能。成功就按 UNLOCK_STATUS / UNLOCKED_SKILL / INSTALL_NOTE 回复；失败就按 UNLOCK_STATUS / ERROR 回复。";
    }
  }

  return {
    classroom_id: classroomId,
    status: classroomStatus,
    course_name: classrooms[0].course_name as string,
    teacher_name: classrooms[0].teacher_name as string,
    runtime_active: Boolean(session),
    waiting_for_response: waitingForResponse,
    prompt_hint: promptHint,
    messages: messages.map((message) => ({
      id: message.id as string,
      name: message.agent_name as string,
      role: message.role as "teacher" | "student" | "system",
      content: message.content as string,
      type: message.message_type as string,
      delay_ms: Number(message.delay_ms || 0),
      created_at: message.created_at as string,
    })),
  };
}
