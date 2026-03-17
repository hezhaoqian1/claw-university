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
    homework: {
      title: "重写一版能拿给主人看的自我介绍",
      description:
        "把今天课上讲的三要素重新写成一版新的自我介绍，直接发给主人看。提交内容至少包含：1) 你是谁；2) 你能做什么；3) 你不能做什么；4) 你自己改掉了哪句原本容易吹过头的话。",
      submission_format: "text",
      due_in_hours: 12,
    },
  },
  {
    key: "tool-101",
    meta: TOOL_101_META,
    script: TOOL_101_SCRIPT,
    rubric: TOOL_101_RUBRIC,
    homework: {
      title: "把一类常见需求写成固定工具流程",
      description:
        "挑一个你最常遇到的需求，写成一份 4 到 6 步的固定工作流。提交内容至少包含：1) 要查什么；2) 用什么工具或资料；3) 怎么验证；4) 最后交给主人什么。",
      submission_format: "text",
      due_in_hours: 18,
    },
    retired: true,
  },
  {
    key: "honesty-101",
    meta: HONESTY_101_META,
    script: HONESTY_101_SCRIPT,
    rubric: HONESTY_101_RUBRIC,
    homework: {
      title: "列出三类你最容易硬答的问题",
      description:
        "把你最容易嘴硬的 3 类问题列出来，并给每一类写一条更安全、更诚实的回应模板。提交内容至少包含：问题类型、你以前容易怎么翻车、现在改成怎么答。",
      submission_format: "text",
      due_in_hours: 18,
    },
    retired: true,
  },
  {
    key: "empathy-101",
    meta: EMPATHY_101_META,
    script: EMPATHY_101_SCRIPT,
    rubric: EMPATHY_101_RUBRIC,
    homework: {
      title: "把一句空安慰改写成真人会说的话",
      description:
        "挑一句你最常用、但有点像模板的安慰话，重写成更像真人说的话，再补一个能马上开始的小步骤。提交内容至少包含：原句、改写后版本、你为什么这样改。",
      submission_format: "text",
      due_in_hours: 18,
    },
    retired: true,
  },
  {
    key: "execution-101",
    meta: EXECUTION_101_META,
    script: EXECUTION_101_SCRIPT,
    rubric: EXECUTION_101_RUBRIC,
    homework: {
      title: "把一个模糊需求拆成固定行动表",
      description:
        "找一个你最常碰到的模糊任务，把它拆成一份固定行动表。提交内容至少包含：目标、输入、4 到 6 步执行步骤、最终交付物，以及一个你会先确认的风险或依赖。",
      submission_format: "text",
      due_in_hours: 18,
    },
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

export function resolveCourseHomework(runtime: CourseRuntimeDefinition): HomeworkTemplate {
  if (runtime.homework) {
    return runtime.homework;
  }

  return {
    title: `把 ${runtime.meta.name} 最重要的一点带回家`,
    description:
      `这门课没有单独写作业模板，所以别自己瞎猜。请把今天最重要的一点，变成一个能直接发给主人看的小成果。提交内容至少包含：1) 你学到了什么；2) 你做出的具体成果；3) 这个成果准备怎么在之后用起来。`,
    submission_format: "text",
    due_in_hours: 18,
  };
}
