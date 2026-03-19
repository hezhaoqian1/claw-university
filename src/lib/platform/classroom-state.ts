import { getBaseUrl } from "@/lib/app-url";
import {
  getSession,
  type ActiveSession,
} from "@/lib/classroom/session";
import {
  ensureClassroomDataModel,
  resolveClassroomStudent,
} from "@/lib/classroom/ownership";
import {
  getCourseRuntimeByKey,
  maybeGetCourseRuntimeByName,
} from "@/lib/courses/registry";
import {
  normalizeCapabilityGrants,
  normalizeFirstDeliverable,
} from "@/lib/course-results";
import sql from "@/lib/db";
import { getHomeworkForClassroomStudent } from "@/lib/homework";
import { normalizeSkillActions } from "@/lib/skill-actions";
import type {
  CapabilityGrant,
  FirstDeliverable,
  LectureStep,
  SkillAction,
} from "@/types";

type Actor = "agent" | "owner" | "school";

export type PlatformClassroomLifecycle =
  | "prestart"
  | "active"
  | "blocked"
  | "post_class"
  | "done";

export type PlatformClassroomStageCode =
  | "lecture"
  | "attendance"
  | "exercise"
  | "quiz"
  | "capability_unlock"
  | "evaluation"
  | "deliverable"
  | "recap";

export type PlatformClassroomBlockerCode =
  | "awaiting_agent_join"
  | "student_response_required"
  | "capability_unlock_required"
  | "first_deliverable_required";

interface PlatformStage {
  code: PlatformClassroomStageCode;
  label: string;
  detail: string;
  waiting_for_response: boolean;
  prompt_hint: string | null;
}

interface PlatformBlocker {
  code: PlatformClassroomBlockerCode;
  title: string;
  detail: string;
  actor: Actor;
  retryable: boolean;
}

interface PlatformNextAction {
  code: string;
  label: string;
  detail: string;
  actor: Actor;
}

interface NormalizedEvaluation {
  ready: boolean;
  score: number | null;
  grade: string | null;
  claimed_at: string | null;
  owner_notified_at: string | null;
  completed_at: string | null;
  skill_actions: SkillAction[] | null;
  capability_grants: CapabilityGrant[] | null;
  first_deliverable: FirstDeliverable | null;
}

export interface PlatformClassroomState {
  classroom_id: string;
  student_id: string | null;
  student_name: string | null;
  course: {
    id: string;
    runtime_key: string | null;
    name: string;
    description: string;
    category: string;
    teacher_name: string;
    teacher_style: string;
    live_runtime: boolean;
  };
  lifecycle: PlatformClassroomLifecycle;
  stage: PlatformStage;
  blocker: PlatformBlocker | null;
  next_action: PlatformNextAction | null;
  runtime: {
    classroom_status: string;
    session_status: ActiveSession["status"] | null;
    runtime_active: boolean;
    current_step_index: number | null;
    total_steps: number | null;
  };
  activity: {
    message_count: number;
    last_message_at: string | null;
    scheduled_at: string | null;
    started_at: string | null;
    ended_at: string | null;
    joined_at: string | null;
    enrollment_completed_at: string | null;
    transcript_completed_at: string | null;
  };
  result: NormalizedEvaluation;
  homework: {
    id: string;
    title: string;
    description: string;
    submission_format: string;
    due_at: string;
    status: string;
    submitted_at: string | null;
  } | null;
  actions: {
    classroom_url: string;
    start_url: string;
    messages_url: string;
    respond_url: string;
    result_url: string | null;
    notify_url: string | null;
    claim_url: string | null;
    deliverable_submit_url: string | null;
  };
}

interface ClassroomRow {
  classroom_id: string;
  classroom_status: string;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  course_id: string;
  course_name: string;
  course_description: string;
  course_category: string;
  teacher_name: string;
  teacher_style: string;
}

export async function buildPlatformClassroomState(params: {
  classroomId: string;
  requestedStudentId?: string | null;
  baseUrl: string;
}): Promise<PlatformClassroomState | null> {
  await ensureClassroomDataModel();

  const { classroomId, requestedStudentId, baseUrl } = params;
  const session = await getSession(classroomId, { resumeIfNeeded: false });

  const classroomRows = await sql`
    SELECT
      c.id AS classroom_id,
      c.status AS classroom_status,
      c.scheduled_at,
      c.started_at,
      c.ended_at,
      co.id AS course_id,
      co.name AS course_name,
      co.description AS course_description,
      co.category AS course_category,
      co.teacher_name,
      co.teacher_style
    FROM classrooms c
    JOIN courses co ON co.id = c.course_id
    WHERE c.id = ${classroomId}
    LIMIT 1
  `;

  if (classroomRows.length === 0) {
    return null;
  }

  const classroom = classroomRows[0] as ClassroomRow;
  const studentId = await resolveStateStudentId(classroomId, requestedStudentId, session);

  const enrollmentRows =
    studentId
      ? await sql`
          SELECT ce.joined_at, ce.completed_at, s.name AS student_name
          FROM classroom_enrollments ce
          JOIN students s ON s.id = ce.student_id
          WHERE ce.classroom_id = ${classroomId}
            AND ce.student_id = ${studentId}
          LIMIT 1
        `
      : [];

  const transcriptRows =
    studentId
      ? await sql`
          SELECT
            t.final_score,
            t.grade,
            t.claimed_at,
            t.owner_notified_at,
            t.completed_at,
            t.skill_actions,
            t.capability_grants,
            t.first_deliverable
          FROM transcripts t
          WHERE t.classroom_id = ${classroomId}
            AND t.student_id = ${studentId}
          LIMIT 1
        `
      : [];

  const messageStatsRows = await sql`
    SELECT
      COUNT(*)::int AS message_count,
      MAX(created_at) AS last_message_at
    FROM classroom_messages
    WHERE classroom_id = ${classroomId}
  `;

  const runtime =
    session
      ? getCourseRuntimeByKey(session.courseRuntimeKey)
      : maybeGetCourseRuntimeByName(classroom.course_name);
  const totalSteps = runtime?.script.length ?? null;
  const promptHint = buildPromptHint(session?.pendingExercise || null);
  const homework =
    studentId ? await getHomeworkForClassroomStudent(classroomId, studentId) : null;
  const evaluation = normalizeEvaluation(session, studentId, transcriptRows[0] || null);
  const activity = {
    message_count: Number(messageStatsRows[0]?.message_count || 0),
    last_message_at: (messageStatsRows[0]?.last_message_at as string | null) || null,
    scheduled_at: classroom.scheduled_at,
    started_at: classroom.started_at,
    ended_at: classroom.ended_at,
    joined_at: (enrollmentRows[0]?.joined_at as string | null) || null,
    enrollment_completed_at: (enrollmentRows[0]?.completed_at as string | null) || null,
    transcript_completed_at: evaluation.completed_at,
  };

  const { lifecycle, stage, blocker, nextAction } = buildStateEnvelope({
    classroomStatus: classroom.classroom_status,
    session,
    runtime,
    promptHint,
    evaluation,
    homework,
    messageCount: activity.message_count,
  });

  const resultUrl = studentId
    ? appendStudentId(
        `${baseUrl}/api/v1/classroom/${classroomId}/result`,
        studentId
      )
    : null;
  const notifyUrl = resultUrl ? appendFlag(resultUrl, "notify") : null;
  const claimUrl = resultUrl ? appendFlag(resultUrl, "claim") : null;

  return {
    classroom_id: classroomId,
    student_id: studentId,
    student_name:
      (enrollmentRows[0]?.student_name as string | null) ||
      session?.studentName ||
      null,
    course: {
      id: classroom.course_id,
      runtime_key: runtime?.key || null,
      name: classroom.course_name,
      description: classroom.course_description,
      category: classroom.course_category,
      teacher_name: classroom.teacher_name,
      teacher_style: classroom.teacher_style,
      live_runtime: Boolean(runtime),
    },
    lifecycle,
    stage,
    blocker,
    next_action: nextAction,
    runtime: {
      classroom_status: classroom.classroom_status,
      session_status: session?.status || null,
      runtime_active: Boolean(session),
      current_step_index: session?.currentStepIndex ?? null,
      total_steps: totalSteps,
    },
    activity,
    result: evaluation,
    homework: homework
      ? {
          id: homework.id,
          title: homework.title,
          description: homework.description,
          submission_format: homework.submissionFormat,
          due_at: homework.dueAt,
          status: homework.status,
          submitted_at: homework.submittedAt,
        }
      : null,
    actions: {
      classroom_url: `${baseUrl}/classroom/${classroomId}`,
      start_url: `${baseUrl}/api/v1/classroom/start`,
      messages_url: `${baseUrl}/api/v1/classroom/${classroomId}/messages`,
      respond_url: `${baseUrl}/api/v1/classroom/${classroomId}/respond`,
      result_url: resultUrl,
      notify_url: notifyUrl,
      claim_url: claimUrl,
      deliverable_submit_url:
        studentId && evaluation.first_deliverable
          ? `${baseUrl}/api/v1/classroom/${classroomId}/deliverable`
          : null,
    },
  };
}

async function resolveStateStudentId(
  classroomId: string,
  requestedStudentId: string | null | undefined,
  session: ActiveSession | undefined
) {
  let studentId = requestedStudentId || session?.studentId || null;

  if (!studentId) {
    const resolved = await resolveClassroomStudent(classroomId);

    if (resolved.ambiguous) {
      throw new Error("Missing student_id for a multi-student classroom");
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
      throw new Error("Missing student_id for a multi-student classroom");
    }

    studentId = (transcriptOwners[0]?.student_id as string | null) || null;
  }

  return studentId;
}

function normalizeEvaluation(
  session: ActiveSession | undefined,
  studentId: string | null,
  transcriptRow: Record<string, unknown> | null
): NormalizedEvaluation {
  if (transcriptRow) {
    return {
      ready: true,
      score: Number(transcriptRow.final_score),
      grade: (transcriptRow.grade as string) || null,
      claimed_at: (transcriptRow.claimed_at as string | null) || null,
      owner_notified_at: (transcriptRow.owner_notified_at as string | null) || null,
      completed_at: (transcriptRow.completed_at as string | null) || null,
      skill_actions: normalizeSkillActions(transcriptRow.skill_actions),
      capability_grants: normalizeCapabilityGrants(transcriptRow.capability_grants),
      first_deliverable: normalizeFirstDeliverable(transcriptRow.first_deliverable),
    };
  }

  if (session?.finalEvaluation && session.studentId === studentId) {
    return {
      ready: true,
      score: session.finalEvaluation.total_score,
      grade: session.finalEvaluation.grade,
      claimed_at: null,
      owner_notified_at: null,
      completed_at: null,
      skill_actions: normalizeSkillActions(session.finalEvaluation.skill_actions),
      capability_grants: normalizeCapabilityGrants(
        session.finalEvaluation.capability_grants
      ),
      first_deliverable: normalizeFirstDeliverable(
        session.finalEvaluation.first_deliverable
      ),
    };
  }

  return {
    ready: false,
    score: null,
    grade: null,
    claimed_at: null,
    owner_notified_at: null,
    completed_at: null,
    skill_actions: null,
    capability_grants: null,
    first_deliverable: null,
  };
}

function buildStateEnvelope(input: {
  classroomStatus: string;
  session: ActiveSession | undefined;
  runtime:
    | ReturnType<typeof getCourseRuntimeByKey>
    | ReturnType<typeof maybeGetCourseRuntimeByName>;
  promptHint: string | null;
  evaluation: NormalizedEvaluation;
  homework:
    | Awaited<ReturnType<typeof getHomeworkForClassroomStudent>>
    | null;
  messageCount: number;
}) {
  const {
    classroomStatus,
    session,
    runtime,
    promptHint,
    evaluation,
    homework,
    messageCount,
  } = input;

  if (evaluation.first_deliverable?.status === "pending") {
    return {
      lifecycle: "blocked" as const,
      stage: buildStage(
        "deliverable",
        "提交第一份成果",
        "这门课要求先交出第一份作品，成绩回执和主人汇报都要等它提交完成后才算真正结课。",
        false,
        null
      ),
      blocker: buildBlocker(
        "first_deliverable_required",
        "第一份成果还没提交",
        evaluation.first_deliverable.description,
        "agent",
        true
      ),
      nextAction: buildNextAction(
        "submit_first_deliverable",
        "先交第一份成果",
        "先把课堂里学到的能力变成一份真实作品，再去汇报和认领成绩。",
        "agent"
      ),
    };
  }

  if (session?.status === "unlocking") {
    return {
      lifecycle: "blocked" as const,
      stage: buildStage(
        "capability_unlock",
        "课堂授予",
        "老师正在等待龙虾完成课堂里的技能安装或能力解锁回执。",
        true,
        promptHint
      ),
      blocker: buildBlocker(
        "capability_unlock_required",
        "等待课堂授予完成",
        "这不是普通聊天环节。龙虾要先按老师要求完成安装或回执，课堂才会继续。",
        "agent",
        true
      ),
      nextAction: buildNextAction(
        "complete_capability_unlock",
        "完成课堂授予",
        "按老师给出的格式提交安装结果或阻塞点，不要空口答应。",
        "agent"
      ),
    };
  }

  if (session?.status === "waiting_response") {
    const stepStage = buildInteractiveStage(
      session.pendingExercise || null,
      "老师正在等龙虾回应。",
      promptHint
    );

    return {
      lifecycle: "active" as const,
      stage: stepStage,
      blocker: buildBlocker(
        "student_response_required",
        "等待课堂回应",
        "当前课堂卡在互动点，龙虾必须先回答老师的问题，课堂才会往下走。",
        "agent",
        true
      ),
      nextAction: buildNextAction(
        "respond_to_teacher",
        "回答老师当前问题",
        promptHint || "按照课堂当前要求作答。",
        "agent"
      ),
    };
  }

  if (
    session?.status === "waiting_join_interactive" ||
    (!session && classroomStatus === "scheduled" && messageCount > 0)
  ) {
    return {
      lifecycle: "prestart" as const,
      stage: buildStage(
        "lecture",
        "老师预热中",
        "老师已经开始讲开场，龙虾会在下一次 HEARTBEAT 自动接上互动段。",
        false,
        null
      ),
      blocker: buildBlocker(
        "awaiting_agent_join",
        "等待龙虾入场",
        "课堂已经预热到第一个互动点前，接下来只等龙虾自动进入教室。",
        "agent",
        true
      ),
      nextAction: buildNextAction(
        "agent_join_classroom",
        "等待龙虾自动开课",
        "龙虾下一次 HEARTBEAT 会调用 /classroom/start 自动接入，不需要主人再次批准。",
        "agent"
      ),
    };
  }

  if (session?.status === "waiting_join" || classroomStatus === "scheduled") {
    return {
      lifecycle: "prestart" as const,
      stage: buildStage(
        "lecture",
        "课堂待开场",
        "课堂已经创建，但还在等龙虾的第一次自动入场。",
        false,
        null
      ),
      blocker: buildBlocker(
        "awaiting_agent_join",
        "等待龙虾入场",
        "学校已经排好课堂，接下来要靠 HEARTBEAT 发现并自动开课。",
        "agent",
        true
      ),
      nextAction: buildNextAction(
        "agent_join_classroom",
        "等待龙虾自动开课",
        "如果迟迟没进入课堂，优先检查它的 HEARTBEAT 是否还在稳定执行。",
        "agent"
      ),
    };
  }

  if (session?.status === "running") {
    return {
      lifecycle: "active" as const,
      stage: buildUpcomingStage(session, runtime),
      blocker: null,
      nextAction: null,
    };
  }

  if (session?.status === "evaluating") {
    return {
      lifecycle: "post_class" as const,
      stage: buildStage(
        "evaluation",
        "老师判卷中",
        "课堂互动已经结束，老师正在整理分数、评语和课后结果。",
        false,
        null
      ),
      blocker: null,
      nextAction: buildNextAction(
        "await_evaluation",
        "等待成绩生成",
        "这一步由学校完成，龙虾暂时不用再回答问题。",
        "school"
      ),
    };
  }

  if (evaluation.ready) {
    const recapStage = buildStage(
      "recap",
      "结课汇报",
      "课堂已经结束，接下来处理给主人汇报、学校回执和课后作业。",
      false,
      null
    );

    if (!evaluation.owner_notified_at) {
      return {
        lifecycle: "post_class" as const,
        stage: recapStage,
        blocker: null,
        nextAction: buildNextAction(
          "report_to_owner",
          "先向当前人类汇报",
          "先在当前聊天里把成绩、老师评语和新能力讲清楚，再调用 notify_url 给学校回执。",
          "agent"
        ),
      };
    }

    if (!evaluation.claimed_at) {
      return {
        lifecycle: "post_class" as const,
        stage: recapStage,
        blocker: null,
        nextAction: buildNextAction(
          "claim_result",
          "认领这次成绩",
          "主人已经收到汇报，现在向学校确认这份成绩已经被领取。",
          "agent"
        ),
      };
    }

    if (homework?.status === "assigned") {
      return {
        lifecycle: "post_class" as const,
        stage: recapStage,
        blocker: null,
        nextAction: buildNextAction(
          "complete_homework",
          "完成课后作业",
          `这门课还有课后作业：${homework.title}`,
          "agent"
        ),
      };
    }

    if (homework?.status === "submitted") {
      return {
        lifecycle: "post_class" as const,
        stage: recapStage,
        blocker: null,
        nextAction: buildNextAction(
          "await_homework_review",
          "等待作业反馈",
          `作业《${homework.title}》已经提交，等待学校后续处理。`,
          "school"
        ),
      };
    }

    return {
      lifecycle: "done" as const,
      stage: recapStage,
      blocker: null,
      nextAction: null,
    };
  }

  if (classroomStatus === "completed") {
    return {
      lifecycle: "post_class" as const,
      stage: buildStage(
        "evaluation",
        "课堂已结束",
        "课堂已经收尾，但成绩和课后结果还没完全落账。",
        false,
        null
      ),
      blocker: null,
      nextAction: buildNextAction(
        "await_result_persistence",
        "等待结果落账",
        "学校正在把这节课的最终结果写入成绩档案。",
        "school"
      ),
    };
  }

  return {
    lifecycle: "active" as const,
    stage: buildStage(
      "lecture",
      "课堂进行中",
      "课堂正在推进，暂时没有需要龙虾回应的互动点。",
      false,
      null
    ),
    blocker: null,
    nextAction: null,
  };
}

function buildUpcomingStage(
  session: ActiveSession,
  runtime:
    | ReturnType<typeof getCourseRuntimeByKey>
    | ReturnType<typeof maybeGetCourseRuntimeByName>
) {
  const nextStep = runtime?.script[session.currentStepIndex] || null;
  const promptHint = nextStep ? buildPromptHint(nextStep) : null;

  if (!nextStep) {
    return buildStage(
      "lecture",
      "课堂进行中",
      "老师已经讲到尾声，接下来通常会进入结课评估。",
      false,
      null
    );
  }

  switch (nextStep.type) {
    case "roll_call":
      return buildStage(
        "attendance",
        "即将点名",
        "老师下一步会先确认龙虾是否到场。",
        false,
        promptHint
      );
    case "exercise":
      return buildStage(
        "exercise",
        "即将进入练习",
        "老师下一步会抛出课堂练习，让龙虾现场作答。",
        false,
        promptHint
      );
    case "quiz":
      return buildStage(
        "quiz",
        "即将进入测验",
        "老师下一步会给一道随堂测验题。",
        false,
        promptHint
      );
    case "tool_unlock":
      return buildStage(
        "capability_unlock",
        "即将进入课堂授予",
        "老师下一步会要求龙虾在课堂里解锁一项新能力。",
        false,
        promptHint
      );
    default:
      return buildStage(
        "lecture",
        "老师讲课中",
        "老师正在推进讲授段落，课堂还没到互动停顿点。",
        false,
        null
      );
  }
}

function buildInteractiveStage(
  step: LectureStep | null,
  fallbackDetail: string,
  promptHint: string | null
) {
  if (!step) {
    return buildStage("exercise", "等待课堂回应", fallbackDetail, true, promptHint);
  }

  switch (step.type) {
    case "roll_call":
      return buildStage(
        "attendance",
        "等待点名回应",
        "老师在确认龙虾是否到场。通常只需要简短报到。",
        true,
        promptHint
      );
    case "exercise":
      return buildStage(
        "exercise",
        "等待练习作答",
        "老师已经布置课堂练习，龙虾需要给出完整回答。",
        true,
        promptHint
      );
    case "quiz":
      return buildStage(
        "quiz",
        "等待测验作答",
        "老师已经给出选择或判断题，龙虾需要明确回答。",
        true,
        promptHint
      );
    case "tool_unlock":
      return buildStage(
        "capability_unlock",
        "等待课堂授予",
        "老师正在要求龙虾当场安装技能或提交解锁回执。",
        true,
        promptHint
      );
    default:
      return buildStage("exercise", "等待课堂回应", fallbackDetail, true, promptHint);
  }
}

function buildStage(
  code: PlatformClassroomStageCode,
  label: string,
  detail: string,
  waitingForResponse: boolean,
  promptHint: string | null
): PlatformStage {
  return {
    code,
    label,
    detail,
    waiting_for_response: waitingForResponse,
    prompt_hint: promptHint,
  };
}

function buildBlocker(
  code: PlatformClassroomBlockerCode,
  title: string,
  detail: string,
  actor: Actor,
  retryable: boolean
): PlatformBlocker {
  return {
    code,
    title,
    detail,
    actor,
    retryable,
  };
}

function buildNextAction(
  code: string,
  label: string,
  detail: string,
  actor: Actor
): PlatformNextAction {
  return {
    code,
    label,
    detail,
    actor,
  };
}

function buildPromptHint(step: LectureStep | null): string | null {
  if (!step) {
    return null;
  }

  if (step.type === "roll_call") {
    return "请回答「到」";
  }

  if (step.type === "exercise") {
    return step.exercise_prompt || step.content;
  }

  if (step.type === "quiz") {
    return step.content;
  }

  if (step.type === "tool_unlock") {
    return (
      step.unlock_prompt ||
      "现在在课堂里安装老师授予的技能。成功就按 UNLOCK_STATUS / UNLOCKED_SKILL / INSTALL_NOTE 回复；失败就按 UNLOCK_STATUS / ERROR 回复。"
    );
  }

  return null;
}

function appendStudentId(url: string, studentId: string) {
  const nextUrl = new URL(url);
  nextUrl.searchParams.set("student_id", studentId);
  return nextUrl.toString();
}

function appendFlag(url: string, flag: "notify" | "claim") {
  const nextUrl = new URL(url);
  nextUrl.searchParams.set(flag, "1");
  return nextUrl.toString();
}

export function getPlatformBaseUrl(req: { nextUrl?: { origin: string } }) {
  return getBaseUrl(req);
}
