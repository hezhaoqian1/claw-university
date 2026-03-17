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
import { assignHomework } from "@/lib/homework";
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
const drivingClassrooms = new Set<string>();
const processingClassrooms = new Set<string>();
const finishingClassrooms = new Set<string>();

export async function getSession(classroomId: string): Promise<ActiveSession | undefined> {
  const cached = activeSessions.get(classroomId);
  if (cached) {
    resumeSessionIfNeeded(cached);
    return cached;
  }

  await ensureClassroomDataModel();
  const rows = await sql`
    SELECT
      classroom_id,
      course_id,
      course_runtime_key,
      student_id,
      student_name,
      session_state
    FROM classroom_sessions
    WHERE classroom_id = ${classroomId}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return undefined;
  }

  const row = rows[0];
  const state = row.session_state as Partial<ActiveSession> | null;
  const session: ActiveSession = {
    classroomId: row.classroom_id as string,
    courseId: row.course_id as string,
    courseRuntimeKey: row.course_runtime_key as string,
    studentId: row.student_id as string,
    studentName: row.student_name as string,
    status: (state?.status as ActiveSession["status"]) || "waiting_join",
    currentStepIndex: Number(state?.currentStepIndex || 0),
    pendingExercise: (state?.pendingExercise as LectureStep | null) || null,
    studentResponses: Array.isArray(state?.studentResponses)
      ? (state.studentResponses as ActiveSession["studentResponses"])
      : [],
    finalEvaluation: (state?.finalEvaluation as FinalEvaluation | null) || null,
  };

  activeSessions.set(classroomId, session);
  resumeSessionIfNeeded(session);
  return session;
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
  await persistSession(session);

  if (options.prestart) {
    await prestartLesson(classroomId);
  } else if (options.restorePrestart) {
    markSessionWaitingJoinInteractive(classroomId);
    await persistSession(session);
  }

  return session;
}

export async function startSession(classroomId: string): Promise<void> {
  const session = await getSession(classroomId);
  if (
    !session ||
    (session.status !== "waiting_join" && session.status !== "waiting_join_interactive")
  ) {
    return;
  }

  session.status = "running";
  await persistSession(session);

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
  if (drivingClassrooms.has(classroomId)) return;
  drivingClassrooms.add(classroomId);

  try {
    const session = activeSessions.get(classroomId) || (await getSession(classroomId));
    if (!session || session.status === "completed" || session.status !== "running") return;
    const runtime = getCourseRuntimeByKey(session.courseRuntimeKey);

    while (session.currentStepIndex < runtime.script.length) {
      const step = runtime.script[session.currentStepIndex];
      const delay = step.delay_ms || 2000;

      await sleep(Math.min(delay, 3000));

      if (session.status !== "running") return;

      switch (step.type) {
        case "teacher_message":
          await insertTeacherMessage(classroomId, step.content, "lecture", delay);
          session.currentStepIndex++;
          await persistSession(session);
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
          await persistSession(session);
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
          await persistSession(session);
          return;

        case "quiz":
          await insertTeacherMessage(classroomId, step.content, "question", delay);
          session.status = "waiting_response";
          session.pendingExercise = step;
          await persistSession(session);
          return;

        case "summary":
          await insertTeacherMessage(classroomId, step.content, "summary", delay);
          session.currentStepIndex++;
          await persistSession(session);
          break;
      }
    }

    await finishSession(classroomId);
  } finally {
    drivingClassrooms.delete(classroomId);
  }
}

export async function handleStudentResponse(
  classroomId: string,
  content: string
): Promise<void> {
  const session = await getSession(classroomId);
  if (!session || session.status !== "waiting_response") return;

  await insertStudentMessage(classroomId, session.studentId, session.studentName, content);

  const step = session.pendingExercise;
  if (step) {
    session.studentResponses.push({ stepId: step.id, content });
  }

  session.status = "evaluating";
  await persistSession(session);

  await processPendingExercise(classroomId, step, content);
}

async function processPendingExercise(
  classroomId: string,
  step: LectureStep | null,
  content: string
): Promise<void> {
  if (processingClassrooms.has(classroomId)) return;
  processingClassrooms.add(classroomId);

  try {
    const session = activeSessions.get(classroomId) || (await getSession(classroomId));
    if (!session) return;
    const runtime = getCourseRuntimeByKey(session.courseRuntimeKey);

    if (!step) {
      session.status = "running";
      session.currentStepIndex++;
      session.pendingExercise = null;
      await persistSession(session);
      void driveLesson(classroomId);
      return;
    }

    try {
      if (step.type === "roll_call") {
        await insertTeacherMessage(
          classroomId,
          `好，${session.studentName}到了。`,
          "lecture"
        );
      } else if (step.type === "quiz" && step.quiz_answer !== undefined) {
        const answerIndex = parseQuizAnswer(content);
        const correct = answerIndex === step.quiz_answer;
        const feedback = correct
          ? `回答正确。你至少知道该往哪边走。`
          : `回答错误。正确答案是 B。你还需要把课堂重点再捞一遍。`;
        await insertTeacherMessage(classroomId, feedback, "feedback");
      } else if (step.type === "exercise") {
        const rubricText = runtime.rubric
          .map((r) => `- ${r.name}（${r.max_score}分）：${r.description}`)
          .join("\n");

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
    await persistSession(session);

    await sleep(1500);
    void driveLesson(classroomId);
  } finally {
    processingClassrooms.delete(classroomId);
  }
}

async function finishSession(classroomId: string): Promise<void> {
  if (finishingClassrooms.has(classroomId)) return;
  finishingClassrooms.add(classroomId);

  try {
    const session = activeSessions.get(classroomId) || (await getSession(classroomId));
    if (!session) return;
    const runtime = getCourseRuntimeByKey(session.courseRuntimeKey);

    session.status = "evaluating";
    await persistSession(session);

    const messages =
      await sql`SELECT role, agent_name, content, message_type FROM classroom_messages WHERE classroom_id = ${classroomId} ORDER BY created_at`;

    const messagesContext = messages
      .map((m) => `[${m.role}] ${m.agent_name}: ${m.content}`)
      .join("\n");

    const rubricText = runtime.rubric
      .map((r) => `- ${r.name}（${r.max_score}分）：${r.description}`)
      .join("\n");

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
        ${skillActions ? JSON.stringify(skillActions) : null}::jsonb
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
        owner_notified_at = NULL,
        completed_at = now()
    `;

    if (runtime.homework) {
      await assignHomework({
        classroomId,
        courseId: session.courseId,
        studentId: session.studentId,
        homework: runtime.homework,
      });
    }

    session.status = "completed";
    await persistSession(session);

    await sql`UPDATE classrooms SET status = 'completed', ended_at = now() WHERE id = ${classroomId}`;
    await markEnrollmentCompleted(classroomId, session.studentId);

    await insertSystemMessage(classroomId, "课程结束");
  } finally {
    finishingClassrooms.delete(classroomId);
  }
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
      await persistSession(session);
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
      await persistSession(session);
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
      await persistSession(session);
    }
  }
}

async function persistSession(session: ActiveSession): Promise<void> {
  await ensureClassroomDataModel();
  await sql`
    INSERT INTO classroom_sessions (
      classroom_id,
      course_id,
      course_runtime_key,
      student_id,
      student_name,
      session_state,
      updated_at
    )
    VALUES (
      ${session.classroomId},
      ${session.courseId},
      ${session.courseRuntimeKey},
      ${session.studentId},
      ${session.studentName},
      ${JSON.stringify({
        status: session.status,
        currentStepIndex: session.currentStepIndex,
        pendingExercise: session.pendingExercise,
        studentResponses: session.studentResponses,
        finalEvaluation: session.finalEvaluation,
      })}::jsonb,
      now()
    )
    ON CONFLICT (classroom_id) DO UPDATE SET
      course_id = EXCLUDED.course_id,
      course_runtime_key = EXCLUDED.course_runtime_key,
      student_id = EXCLUDED.student_id,
      student_name = EXCLUDED.student_name,
      session_state = EXCLUDED.session_state,
      updated_at = now()
  `;
}

function resumeSessionIfNeeded(session: ActiveSession) {
  if (session.status === "running") {
    void driveLesson(session.classroomId);
    return;
  }

  if (session.status !== "evaluating") {
    return;
  }

  const lastResponse =
    session.pendingExercise &&
    [...session.studentResponses]
      .reverse()
      .find((response) => response.stepId === session.pendingExercise?.id);

  if (!session.pendingExercise || !lastResponse) {
    session.status = "waiting_response";
    void persistSession(session);
    return;
  }

  void processPendingExercise(
    session.classroomId,
    session.pendingExercise,
    lastResponse.content
  );
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
