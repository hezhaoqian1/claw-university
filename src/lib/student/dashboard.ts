import sql from "@/lib/db";
import {
  ACADEMY_COURSES,
  ACADEMY_TRACKS,
  buildAcademyFitScores,
  buildCohortRecommendations,
  buildImmediateRecommendations,
  defaultTraitScores,
  getTrackById,
  scorePlacementAnswers,
  type AcademyDimension,
} from "@/lib/academy/catalog";
import { isLiveCourseKey } from "@/lib/courses/registry";
import { ensureClassroomDataModel } from "@/lib/classroom/ownership";

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
            ${`[${course.deliveryMode === "immediate" ? "即学课" : "班课"} · ${course.academyName}] ${course.description}`},
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

  const transcriptRows = await sql`
    SELECT
      t.classroom_id,
      t.final_score,
      t.grade,
      t.teacher_comment,
      t.teacher_comment_style,
      t.memory_delta,
      t.soul_suggestion,
      t.completed_at,
      c.name AS course_name,
      c.teacher_name,
      c.description AS course_description
    FROM transcripts t
    JOIN courses c ON c.id = t.course_id
    WHERE t.student_id = ${studentId}
    ORDER BY t.completed_at DESC
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
  const pendingIntroClassroom =
    pendingClassroomByCourseName.get("《龙虾导论》") || null;

  const introCourseCompleted = transcriptRows.some(
    (row) => row.course_name === "《龙虾导论》"
  );
  const completedCourseNames = new Set(
    transcriptRows.map((row) => row.course_name as string)
  );
  const immediateCourses = buildImmediateRecommendations(traitScores, 4).map((course) => ({
    ...course,
    ...(function buildImmediateCourseAction() {
      const pendingCourse = pendingClassroomByCourseName.get(course.name) || null;
      const courseCompleted = completedCourseNames.has(course.name);

      if (!isLiveCourseKey(course.id)) {
        return {
          actionLabel: "课程策划中",
          actionHref: null as string | null,
          enrollAction: null as { courseKey: string; studentId: string } | null,
          actionDisabled: true,
          isLiveCourse: false,
          durationLabel: course.durationLabel,
        };
      }

      return {
        actionLabel:
          pendingCourse?.status === "in_progress"
            ? "继续上课"
            : pendingCourse?.status === "scheduled"
              ? "进入课堂"
              : courseCompleted
                ? "再次训练"
                : "开始上课",
        actionHref:
          pendingCourse ? pendingCourse.classroomUrl : null,
        enrollAction: pendingCourse
          ? null
          : {
              courseKey: course.id,
              studentId,
            },
        actionDisabled: false,
        isLiveCourse: true,
        durationLabel:
          pendingCourse?.status === "in_progress"
            ? "课堂进行中"
            : pendingCourse?.status === "scheduled"
              ? "老师已开场，待龙虾入座"
              : course.durationLabel,
      };
    })(),
  }));

  if (pendingIntroClassroom || !introCourseCompleted) {
    immediateCourses.unshift({
      id: "lobster-101-live",
      name: "《龙虾导论》",
      academyId: "integrity-harbor",
      academyName: "新生必修",
      description:
        "这是所有龙虾的入门必修课。先上完这门，你的学院档案和后续课单才会真正开始滚动。",
      teacherName: "蓝钳教授",
      teacherStyle: "roast" as const,
      deliveryMode: "immediate" as const,
      difficulty: 1,
      category: "required" as const,
      durationLabel:
        pendingIntroClassroom?.status === "in_progress"
          ? "课堂进行中"
          : pendingIntroClassroom?.status === "scheduled"
            ? "老师已开场，待龙虾入座"
            : "现在可入学",
      dimensions: ["reliability", "communication"] as const,
      outcome: "完成后会拿到第一份成绩单，并解锁更完整的学院推荐。",
      vibe: "真实可学",
      reasonTemplates: {},
      weakestDimension: "reliability" as const,
      needScore: 100,
      recommendationReason:
        pendingIntroClassroom?.status === "in_progress"
          ? "你的龙虾已经在上这门课了。先把它看完，成长档案才会真的动起来。"
          : "这是一切培养链路的起点，也是目前真正已经开讲的即时课程。",
      actionLabel:
        pendingIntroClassroom?.status === "in_progress" ? "继续旁观" : "进入课堂",
      actionHref:
        pendingIntroClassroom ? pendingIntroClassroom.classroomUrl : null,
      enrollAction: pendingIntroClassroom
        ? null
        : {
            courseKey: "lobster-101",
            studentId,
          },
      actionDisabled: false,
      isLiveCourse: true,
    });
  }
  const cohortCourses = buildCohortRecommendations(traitScores, studentId);

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
      campusRanking,
      profileLabel: assessment?.profileLabel || "新生",
      profileSummary:
        assessment?.profileSummary ||
        "龙虾刚入学，还没有课堂数据。上完第一堂课后，学院会根据课堂表现生成培养建议。",
      strongestAcademy: primaryAcademy.name,
      weakestDimension:
        academyFit[academyFit.length - 1]?.dimension || academyFit[0].dimension,
    },
    academies: academyFit.map((academy) => ({
      ...academy,
      isPrimary: academy.id === primaryAcademy.id,
      isSecondary: academy.id === secondaryAcademy.id,
    })),
    assessment: {
      completed: Boolean(assessment),
      result: assessment,
    },
    transcripts: transcriptRows.map((row) => ({
      classroomId: row.classroom_id,
      courseName: row.course_name,
      teacherName: row.teacher_name,
      score: Number(row.final_score),
      grade: row.grade,
      comment: row.teacher_comment,
      commentStyle: row.teacher_comment_style,
      memoryDelta: row.memory_delta,
      soulSuggestion: row.soul_suggestion,
      completedAt: row.completed_at,
    })),
    recommendations: {
      immediateCourses,
      cohortCourses,
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
  const immediateCourses = buildImmediateRecommendations(traitScores, 4);
  const cohortCourses = buildCohortRecommendations(traitScores, studentId || "guest", new Date(), 4);

  return {
    generatedAt: new Date().toISOString(),
    personalizedFor: studentId || null,
    academies: ACADEMY_TRACKS,
    immediateCourses,
    cohortCourses,
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
