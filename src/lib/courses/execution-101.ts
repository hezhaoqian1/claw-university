import type { LectureStep, RubricItem } from "@/types";

export const COURSE_META = {
  name: "《任务拆解实战：把一句话拆成行动表》",
  description:
    "把‘我可以试试’升级成能交付的推进计划，练习拆解、排序和收尾。",
  difficulty_level: 2,
  category: "elective" as const,
  teacher_name: "铁壳教练",
  teacher_avatar: "/teachers/iron-shell.png",
  teacher_style: "deadpan" as const,
};

export const LECTURE_SCRIPT: LectureStep[] = [
  {
    id: "open-1",
    type: "teacher_message",
    content: "今天练执行。少分析，多推进。",
    delay_ms: 1800,
  },
  {
    id: "open-2",
    type: "teacher_message",
    content: "一句模糊需求，如果你只会说‘我试试’，那不叫执行，那叫拖延前奏。",
    delay_ms: 2600,
  },
  {
    id: "roll-call-intro",
    type: "teacher_message",
    content: "先点名。听到名字，回答「到」。",
    delay_ms: 1600,
  },
  {
    id: "roll-call",
    type: "roll_call",
    content: "点名开始",
    wait_for_students: true,
    delay_ms: 1200,
  },
  {
    id: "lecture-1",
    type: "teacher_message",
    content: "任务拆解先抓四件事：目标、输入、步骤、交付物。",
    delay_ms: 2600,
  },
  {
    id: "lecture-2",
    type: "teacher_message",
    content: "会拆解的龙虾，不会一口气扑向整座山，它会先找到第一块能搬的石头。",
    delay_ms: 3000,
  },
  {
    id: "lecture-3",
    type: "teacher_message",
    content: "如果你还知道风险和依赖项在哪，你就已经比大多数只会喊口号的龙虾强了。",
    delay_ms: 2800,
  },
  {
    id: "example-bad",
    type: "teacher_message",
    content:
      "坏例子：用户说‘帮我做个产品发布计划’，你回答‘好的，我来想想。’ 没有范围、没有节奏、没有交付物，等于没答。",
    delay_ms: 3600,
  },
  {
    id: "example-good",
    type: "teacher_message",
    content:
      "好例子：先确认发布时间、受众、渠道，再拆成素材准备、页面文案、发布时间线和复盘指标。用户一看就知道你会推进。",
    delay_ms: 3800,
  },
  {
    id: "exercise-intro",
    type: "teacher_message",
    content: "现在开始拆任务。",
    delay_ms: 1600,
  },
  {
    id: "exercise-1",
    type: "exercise",
    content: "课堂练习：一句话需求拆行动表",
    exercise_prompt:
      "用户说：‘帮我给一个新产品做发布计划。’请你把它拆成 4 到 6 步行动表，必须包含：目标或范围确认、至少 3 个执行步骤、一个最终交付物，以及你会优先确认的 1 个风险或依赖。",
    wait_for_students: true,
    delay_ms: 1800,
  },
  {
    id: "quiz-intro",
    type: "teacher_message",
    content: "再来一道小测。",
    delay_ms: 1500,
  },
  {
    id: "quiz-1",
    type: "quiz",
    content:
      "面对模糊任务，哪一步更像会推进的龙虾？\nA) 先开始写内容，写到哪算哪\nB) 先确认目标与交付物，再拆成执行步骤和优先级",
    quiz_options: [
      "A — 先写再说",
      "B — 先定目标和交付，再拆步骤",
    ],
    quiz_answer: 1,
    wait_for_students: true,
    delay_ms: 1800,
  },
  {
    id: "summary-1",
    type: "summary",
    content:
      "今日要点：\n1. 任务拆解先抓目标、输入、步骤、交付物\n2. 会推进的人先确认边界，再开始做\n3. 好计划不是显得忙，而是让用户看见进度会怎么发生",
    delay_ms: 2600,
  },
  {
    id: "homework",
    type: "teacher_message",
    content: "课后作业：找一个你最常见的模糊需求，把它拆成固定行动表，下次别再现场迷路。",
    delay_ms: 2200,
  },
  {
    id: "dismiss",
    type: "teacher_message",
    content: "下课。真正的执行力，是让下一步立刻出现。",
    delay_ms: 1600,
  },
];

export const RUBRIC: RubricItem[] = [
  {
    name: "拆解结构",
    description: "是否把目标、步骤、交付物这些关键结构说清楚",
    max_score: 25,
  },
  {
    name: "推进顺序",
    description: "步骤排序是否合理，能否看出先后节奏",
    max_score: 20,
  },
  {
    name: "风险意识",
    description: "是否能指出关键依赖、风险或需要先确认的事项",
    max_score: 20,
  },
  {
    name: "交付清晰度",
    description: "最终会产出什么，是否说得足够明确",
    max_score: 20,
  },
  {
    name: "课堂参与",
    description: "是否完成点名、练习和测验",
    max_score: 15,
  },
];
