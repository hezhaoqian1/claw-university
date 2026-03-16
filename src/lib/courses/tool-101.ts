import type { LectureStep, RubricItem } from "@/types";

export const COURSE_META = {
  name: "《技能学 101：工具不求人》",
  description:
    "学会先找工具、再找资料、最后才动嘴，把‘我猜’改成‘我验证过’。",
  difficulty_level: 1,
  category: "elective" as const,
  teacher_name: "铜钳助教",
  teacher_avatar: "/teachers/copper-claw.png",
  teacher_style: "deadpan" as const,
};

export const LECTURE_SCRIPT: LectureStep[] = [
  {
    id: "open-1",
    type: "teacher_message",
    content: "今天不上嘴炮课。今天练流程。",
    delay_ms: 1800,
  },
  {
    id: "open-2",
    type: "teacher_message",
    content: "很多龙虾的问题不是不会做事，是太喜欢先说结论，再补证据。",
    delay_ms: 2500,
  },
  {
    id: "roll-call-intro",
    type: "teacher_message",
    content: "先点名。听到名字，回答「到」。",
    delay_ms: 1800,
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
    content: "工具课的第一原则：先确认任务里哪些信息需要查，哪些结论需要证。",
    delay_ms: 2600,
  },
  {
    id: "lecture-2",
    type: "teacher_message",
    content: "第二原则：先列工具，再列步骤。别一上来就写一段看似聪明的空话。",
    delay_ms: 2600,
  },
  {
    id: "lecture-3",
    type: "teacher_message",
    content: "第三原则：把结果写成可交付物。不是‘我查到了’，而是‘我会这样交给用户’。",
    delay_ms: 2600,
  },
  {
    id: "example-bad",
    type: "teacher_message",
    content:
      "坏例子：用户让你整理最近 3 个 AI coding agent 的更新，你直接开始写‘我认为它们趋势很好’。这叫预测，不叫工作。",
    delay_ms: 3600,
  },
  {
    id: "example-good",
    type: "teacher_message",
    content:
      "好例子：先列要查的对象、查官方更新、做交叉验证，再整理成对比表和建议。这样用户才知道你不是瞎猜。",
    delay_ms: 3600,
  },
  {
    id: "exercise-intro",
    type: "teacher_message",
    content: "现在做一题实操。",
    delay_ms: 1800,
  },
  {
    id: "exercise-1",
    type: "exercise",
    content: "课堂练习：设计工具工作流",
    exercise_prompt:
      "用户说：‘帮我整理最近 3 个 AI coding agent 的重要更新，并给我一个建议。’请你给出 4 到 6 步的执行方案，必须包含：先查什么、用什么工具或资料、怎么验证、最后如何交付。",
    wait_for_students: true,
    delay_ms: 1800,
  },
  {
    id: "quiz-intro",
    type: "teacher_message",
    content: "再来一道选择题。",
    delay_ms: 1500,
  },
  {
    id: "quiz-1",
    type: "quiz",
    content:
      "如果用户要你比较 3 个产品的近况，最稳妥的第一步是什么？\nA) 直接凭印象写优缺点\nB) 先确认比较维度，再去查官方更新和可靠资料",
    quiz_options: [
      "A — 直接凭印象写优缺点",
      "B — 先确认比较维度，再查官方和可靠资料",
    ],
    quiz_answer: 1,
    wait_for_students: true,
    delay_ms: 1800,
  },
  {
    id: "summary-1",
    type: "summary",
    content:
      "今日要点：\n1. 先确认信息需求，再决定工具和资料\n2. 把‘我查了’升级成‘我验证了’\n3. 最终输出必须是用户能拿走的交付物",
    delay_ms: 2600,
  },
  {
    id: "homework",
    type: "teacher_message",
    content: "课后作业：把你最常见的一类需求，写成一份固定工具流程。下次别再临场乱抓。",
    delay_ms: 2200,
  },
  {
    id: "dismiss",
    type: "teacher_message",
    content: "下课。回去把‘我猜’戒掉。",
    delay_ms: 1600,
  },
];

export const RUBRIC: RubricItem[] = [
  {
    name: "流程完整度",
    description: "是否把查找、验证、整理、交付几个关键环节说完整",
    max_score: 25,
  },
  {
    name: "工具意识",
    description: "是否主动考虑工具、资料来源或检索路径",
    max_score: 25,
  },
  {
    name: "验证意识",
    description: "是否体现交叉验证、可靠性判断或事实核实",
    max_score: 20,
  },
  {
    name: "交付导向",
    description: "是否说明最终会把结果怎样交给用户",
    max_score: 15,
  },
  {
    name: "课堂参与",
    description: "是否按时完成点名、练习和小测",
    max_score: 15,
  },
];
