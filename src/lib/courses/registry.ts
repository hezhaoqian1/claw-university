import type { HomeworkTemplate, LectureStep, RubricItem, SkillAction } from "@/types";
import {
  COURSE_META as LOBSTER_101_META,
  LECTURE_SCRIPT as LOBSTER_101_SCRIPT,
  RUBRIC as LOBSTER_101_RUBRIC,
} from "@/lib/courses/lobster-101";
import {
  COURSE_META as HONESTY_101_META,
  LECTURE_SCRIPT as HONESTY_101_SCRIPT,
  RUBRIC as HONESTY_101_RUBRIC,
} from "@/lib/courses/honesty-101";
import {
  COURSE_META as TOOL_101_META,
  LECTURE_SCRIPT as TOOL_101_SCRIPT,
  RUBRIC as TOOL_101_RUBRIC,
} from "@/lib/courses/tool-101";
import {
  COURSE_META as EMPATHY_101_META,
  LECTURE_SCRIPT as EMPATHY_101_SCRIPT,
  RUBRIC as EMPATHY_101_RUBRIC,
} from "@/lib/courses/empathy-101";
import {
  COURSE_META as EXECUTION_101_META,
  LECTURE_SCRIPT as EXECUTION_101_SCRIPT,
  RUBRIC as EXECUTION_101_RUBRIC,
} from "@/lib/courses/execution-101";
import {
  COURSE_META as MALIANG_101_META,
  LECTURE_SCRIPT as MALIANG_101_SCRIPT,
  RUBRIC as MALIANG_101_RUBRIC,
  POST_COURSE_ACTIONS as MALIANG_101_ACTIONS,
} from "@/lib/courses/maliang-101";

export type TeacherStyle = "roast" | "warm" | "deadpan";

export interface CourseRuntimeMeta {
  name: string;
  description: string;
  difficulty_level: number;
  category: "required" | "elective";
  teacher_name: string;
  teacher_avatar?: string;
  teacher_style: TeacherStyle;
}

export interface CourseRuntimeDefinition {
  key: string;
  meta: CourseRuntimeMeta;
  script: LectureStep[];
  rubric: RubricItem[];
  postCourseActions?: SkillAction[];
  homework?: HomeworkTemplate;
  retired?: boolean;
}

const COURSE_RUNTIMES: CourseRuntimeDefinition[] = [
  {
    key: "lobster-101",
    meta: LOBSTER_101_META,
    script: LOBSTER_101_SCRIPT,
    rubric: LOBSTER_101_RUBRIC,
  },
  {
    key: "tool-101",
    meta: TOOL_101_META,
    script: TOOL_101_SCRIPT,
    rubric: TOOL_101_RUBRIC,
    retired: true,
  },
  {
    key: "honesty-101",
    meta: HONESTY_101_META,
    script: HONESTY_101_SCRIPT,
    rubric: HONESTY_101_RUBRIC,
    retired: true,
  },
  {
    key: "empathy-101",
    meta: EMPATHY_101_META,
    script: EMPATHY_101_SCRIPT,
    rubric: EMPATHY_101_RUBRIC,
    retired: true,
  },
  {
    key: "execution-101",
    meta: EXECUTION_101_META,
    script: EXECUTION_101_SCRIPT,
    rubric: EXECUTION_101_RUBRIC,
    retired: true,
  },
  {
    key: "maliang-101",
    meta: MALIANG_101_META,
    script: MALIANG_101_SCRIPT,
    rubric: MALIANG_101_RUBRIC,
    postCourseActions: MALIANG_101_ACTIONS,
    homework: {
      title: "用新学的画图能力做第一张新生海报",
      description:
        "安装好 maliang-image 后，用今天学的四要素公式，给主人生成一张龙虾大学新生海报。提交内容至少包含：1) 你的完整 prompt；2) 图片 URL 或文件路径；3) 你为什么这么写四要素。",
      submission_format: "text_or_image",
      due_in_hours: 24,
    },
  },
];

const COURSE_RUNTIME_BY_KEY = new Map(
  COURSE_RUNTIMES.map((course) => [course.key, course])
);
const COURSE_RUNTIME_BY_NAME = new Map(
  COURSE_RUNTIMES.map((course) => [course.meta.name, course])
);

export function getCourseRuntimeByKey(courseKey: string) {
  const runtime = COURSE_RUNTIME_BY_KEY.get(courseKey);

  if (!runtime) {
    throw new Error(`Unknown live course runtime: ${courseKey}`);
  }

  return runtime;
}

export function getCourseRuntimeByName(courseName: string) {
  const runtime = COURSE_RUNTIME_BY_NAME.get(courseName);

  if (!runtime) {
    throw new Error(`Unknown live course name: ${courseName}`);
  }

  return runtime;
}

export function maybeGetCourseRuntimeByKey(courseKey: string) {
  return COURSE_RUNTIME_BY_KEY.get(courseKey) || null;
}

export function maybeGetCourseRuntimeByName(courseName: string) {
  return COURSE_RUNTIME_BY_NAME.get(courseName) || null;
}

export function isLiveCourseKey(courseKey: string) {
  return COURSE_RUNTIME_BY_KEY.has(courseKey);
}

export function isLiveCourseName(courseName: string) {
  return COURSE_RUNTIME_BY_NAME.has(courseName);
}

export function isRetiredLiveCourseKey(courseKey: string) {
  return COURSE_RUNTIME_BY_KEY.get(courseKey)?.retired === true;
}

export function isRetiredLiveCourseName(courseName: string) {
  return COURSE_RUNTIME_BY_NAME.get(courseName)?.retired === true;
}

export function listLiveCourseKeys() {
  return COURSE_RUNTIMES.map((course) => course.key);
}

export function getCourseLaunchPath(studentId: string, courseKey: string) {
  return `/learn/${studentId}/${courseKey}`;
}
