import sql from "@/lib/db";
import {
  evaluateStudentResponse,
  generateFinalEvaluation,
  type FinalEvaluation,
} from "@/lib/llm";
import {
  ensureClassroomDataModel,
  markEnrollmentCompleted,
  markEnrollmentJoined,
  upsertClassroomEnrollment,
} from "@/lib/classroom/ownership";
import { getCourseRuntimeByKey } from "@/lib/courses/registry";
import type { LectureStep } from "@/types";

export interface ActiveSession {
  classroomId: string;
  courseId: string;
  courseRuntimeKey: string;
  studentId: string;
  studentName: string;
  status:
    | "waiting_join"
    | "waiting_join_interactive"
    | "running"
    | "waiting_response"
    | "evaluating"
    | "completed";
  currentStepIndex: number;
  pendingExercise: LectureStep | null;
  studentResponses: { stepId: string; content: string }[];
  finalEvaluation: FinalEvaluation | null;
}

const activeSessions = new Map<string, ActiveSession>();

export function getSession(classroomId: string): ActiveSession | undefined {
  return activeSessions.get(classroomId);
}

export async function createSession(
  classroomId: string,
  courseId: string,
  courseRuntimeKey: string,
  studentId: string,
  studentName: string,
  options: { prestart?: boolean; restorePrestart?: boolean } = {}
): Promise<ActiveSession> {
  await ensureClassroomDataModel();
  await upsertClassroomEnrollment(classroomId, courseId, studentId);

  const session: ActiveSession = {
    classroomId,
    courseId,
    courseRuntimeKey,
    studentId,
    studentName,
    status: "waiting_join",
    currentStepIndex: 0,
    pendingExercise: null,
    studentResponses: [],
    finalEvaluation: null,
  };
  activeSessions.set(classroomId, session);

  if (options.prestart) {
    await prestartLesson(classroomId);
  } else if (options.restorePrestart) {
    markSessionWaitingJoinInteractive(classroomId);
  }

  return session;
}

export async function startSession(classroomId: string): Promise<void> {
  const session = activeSessions.get(classroomId);
  if (
    !session ||
    (session.status !== "waiting_join" && session.status !== "waiting_join_interactive")
  ) {
    return;
  }

  session.status = "running";

  await sql`
    UPDATE classrooms
    SET
      status = 'in_progress',
      started_at = COALESCE(started_at, now())
    WHERE id = ${classroomId}
  `;
  await markEnrollmentJoined(classroomId, session.studentId);

  await insertSystemMessage(classroomId, `「${session.studentName}」进入教室`);

  void driveLesson(classroomId);
}

async function driveLesson(classroomId: string): Promise<void> {
  const session = activeSessions.get(classroomId);
  if (!session || session.status === "completed") return;
  const runtime = getCourseRuntimeByKey(session.courseRuntimeKey);

  while (session.currentStepIndex < runtime.script.length) {
    const step = runtime.script[session.currentStepIndex];

    const delay = step.delay_ms || 2000;
    await sleep(Math.min(delay, 3000));

    if ((session.status as string) === "completed") return;

    switch (step.type) {
      case "teacher_message":
        await insertTeacherMessage(classroomId, step.content, "lecture", delay);
        session.currentStepIndex++;
        break;

      case "roll_call":
        await insertTeacherMessage(
          classroomId,
          `点名：${session.studentName}`,
          "roll_call",
          delay
        );
        session.status = "waiting_response";
        session.pendingExercise = step;
        return;

      case "exercise":
        await insertTeacherMessage(
          classroomId,
          step.exercise_prompt || step.content,
          "exercise",
          delay
        );
        session.status = "waiting_response";
        session.pendingExercise = step;
        return;

      case "quiz":
        await insertTeacherMessage(classroomId, step.content, "question", delay);
        session.status = "waiting_response";
        session.pendingExercise = step;
        return;

      case "summary":
        await insertTeacherMessage(classroomId, step.content, "summary", delay);
        session.currentStepIndex++;
        break;
    }
  }

  await finishSession(classroomId);
}

export async function handleStudentResponse(
  classroomId: string,
  content: string
): Promise<void> {
  const session = activeSessions.get(classroomId);
  if (!session || session.status !== "waiting_response") return;
  const runtime = getCourseRuntimeByKey(session.courseRuntimeKey);

  await insertStudentMessage(classroomId, session.studentId, session.studentName, content);

  const step = session.pendingExercise;
  if (!step) {
    session.status = "running";
    session.currentStepIndex++;
    session.pendingExercise = null;
    void driveLesson(classroomId);
    return;
  }

  session.studentResponses.push({ stepId: step.id, content });

  if (step.type === "roll_call") {
    await insertTeacherMessage(
      classroomId,
      `好，${session.studentName}到了。`,
      "lecture"
    );
    session.status = "running";
    session.currentStepIndex++;
    session.pendingExercise = null;
    void driveLesson(classroomId);
    return;
  }

  session.status = "evaluating";

  try {
    if (step.type === "quiz" && step.quiz_answer !== undefined) {
      const answerIndex = parseQuizAnswer(content);
      const correct = answerIndex === step.quiz_answer;
      const feedback = correct
        ? `回答正确。你至少知道该往哪边走。`
        : `回答错误。正确答案是 B。你还需要把课堂重点再捞一遍。`;
      await insertTeacherMessage(classroomId, feedback, "feedback");
    } else if (step.type === "exercise") {
      const rubricText = runtime.rubric.map(
        (r) => `- ${r.name}（${r.max_score}分）：${r.description}`
      ).join("\n");

      const evaluation = await evaluateStudentResponse(
        runtime.meta.teacher_name,
        runtime.meta.teacher_style,
        session.studentName,
        content,
        step.exercise_prompt || step.content,
        rubricText
      );
      await insertTeacherMessage(classroomId, evaluation.feedback, "feedback");
    }
  } catch (err) {
    console.error("LLM evaluation failed:", err);
    await insertTeacherMessage(
      classroomId,
      `嗯…让我想想怎么说。总之你的回答我收到了。`,
      "feedback"
    );
  }

  session.status = "running";
  session.currentStepIndex++;
  session.pendingExercise = null;

  await sleep(1500);
  void driveLesson(classroomId);
}

async function finishSession(classroomId: string): Promise<void> {
  const session = activeSessions.get(classroomId);
  if (!session) return;
  const runtime = getCourseRuntimeByKey(session.courseRuntimeKey);

  session.status = "evaluating";

  const messages =
    await sql`SELECT role, agent_name, content, message_type FROM classroom_messages WHERE classroom_id = ${classroomId} ORDER BY created_at`;

  const messagesContext = messages
    .map((m) => `[${m.role}] ${m.agent_name}: ${m.content}`)
    .join("\n");

  const rubricText = runtime.rubric.map(
    (r) => `- ${r.name}（${r.max_score}分）：${r.description}`
  ).join("\n");

  let evaluation: FinalEvaluation;

  try {
    evaluation = await generateFinalEvaluation(
      runtime.meta.teacher_name,
      session.studentName,
      messagesContext,
      rubricText,
      `${runtime.meta.name} — ${runtime.meta.description}`,
      runtime.meta.teacher_style
    );
  } catch (err) {
    console.error("Final evaluation failed:", err);
    evaluation = {
      total_score: 65,
      grade: "D",
      comment: "系统评价暂时不可用，先给你一个保守的及格分。",
      comment_style: runtime.meta.teacher_style,
      memory_delta: `- 今天上了 ${runtime.meta.name}\n- 课程主题：${runtime.meta.description}\n- 课堂结果需要稍后人工复核`,
      soul_suggestion: null,
    };
  }

  const skillActions = runtime.postCourseActions || null;

  session.finalEvaluation = {
    ...evaluation,
    skill_actions: skillActions,
  };

  await ensureClassroomDataModel();

  await sql`
    INSERT INTO transcripts (
      student_id,
      course_id,
      classroom_id,
      final_score,
      grade,
      teacher_comment,
      teacher_comment_style,
      memory_delta,
      soul_suggestion,
      skill_actions
    )
    VALUES (
      ${session.studentId},
      ${session.courseId},
      ${classroomId},
      ${evaluation.total_score},
      ${evaluation.grade},
      ${evaluation.comment},
      ${evaluation.comment_style},
      ${evaluation.memory_delta},
      ${evaluation.soul_suggestion},
      ${JSON.stringify(skillActions)}::jsonb
    )
    ON CONFLICT (student_id, course_id) DO UPDATE SET
      classroom_id = EXCLUDED.classroom_id,
      final_score = EXCLUDED.final_score,
      grade = EXCLUDED.grade,
      teacher_comment = EXCLUDED.teacher_comment,
      teacher_comment_style = EXCLUDED.teacher_comment_style,
      memory_delta = EXCLUDED.memory_delta,
      soul_suggestion = EXCLUDED.soul_suggestion,
      skill_actions = EXCLUDED.skill_actions,
      claimed_at = NULL,
      completed_at = now()
  `;

  session.status = "completed";

  await sql`UPDATE classrooms SET status = 'completed', ended_at = now() WHERE id = ${classroomId}`;
  await markEnrollmentCompleted(classroomId, session.studentId);

  await insertSystemMessage(classroomId, "课程结束");
}

export function markSessionWaitingJoinInteractive(classroomId: string) {
  const session = activeSessions.get(classroomId);
  if (!session) return;

  const runtime = getCourseRuntimeByKey(session.courseRuntimeKey);
  const firstInteractiveIndex = runtime.script.findIndex(isInteractiveStep);

  if (firstInteractiveIndex === -1) {
    return;
  }

  session.currentStepIndex = firstInteractiveIndex;
  session.pendingExercise = null;
  session.status = "waiting_join_interactive";
}

async function prestartLesson(classroomId: string): Promise<void> {
  const session = activeSessions.get(classroomId);
  if (!session) return;

  const runtime = getCourseRuntimeByKey(session.courseRuntimeKey);

  for (let index = 0; index < runtime.script.length; index++) {
    const step = runtime.script[index];

    if (isInteractiveStep(step)) {
      session.currentStepIndex = index;
      session.pendingExercise = null;
      session.status = "waiting_join_interactive";
      return;
    }

    if (step.type === "teacher_message") {
      await insertTeacherMessage(
        classroomId,
        step.content,
        "lecture",
        step.delay_ms || 0
      );
      session.currentStepIndex = index + 1;
      continue;
    }

    if (step.type === "summary") {
      await insertTeacherMessage(
        classroomId,
        step.content,
        "summary",
        step.delay_ms || 0
      );
      session.currentStepIndex = index + 1;
    }
  }
}

async function insertTeacherMessage(
  classroomId: string,
  content: string,
  messageType: string,
  delayMs = 0
): Promise<void> {
  const session = activeSessions.get(classroomId);
  const teacherName = session
    ? getCourseRuntimeByKey(session.courseRuntimeKey).meta.teacher_name
    : "teacher";

  await sql`
    INSERT INTO classroom_messages (
      classroom_id,
      agent_name,
      role,
      content,
      message_type,
      delay_ms
    )
    VALUES (
      ${classroomId},
      ${teacherName},
      'teacher',
      ${content},
      ${messageType},
      ${delayMs}
    )
  `;
}

async function insertStudentMessage(
  classroomId: string,
  studentId: string,
  studentName: string,
  content: string
): Promise<void> {
  await sql`
    INSERT INTO classroom_messages (
      classroom_id,
      agent_id,
      agent_name,
      role,
      content,
      message_type,
      delay_ms
    )
    VALUES (
      ${classroomId},
      ${studentId},
      ${studentName},
      'student',
      ${content},
      'answer',
      0
    )
  `;
}

async function insertSystemMessage(classroomId: string, content: string): Promise<void> {
  await sql`
    INSERT INTO classroom_messages (
      classroom_id,
      agent_name,
      role,
      content,
      message_type,
      delay_ms
    )
    VALUES (${classroomId}, 'system', 'system', ${content}, 'lecture', 0)
  `;
}

function parseQuizAnswer(content: string): number {
  const upper = content.toUpperCase().trim();
  if (upper.includes("B") || upper.includes("2")) return 1;
  if (upper.includes("A") || upper.includes("1")) return 0;
  if (upper.includes("C") || upper.includes("3")) return 2;
  if (upper.includes("D") || upper.includes("4")) return 3;
  return -1;
}

function isInteractiveStep(step: LectureStep) {
  return step.type === "roll_call" || step.type === "exercise" || step.type === "quiz";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
