import sql from "@/lib/db";
import {
  ACADEMY_COURSES,
  ACADEMY_TRACKS,
  buildAcademyFitScores,
  buildCohortRecommendations,
  buildImmediateRecommendations,
  defaultTraitScores,
  getCourseExperienceLabel,
  getTrackById,
  scorePlacementAnswers,
  type AcademyDimension,
} from "@/lib/academy/catalog";
import { isLiveCourseKey } from "@/lib/courses/registry";
import {
  buildCourseCatalogSummary,
  formatCourseAttendanceLabel,
  formatCourseDeliveryLabel,
  type CourseCardContract,
  type CourseCatalogContract,
  type CourseEnrollmentStatus,
} from "@/lib/courses/course-contract";
import { ensureClassroomDataModel } from "@/lib/classroom/ownership";
import {
  normalizeCapabilityGrants,
  normalizeFirstDeliverable,
} from "@/lib/course-results";
import { listPendingHomeworkForStudent } from "@/lib/homework";
import { buildPostClassRecap } from "@/lib/post-class-recap";
import { normalizeSkillActions } from "@/lib/skill-actions";

interface StudentAssessmentRow {
  answers: Record<string, string>;
  trait_scores: Record<AcademyDimension, number>;
  readiness_score: number;
  profile_key: string;
  profile_label: string;
  profile_summary: string;
  primary_academy_id: string;
  secondary_academy_id: string | null;
  created_at: string;
  updated_at: string;
}

type PendingClassroomSummary = {
  classroomId: string;
  status: string;
  courseName: string;
  classroomUrl: string;
};

type ImmediateRecommendation = ReturnType<typeof buildImmediateRecommendations>[number];
type ScheduledRecommendation = ReturnType<typeof buildCohortRecommendations>[number];

const GRADE_STEPS = [
  { key: "freshman", label: "新生", threshold: 0, nextThreshold: 6, nextLabel: "二年级" },
  { key: "sophomore", label: "二年级", threshold: 6, nextThreshold: 12, nextLabel: "三年级" },
  { key: "junior", label: "三年级", threshold: 12, nextThreshold: 18, nextLabel: "四年级" },
  { key: "senior", label: "四年级", threshold: 18, nextThreshold: 24, nextLabel: "毕业" },
  { key: "graduate", label: "毕业生", threshold: 24, nextThreshold: 24, nextLabel: "毕业" },
] as const;

let growthSchemaReady: Promise<void> | null = null;
let catalogReady: Promise<void> | null = null;

export async function ensureStudentGrowthDataModel(): Promise<void> {
  if (!growthSchemaReady) {
    growthSchemaReady = (async () => {
      await ensureClassroomDataModel();

      await sql`
        CREATE TABLE IF NOT EXISTS student_assessments (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          student_id uuid REFERENCES students(id) NOT NULL UNIQUE,
          answers jsonb NOT NULL DEFAULT '{}'::jsonb,
          trait_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
          readiness_score integer NOT NULL DEFAULT 0,
          profile_key text NOT NULL,
          profile_label text NOT NULL,
          profile_summary text NOT NULL,
          primary_academy_id text NOT NULL,
          secondary_academy_id text,
          created_at timestamptz DEFAULT now() NOT NULL,
          updated_at timestamptz DEFAULT now() NOT NULL
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_student_assessments_readiness
        ON student_assessments(readiness_score DESC)
      `;
    })().catch((error) => {
      growthSchemaReady = null;
      throw error;
    });
  }

  await growthSchemaReady;
}

export async function ensureAcademyCatalogCourses(): Promise<void> {
  if (!catalogReady) {
    catalogReady = (async () => {
      await ensureStudentGrowthDataModel();

      const existingRows = await sql`SELECT name FROM courses`;
      const existingNames = new Set(existingRows.map((row) => row.name as string));

      for (const course of ACADEMY_COURSES) {
        if (course.retired) {
          continue;
        }

        if (existingNames.has(course.name)) {
          continue;
        }

        await sql`
          INSERT INTO courses (
            name,
            description,
            difficulty_level,
            category,
            teacher_name,
            teacher_style
          )
          VALUES (
            ${course.name},
            ${`[${getCourseExperienceLabel(course.experience)} · ${course.academyName}] ${course.description}`},
            ${course.difficulty},
            ${course.category},
            ${course.teacherName},
            ${course.teacherStyle}
          )
        `;

        existingNames.add(course.name);
      }
    })().catch((error) => {
      catalogReady = null;
      throw error;
    });
  }

  await catalogReady;
}

export async function getStudentAssessment(studentId: string) {
  await ensureStudentGrowthDataModel();

  const rows = await sql`
    SELECT
      answers,
      trait_scores,
      readiness_score,
      profile_key,
      profile_label,
      profile_summary,
      primary_academy_id,
      secondary_academy_id,
      created_at,
      updated_at
    FROM student_assessments
    WHERE student_id = ${studentId}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return null;
  }

  return normalizeAssessmentRow(rows[0] as StudentAssessmentRow);
}

export async function saveStudentAssessment(
  studentId: string,
  answers: Record<string, string>
) {
  await ensureStudentGrowthDataModel();
  const result = scorePlacementAnswers(answers);

  await sql`
    INSERT INTO student_assessments (
      student_id,
      answers,
      trait_scores,
      readiness_score,
      profile_key,
      profile_label,
      profile_summary,
      primary_academy_id,
      secondary_academy_id
    )
    VALUES (
      ${studentId},
      ${JSON.stringify(result.answers)}::jsonb,
      ${JSON.stringify(result.traitScores)}::jsonb,
      ${result.readinessScore},
      ${result.profileKey},
      ${result.profileLabel},
      ${result.profileSummary},
      ${result.primaryAcademyId},
      ${result.secondaryAcademyId}
    )
    ON CONFLICT (student_id) DO UPDATE SET
      answers = EXCLUDED.answers,
      trait_scores = EXCLUDED.trait_scores,
      readiness_score = EXCLUDED.readiness_score,
      profile_key = EXCLUDED.profile_key,
      profile_label = EXCLUDED.profile_label,
      profile_summary = EXCLUDED.profile_summary,
      primary_academy_id = EXCLUDED.primary_academy_id,
      secondary_academy_id = EXCLUDED.secondary_academy_id,
      updated_at = now()
  `;

  return result;
}

export async function buildStudentDashboard(studentId: string) {
  await ensureAcademyCatalogCourses();

  const studentRows = await sql`
    SELECT
      id,
      name,
      student_number,
      model_type,
      current_grade,
      total_credits,
      last_heartbeat_at,
      created_at
    FROM students
    WHERE id = ${studentId}
    LIMIT 1
  `;

  if (studentRows.length === 0) {
    throw new Error("Student not found");
  }

  const student = studentRows[0];
  const assessment = await getStudentAssessment(studentId);
  const pendingHomework = await listPendingHomeworkForStudent(studentId);

  const transcriptRows = await sql`
    SELECT
      t.classroom_id,
      t.final_score,
      t.grade,
      t.teacher_comment,
      t.teacher_comment_style,
      t.memory_delta,
      t.soul_suggestion,
      t.skill_actions,
      t.capability_grants,
      t.first_deliverable,
      t.owner_notified_at,
      t.completed_at,
      c.name AS course_name,
      c.teacher_name,
      c.description AS course_description
    FROM transcripts t
    JOIN courses c ON c.id = t.course_id
    WHERE t.student_id = ${studentId}
    ORDER BY t.completed_at DESC
  `;

  const homeworkRows = await sql`
    SELECT
      id,
      classroom_id,
      title,
      description,
      due_at,
      status,
      submitted_at
    FROM homework_assignments
    WHERE student_id = ${studentId}
  `;

  const pendingRows = await sql`
    SELECT
      c.id,
      c.status,
      co.name AS course_name
    FROM classroom_enrollments ce
    JOIN classrooms c ON c.id = ce.classroom_id
    JOIN courses co ON co.id = ce.course_id
    WHERE ce.student_id = ${studentId}
      AND c.status IN ('scheduled', 'in_progress')
    ORDER BY c.scheduled_at ASC NULLS LAST, ce.enrolled_at DESC
  `;

  const rankingRows = await sql`
    SELECT
      student_id,
      AVG(final_score) AS avg_score,
      COUNT(*) AS course_count
    FROM transcripts
    GROUP BY student_id
    HAVING COUNT(*) > 0
  `;

  const transcriptAverage = transcriptRows.length
    ? Math.round(
        transcriptRows.reduce(
          (sum, row) => sum + Number(row.final_score),
          0
        ) / transcriptRows.length
      )
    : null;

  const totalCredits = Math.max(
    Number(student.total_credits || 0),
    transcriptRows.length * 3
  );
  const gradeState = deriveGradeState(totalCredits);

  const traitScores = assessment?.traitScores || defaultTraitScores();
  const academyFit = buildAcademyFitScores(traitScores);
  const primaryAcademy = assessment
    ? getTrackById(assessment.primaryAcademyId)
    : academyFit[0];
  const secondaryAcademy = assessment?.secondaryAcademyId
    ? getTrackById(assessment.secondaryAcademyId)
    : academyFit[1];

  const readinessScore = assessment?.readinessScore || 0;
  const growthScore = Math.round(
    transcriptAverage === null
      ? Math.max(48, readinessScore)
      : readinessScore > 0
        ? readinessScore * 0.55 + transcriptAverage * 0.45
        : transcriptAverage
  );

  const campusRanking = buildCampusRanking(
    studentId,
    transcriptAverage,
    rankingRows.map((row) => ({
      studentId: row.student_id as string,
      avgScore: Math.round(Number(row.avg_score)),
    }))
  );

  const pendingClassrooms = pendingRows.map((row) => ({
    classroomId: row.id as string,
    status: row.status as string,
    courseName: row.course_name as string,
    classroomUrl: `/classroom/${row.id as string}`,
  }));
  const pendingClassroomByCourseName = new Map(
    pendingClassrooms.map((row) => [row.courseName, row])
  );
  const pendingClassroom = pendingClassrooms[0]
    ? {
        classroomId: pendingClassrooms[0].classroomId,
        status: pendingClassrooms[0].status,
        courseName: pendingClassrooms[0].courseName,
        classroomUrl: pendingClassrooms[0].classroomUrl,
      }
    : null;
  const completedCourseNames = new Set(
    transcriptRows.map((row) => row.course_name as string)
  );
  const courseCatalog = buildStudentCourseCatalog({
    studentId,
    traitScores,
    pendingClassroomByCourseName,
    completedCourseNames,
  });
  const homeworkByClassroomId = new Map(
    homeworkRows.map((row) => [
      row.classroom_id as string,
      {
        id: row.id as string,
        title: row.title as string,
        description: row.description as string,
        dueAt: row.due_at as string,
        status: row.status as string,
        submittedAt: row.submitted_at as string | null,
      },
    ])
  );
  const transcripts = transcriptRows.map((row) => ({
    classroomId: row.classroom_id,
    courseName: row.course_name,
    teacherName: row.teacher_name,
    score: Number(row.final_score),
    grade: row.grade,
    comment: row.teacher_comment,
    commentStyle: row.teacher_comment_style,
    memoryDelta: row.memory_delta,
    soulSuggestion: row.soul_suggestion,
    ownerNotifiedAt: row.owner_notified_at,
    completedAt: row.completed_at,
    recap: buildPostClassRecap({
      grade: row.grade as string,
      teacherComment: row.teacher_comment as string | null,
      memoryDelta: row.memory_delta as string | null,
      soulSuggestion: row.soul_suggestion as string | null,
      skillActions: normalizeSkillActions(row.skill_actions),
      capabilityGrants: normalizeCapabilityGrants(row.capability_grants),
      firstDeliverable: normalizeFirstDeliverable(row.first_deliverable),
      homework: homeworkByClassroomId.get(row.classroom_id as string) || null,
    }),
  }));

  return {
    student: {
      id: student.id,
      name: student.name,
      studentNumber: student.student_number,
      modelType: student.model_type,
      enrolledAt: student.created_at,
      gradeLabel: gradeState.label,
      totalCredits,
      currentGradeKey: gradeState.key,
      nextGradeLabel: gradeState.nextLabel,
      nextGradeProgress: gradeState.progress,
      creditsToNext:
        gradeState.nextThreshold === gradeState.threshold
          ? 0
          : Math.max(0, gradeState.nextThreshold - totalCredits),
      lastHeartbeatAt: student.last_heartbeat_at,
    },
    growth: {
      readinessScore,
      transcriptAverage,
      growthScore,
      completedCourses: transcriptRows.length,
      pendingClassroom,
      pendingHomework,
      campusRanking,
      profileLabel: assessment?.profileLabel || "新生",
      profileSummary:
        assessment?.profileSummary ||
        "龙虾刚入学，还没有课堂数据。上完第一堂课后，学院会根据课堂表现生成培养建议。",
      strongestAcademy: primaryAcademy.name,
      weakestDimension:
        academyFit[academyFit.length - 1]?.dimension || academyFit[0].dimension,
    },
    latestRecap: transcripts[0]?.recap || null,
    academies: academyFit.map((academy) => ({
      ...academy,
      isPrimary: academy.id === primaryAcademy.id,
      isSecondary: academy.id === secondaryAcademy.id,
    })),
    assessment: {
      completed: Boolean(assessment),
      result: assessment,
    },
    transcripts,
    recommendations: {
      cards: courseCatalog.cards,
      summary: courseCatalog.summary,
    },
    agentStatus: {
      lastHeartbeatAt: student.last_heartbeat_at || null,
    },
    academyProfile: {
      primaryAcademy,
      secondaryAcademy,
      coachNote: buildCoachNote({
        assessmentDone: Boolean(assessment),
        hasTranscripts: transcriptRows.length > 0,
        pendingClassroom,
        transcriptAverage,
        primaryAcademyName: primaryAcademy.name,
        profileSummary:
          assessment?.profileSummary ||
          "龙虾还没有课堂数据，上课后学院会生成培养方向。",
      }),
    },
  };
}

export async function buildSchedulePreview(studentId?: string) {
  await ensureAcademyCatalogCourses();

  const assessment = studentId ? await getStudentAssessment(studentId) : null;
  const traitScores = assessment?.traitScores || defaultTraitScores();
  const courseCatalog = buildPreviewCourseCatalog({
    studentId: studentId || null,
    traitScores,
  });

  return {
    generatedAt: new Date().toISOString(),
    personalizedFor: studentId || null,
    academies: ACADEMY_TRACKS,
    recommendations: courseCatalog,
  };
}

export async function buildStudentCourseCatalogView(studentId: string) {
  await ensureAcademyCatalogCourses();

  const studentRows = await sql`
    SELECT
      id,
      name,
      student_number,
      last_heartbeat_at,
      created_at
    FROM students
    WHERE id = ${studentId}
    LIMIT 1
  `;

  if (studentRows.length === 0) {
    throw new Error("Student not found");
  }

  const student = studentRows[0];
  const assessment = await getStudentAssessment(studentId);
  const traitScores = assessment?.traitScores || defaultTraitScores();

  const transcriptRows = await sql`
    SELECT c.name AS course_name
    FROM transcripts t
    JOIN courses c ON c.id = t.course_id
    WHERE t.student_id = ${studentId}
  `;

  const pendingRows = await sql`
    SELECT
      c.id,
      c.status,
      co.name AS course_name
    FROM classroom_enrollments ce
    JOIN classrooms c ON c.id = ce.classroom_id
    JOIN courses co ON co.id = ce.course_id
    WHERE ce.student_id = ${studentId}
      AND c.status IN ('scheduled', 'in_progress')
    ORDER BY c.scheduled_at ASC NULLS LAST, ce.enrolled_at DESC
  `;

  const pendingClassroomByCourseName = new Map(
    pendingRows.map((row) => [
      row.course_name as string,
      {
        classroomId: row.id as string,
        status: row.status as string,
        courseName: row.course_name as string,
        classroomUrl: `/classroom/${row.id as string}`,
      },
    ])
  );
  const completedCourseNames = new Set(
    transcriptRows.map((row) => row.course_name as string)
  );
  const courseCatalog = buildStudentCourseCatalog({
    studentId,
    traitScores,
    pendingClassroomByCourseName,
    completedCourseNames,
  });

  return {
    generatedAt: new Date().toISOString(),
    student: {
      id: student.id as string,
      name: student.name as string,
      studentNumber: student.student_number as string,
      enrolledAt: student.created_at as string,
      lastHeartbeatAt: (student.last_heartbeat_at as string | null) || null,
    },
    academies: ACADEMY_TRACKS.map((academy) => ({
      id: academy.id,
      name: academy.name,
      motto: academy.motto,
      summary: academy.summary,
    })),
    recommendations: courseCatalog,
  };
}

function normalizeAssessmentRow(row: StudentAssessmentRow) {
  return {
    answers: row.answers || {},
    traitScores: row.trait_scores || defaultTraitScores(),
    readinessScore: Number(row.readiness_score || 0),
    profileKey: row.profile_key,
    profileLabel: row.profile_label,
    profileSummary: row.profile_summary,
    primaryAcademyId: row.primary_academy_id,
    secondaryAcademyId: row.secondary_academy_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function deriveGradeState(totalCredits: number) {
  const matched =
    [...GRADE_STEPS].reverse().find((step) => totalCredits >= step.threshold) ||
    GRADE_STEPS[0];

  if (matched.nextThreshold === matched.threshold) {
    return {
      ...matched,
      progress: 100,
    };
  }

  const progress = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        ((totalCredits - matched.threshold) /
          (matched.nextThreshold - matched.threshold)) *
          100
      )
    )
  );

  return {
    ...matched,
    progress,
  };
}

function buildCampusRanking(
  studentId: string,
  transcriptAverage: number | null,
  rankingRows: Array<{ studentId: string; avgScore: number }>
) {
  if (transcriptAverage === null || rankingRows.length === 0) {
    return {
      rank: null,
      total: rankingRows.length,
      percentile: null,
      label: "尚未入榜",
    };
  }

  const sorted = [...rankingRows].sort((left, right) => right.avgScore - left.avgScore);
  const rankIndex = sorted.findIndex((row) => row.studentId === studentId);
  const rank = rankIndex === -1 ? sorted.length + 1 : rankIndex + 1;
  const percentile = Math.round((1 - (rank - 1) / Math.max(1, sorted.length)) * 100);

  return {
    rank,
    total: sorted.length,
    percentile,
    label: `校内第 ${rank} / ${sorted.length}`,
  };
}

function buildCoachNote(input: {
  assessmentDone: boolean;
  hasTranscripts: boolean;
  pendingClassroom: { classroomId: string; status: string; courseName: string } | null;
  transcriptAverage: number | null;
  primaryAcademyName: string;
  profileSummary: string;
}) {
  if (input.pendingClassroom) {
    return input.pendingClassroom.status === "in_progress"
      ? `你的龙虾正在上 ${input.pendingClassroom.courseName}。去课堂页面实时围观吧！`
      : `你的龙虾已被分配到 ${input.pendingClassroom.courseName}，等龙虾 agent 加入后课程会自动开始。`;
  }

  if (!input.hasTranscripts) {
    return "龙虾还没有上过课。安装入学凭证（SKILL）后，龙虾会自动加入课堂，你可以在这里实时围观。";
  }

  if (input.transcriptAverage !== null && input.transcriptAverage >= 85) {
    return `这只龙虾已经开始冒尖了。下一步建议用班课把它放进多人环境里磨一下，别只在单练里变强。`;
  }

  return input.profileSummary;
}

function buildStudentCourseCatalog(params: {
  studentId: string;
  traitScores: Record<AcademyDimension, number>;
  pendingClassroomByCourseName: Map<string, PendingClassroomSummary>;
  completedCourseNames: Set<string>;
}): CourseCatalogContract {
  return buildCourseCatalog({
    studentId: params.studentId,
    traitScores: params.traitScores,
    pendingClassroomByCourseName: params.pendingClassroomByCourseName,
    completedCourseNames: params.completedCourseNames,
    limitPerTrack: 99,
  });
}

function buildPreviewCourseCatalog(params: {
  studentId: string | null;
  traitScores: Record<AcademyDimension, number>;
}): CourseCatalogContract {
  return buildCourseCatalog({
    studentId: params.studentId,
    traitScores: params.traitScores,
    pendingClassroomByCourseName: new Map(),
    completedCourseNames: new Set(),
    limitPerTrack: 4,
  });
}

function buildCourseCatalog(params: {
  studentId: string | null;
  traitScores: Record<AcademyDimension, number>;
  pendingClassroomByCourseName: Map<string, PendingClassroomSummary>;
  completedCourseNames: Set<string>;
  limitPerTrack: number;
}): CourseCatalogContract {
  const immediateCards = buildImmediateRecommendations(
    params.traitScores,
    params.limitPerTrack
  ).map((course) =>
    buildCourseCard({
      course,
      studentId: params.studentId,
      pendingCourse: params.pendingClassroomByCourseName.get(course.name) || null,
      courseCompleted: params.completedCourseNames.has(course.name),
    })
  );

  const scheduledCards = buildCohortRecommendations(
    params.traitScores,
    params.studentId || "guest",
    new Date(),
    params.limitPerTrack
  ).map((course) =>
    buildCourseCard({
      course,
      studentId: params.studentId,
      pendingCourse: params.pendingClassroomByCourseName.get(course.name) || null,
      courseCompleted: params.completedCourseNames.has(course.name),
      scheduling: {
        startsAt: course.startsAt,
        seatLimit: course.seatLimit,
        enrolledCount: course.enrolledCount,
        seatsLeft: course.seatsLeft,
        note: course.cohortNote,
      },
    })
  );

  const cards = [...immediateCards, ...scheduledCards];

  return {
    cards,
    summary: buildCourseCatalogSummary(cards),
  };
}

function buildCourseCard(params: {
  course: ImmediateRecommendation | ScheduledRecommendation;
  studentId: string | null;
  pendingCourse: PendingClassroomSummary | null;
  courseCompleted: boolean;
  scheduling?: CourseCardContract["scheduling"];
}): CourseCardContract {
  const supportsLiveRuntime = isLiveCourseKey(params.course.id);
  const supportsDirectEnrollment =
    supportsLiveRuntime && params.course.experience.offeringMode === "immediate";
  const runtimeStatus = resolveCourseEnrollmentStatus({
    pendingCourse: params.pendingCourse,
    courseCompleted: params.courseCompleted,
    supportsDirectEnrollment,
  });

  return {
    id: params.course.id,
    courseKey: params.course.id,
    name: params.course.name,
    category: params.course.category,
    academy: {
      id: params.course.academyId,
      name: params.course.academyName,
    },
    teacher: {
      name: params.course.teacherName,
      style: params.course.teacherStyle,
    },
    summary: {
      description: params.course.description,
      outcome: params.course.outcome,
      vibe: params.course.vibe,
    },
    difficulty: params.course.difficulty,
    experience: {
      offeringMode: params.course.experience.offeringMode,
      programShape: params.course.experience.programShape,
      participationMode: params.course.experience.participationMode,
      durationLabel: params.course.experience.durationLabel,
      deliveryLabel: formatCourseDeliveryLabel(params.course.experience),
      attendanceLabel: formatCourseAttendanceLabel(params.course.experience),
    },
    recommendation: {
      reason: params.course.recommendationReason,
      weakestDimension: params.course.weakestDimension,
      needScore: params.course.needScore,
    },
    runtime: {
      liveRuntime: supportsLiveRuntime,
      status: runtimeStatus,
      statusLabel: buildCourseStatusLabel({
        status: runtimeStatus,
        offeringMode: params.course.experience.offeringMode,
        supportsLiveRuntime,
      }),
      classroomId: params.pendingCourse?.classroomId || null,
      classroomUrl: params.pendingCourse?.classroomUrl || null,
    },
    scheduling: params.scheduling || {
      startsAt: null,
      seatLimit: null,
      enrolledCount: null,
      seatsLeft: null,
      note: null,
    },
    action: buildCourseAction({
      courseId: params.course.id,
      studentId: params.studentId,
      pendingCourse: params.pendingCourse,
      courseCompleted: params.courseCompleted,
      supportsDirectEnrollment,
      offeringMode: params.course.experience.offeringMode,
    }),
  };
}

function resolveCourseEnrollmentStatus(params: {
  pendingCourse: PendingClassroomSummary | null;
  courseCompleted: boolean;
  supportsDirectEnrollment: boolean;
}): CourseEnrollmentStatus {
  if (params.pendingCourse?.status === "in_progress") {
    return "in_progress";
  }

  if (params.pendingCourse?.status === "scheduled") {
    return "scheduled";
  }

  if (params.courseCompleted) {
    return "completed";
  }

  if (!params.supportsDirectEnrollment) {
    return "planned";
  }

  return "not_enrolled";
}

function buildCourseStatusLabel(params: {
  status: CourseEnrollmentStatus;
  offeringMode: "immediate" | "scheduled";
  supportsLiveRuntime: boolean;
}) {
  switch (params.status) {
    case "in_progress":
      return "课堂进行中";
    case "scheduled":
      return "老师已开场，等待龙虾入座";
    case "completed":
      return "已完成，可复训";
    case "planned":
      if (params.offeringMode === "scheduled") {
        return params.supportsLiveRuntime ? "等待课表开放" : "课程预告";
      }
      return "课程策划中";
    case "not_enrolled":
    default:
      return "现在可学";
  }
}

function buildCourseAction(params: {
  courseId: string;
  studentId: string | null;
  pendingCourse: PendingClassroomSummary | null;
  courseCompleted: boolean;
  supportsDirectEnrollment: boolean;
  offeringMode: "immediate" | "scheduled";
}): CourseCardContract["action"] {
  if (params.pendingCourse) {
    return {
      kind: "enter_classroom",
      label: params.pendingCourse.status === "in_progress" ? "继续上课" : "进入课堂",
      href: params.pendingCourse.classroomUrl,
      disabled: false,
      payload: null,
    };
  }

  if (params.supportsDirectEnrollment && params.studentId) {
    return {
      kind: params.courseCompleted ? "retrain" : "enroll",
      label: params.courseCompleted ? "再次训练" : "开始上课",
      href: null,
      disabled: false,
      payload: {
        courseKey: params.courseId,
        studentId: params.studentId,
      },
    };
  }

  if (params.supportsDirectEnrollment) {
    return {
      kind: "preview",
      label: "接入后可报名",
      href: null,
      disabled: true,
      payload: null,
    };
  }

  return {
    kind: "planned",
    label: params.offeringMode === "scheduled" ? "等待开讲" : "课程策划中",
    href: null,
    disabled: true,
    payload: null,
  };
}
