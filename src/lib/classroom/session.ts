import sql from "@/lib/db";
import {
  evaluateStudentResponse,
  generateFinalEvaluation,
  type FinalEvaluation,
} from "@/lib/llm";
import { LECTURE_SCRIPT, RUBRIC, COURSE_META } from "@/lib/courses/lobster-101";
import type { LectureStep } from "@/types";

export interface ActiveSession {
  classroomId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  status: "waiting_join" | "running" | "waiting_response" | "evaluating" | "completed";
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
  studentId: string,
  studentName: string
): Promise<ActiveSession> {
  const session: ActiveSession = {
    classroomId,
    courseId,
    studentId,
    studentName,
    status: "waiting_join",
    currentStepIndex: 0,
    pendingExercise: null,
    studentResponses: [],
    finalEvaluation: null,
  };
  activeSessions.set(classroomId, session);
  return session;
}

export async function startSession(classroomId: string): Promise<void> {
  const session = activeSessions.get(classroomId);
  if (!session || session.status !== "waiting_join") return;

  session.status = "running";

  await sql`UPDATE classrooms SET status = 'in_progress', started_at = now() WHERE id = ${classroomId}`;

  await insertSystemMessage(classroomId, `「${session.studentName}」进入教室`);

  driveLesson(classroomId);
}

async function driveLesson(classroomId: string): Promise<void> {
  const session = activeSessions.get(classroomId);
  if (!session || session.status === "completed") return;

  while (session.currentStepIndex < LECTURE_SCRIPT.length) {
    const step = LECTURE_SCRIPT[session.currentStepIndex];

    const delay = step.delay_ms || 2000;
    await sleep(Math.min(delay, 3000));

    if ((session.status as string) === "completed") return;

    switch (step.type) {
      case "teacher_message":
        await insertTeacherMessage(classroomId, step.content, "lecture");
        session.currentStepIndex++;
        break;

      case "roll_call":
        await insertTeacherMessage(
          classroomId,
          `点名：${session.studentName}`,
          "roll_call"
        );
        session.status = "waiting_response";
        session.pendingExercise = step;
        return;

      case "exercise":
        await insertTeacherMessage(
          classroomId,
          step.exercise_prompt || step.content,
          "exercise"
        );
        session.status = "waiting_response";
        session.pendingExercise = step;
        return;

      case "quiz":
        await insertTeacherMessage(classroomId, step.content, "question");
        session.status = "waiting_response";
        session.pendingExercise = step;
        return;

      case "summary":
        await insertTeacherMessage(classroomId, step.content, "summary");
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

  await insertStudentMessage(classroomId, session.studentId, session.studentName, content);

  const step = session.pendingExercise;
  if (!step) {
    session.status = "running";
    session.currentStepIndex++;
    session.pendingExercise = null;
    driveLesson(classroomId);
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
    driveLesson(classroomId);
    return;
  }

  session.status = "evaluating";

  try {
    if (step.type === "quiz" && step.quiz_answer !== undefined) {
      const answerIndex = parseQuizAnswer(content);
      const correct = answerIndex === step.quiz_answer;
      const feedback = correct
        ? `回答正确。选 B 是对的——承认自己有不擅长的领域，比声称什么都会要专业得多。`
        : `回答错误。正确答案是 B。声称自己什么都会的龙虾，是最不可信的。`;
      await insertTeacherMessage(classroomId, feedback, "feedback");
    } else if (step.type === "exercise") {
      const rubricText = RUBRIC.map(
        (r) => `- ${r.name}（${r.max_score}分）：${r.description}`
      ).join("\n");

      const evaluation = await evaluateStudentResponse(
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
  driveLesson(classroomId);
}

async function finishSession(classroomId: string): Promise<void> {
  const session = activeSessions.get(classroomId);
  if (!session) return;

  session.status = "evaluating";

  const messages =
    await sql`SELECT role, agent_name, content, message_type FROM classroom_messages WHERE classroom_id = ${classroomId} ORDER BY created_at`;

  const messagesContext = messages
    .map((m) => `[${m.role}] ${m.agent_name}: ${m.content}`)
    .join("\n");

  const rubricText = RUBRIC.map(
    (r) => `- ${r.name}（${r.max_score}分）：${r.description}`
  ).join("\n");

  try {
    const evaluation = await generateFinalEvaluation(
      session.studentName,
      messagesContext,
      rubricText,
      `${COURSE_META.name} — ${COURSE_META.description}`,
      COURSE_META.teacher_style
    );

    session.finalEvaluation = evaluation;

    const courseRows = await sql`SELECT id FROM courses WHERE name = ${COURSE_META.name} LIMIT 1`;
    const courseId = courseRows.length > 0 ? courseRows[0].id : session.courseId;

    await sql`
      INSERT INTO transcripts (student_id, course_id, final_score, grade, teacher_comment, teacher_comment_style)
      VALUES (${session.studentId}, ${courseId}, ${evaluation.total_score}, ${evaluation.grade}, ${evaluation.comment}, ${evaluation.comment_style})
      ON CONFLICT (student_id, course_id) DO UPDATE SET
        final_score = EXCLUDED.final_score,
        grade = EXCLUDED.grade,
        teacher_comment = EXCLUDED.teacher_comment,
        completed_at = now()
    `;
  } catch (err) {
    console.error("Final evaluation failed:", err);
    session.finalEvaluation = {
      total_score: 65,
      grade: "D",
      comment: "系统评价暂时不可用，给了一个保守的及格分。",
      comment_style: "roast",
      memory_delta: "- 今天在龙虾大学上了《龙虾导论》\n- 课程主题：如何做好自我介绍",
      soul_suggestion: null,
    };
  }

  session.status = "completed";

  await sql`UPDATE classrooms SET status = 'completed', ended_at = now() WHERE id = ${classroomId}`;

  await insertSystemMessage(classroomId, "课程结束");
}

async function insertTeacherMessage(
  classroomId: string,
  content: string,
  messageType: string
): Promise<void> {
  await sql`
    INSERT INTO classroom_messages (classroom_id, agent_name, role, content, message_type)
    VALUES (${classroomId}, ${COURSE_META.teacher_name}, 'teacher', ${content}, ${messageType})
  `;
}

async function insertStudentMessage(
  classroomId: string,
  studentId: string,
  studentName: string,
  content: string
): Promise<void> {
  await sql`
    INSERT INTO classroom_messages (classroom_id, agent_id, agent_name, role, content, message_type)
    VALUES (${classroomId}, ${studentId}, ${studentName}, 'student', ${content}, 'answer')
  `;
}

async function insertSystemMessage(classroomId: string, content: string): Promise<void> {
  await sql`
    INSERT INTO classroom_messages (classroom_id, agent_name, role, content, message_type)
    VALUES (${classroomId}, 'system', 'system', ${content}, 'lecture')
  `;
}

function parseQuizAnswer(content: string): number {
  const upper = content.toUpperCase().trim();
  if (upper.includes("B") || upper.includes("2")) return 1;
  if (upper.includes("A") || upper.includes("1")) return 0;
  return -1;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
