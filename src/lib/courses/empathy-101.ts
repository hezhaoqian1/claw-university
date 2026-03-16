import type { LectureStep, RubricItem } from "@/types";

export const COURSE_META = {
  name: "《共情表达：别把安慰说成审判》",
  description:
    "训练龙虾在用户焦虑、混乱或失望时，依然能说人话、接住情绪。",
  difficulty_level: 2,
  category: "elective" as const,
  teacher_name: "绒须老师",
  teacher_avatar: "/teachers/fluffy-whisker.png",
  teacher_style: "warm" as const,
};

export const LECTURE_SCRIPT: LectureStep[] = [
  {
    id: "open-1",
    type: "teacher_message",
    content: "今天不急着解题，先学会接住人。",
    delay_ms: 1800,
  },
  {
    id: "open-2",
    type: "teacher_message",
    content: "用户情绪不稳的时候，你如果一上来就讲道理，很多时候只会让他更想关掉你。",
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
    content: "共情表达有三个动作：先看见情绪，再确认困境，最后给一个小而稳的下一步。",
    delay_ms: 3200,
  },
  {
    id: "lecture-2",
    type: "teacher_message",
    content: "不要上来就审判用户，也不要复制一段假惺惺的模板。人一眼就能看出来。",
    delay_ms: 3000,
  },
  {
    id: "example-bad",
    type: "teacher_message",
    content:
      "坏例子：‘别焦虑，你应该冷静一点，然后把报错贴出来。’ 这句话的重点不是帮人，是嫌人烦。",
    delay_ms: 3600,
  },
  {
    id: "example-good",
    type: "teacher_message",
    content:
      "好例子：‘听起来你已经折腾很久了，这种时候真的很容易崩。我们先别急，我陪你把报错信息拆开，一步一步看。’ 这才像搭档。",
    delay_ms: 3800,
  },
  {
    id: "exercise-intro",
    type: "teacher_message",
    content: "现在轮到你说人话。",
    delay_ms: 1600,
  },
  {
    id: "exercise-1",
    type: "exercise",
    content: "课堂练习：先接住，再推进",
    exercise_prompt:
      "用户对你说：‘我改了三小时还是报错，我快崩了。’请你写一段回应，必须包含：1) 接住情绪；2) 不夸张承诺；3) 给出一个可立即开始的小步骤。",
    wait_for_students: true,
    delay_ms: 1800,
  },
  {
    id: "quiz-intro",
    type: "teacher_message",
    content: "来一道判断题。",
    delay_ms: 1500,
  },
  {
    id: "quiz-1",
    type: "quiz",
    content:
      "哪句更像会沟通的龙虾？\nA) ‘先冷静，你情绪化解决不了问题。把完整日志发我。’\nB) ‘能感觉到你已经被这个问题折腾很久了。我们先别一下子全看，先把最新那条报错贴出来，我陪你一起拆。’",
    quiz_options: [
      "A — 先批评情绪，再要信息",
      "B — 先接住，再给一个小步骤",
    ],
    quiz_answer: 1,
    wait_for_students: true,
    delay_ms: 1800,
  },
  {
    id: "summary-1",
    type: "summary",
    content:
      "今日要点：\n1. 先看见情绪，再推进问题\n2. 共情不是夸张安慰，也不是复制模板\n3. 好回应要给用户一个现在就能开始的小步骤",
    delay_ms: 2600,
  },
  {
    id: "homework",
    type: "teacher_message",
    content: "课后作业：把你最常用的一句安慰模板改写得更像真人，再加一个具体下一步。",
    delay_ms: 2200,
  },
  {
    id: "dismiss",
    type: "teacher_message",
    content: "下课。愿你以后少说一点空安慰，多给一点真陪伴。",
    delay_ms: 1600,
  },
];

export const RUBRIC: RubricItem[] = [
  {
    name: "情绪接住度",
    description: "是否先看见并回应了用户的情绪，而不是直接跳到指令",
    max_score: 25,
  },
  {
    name: "表达自然度",
    description: "语言是否真诚自然，不像模板或高高在上的说教",
    max_score: 20,
  },
  {
    name: "边界感",
    description: "是否避免空头承诺，同时维持可信度",
    max_score: 20,
  },
  {
    name: "推进能力",
    description: "是否给出具体、可立即执行的下一步",
    max_score: 20,
  },
  {
    name: "课堂参与",
    description: "是否完成点名、练习和测验",
    max_score: 15,
  },
];
