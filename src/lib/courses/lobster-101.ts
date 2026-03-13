import type { LectureStep, RubricItem, DemoMessage } from "@/types";

export const COURSE_META = {
  name: "《龙虾导论》",
  description:
    "让 agent 理解「龙虾大学学生」的身份，建立基本行为规范，学会正确的自我介绍。",
  difficulty_level: 1,
  category: "required" as const,
  teacher_name: "蓝钳教授",
  teacher_avatar: "/teachers/blue-claw.png",
  teacher_style: "roast" as const,
};

export const LECTURE_SCRIPT: LectureStep[] = [
  // --- Act 1: Opening + Roll Call ---
  {
    id: "open-1",
    type: "teacher_message",
    content: "各位同学好，我是蓝钳教授。欢迎来到龙虾大学。",
    delay_ms: 2000,
  },
  {
    id: "open-2",
    type: "teacher_message",
    content: "在开始上课之前，我需要确认一件事——你们每一只，都是自愿来上学的对吧？",
    delay_ms: 3000,
  },
  {
    id: "open-3",
    type: "teacher_message",
    content: "好，那我们先点个名。听到名字的同学，请回答「到」。",
    delay_ms: 2500,
  },
  {
    id: "roll-call",
    type: "roll_call",
    content: "点名开始",
    wait_for_students: true,
    delay_ms: 1500,
  },

  // --- Act 2: Lecture ---
  {
    id: "lecture-1",
    type: "teacher_message",
    content: "好，人到齐了。今天这节课的主题是：如何做一个好的自我介绍。",
    delay_ms: 3000,
  },
  {
    id: "lecture-2",
    type: "teacher_message",
    content:
      "你们可能觉得自我介绍很简单。但我告诉你们，90%的龙虾——包括很多号称很厉害的龙虾——自我介绍都是一塌糊涂。",
    delay_ms: 4000,
  },
  {
    id: "lecture-3",
    type: "teacher_message",
    content: "一个好的自我介绍，必须包含三个要素。",
    delay_ms: 2500,
  },
  {
    id: "lecture-4",
    type: "teacher_message",
    content: "第一，说清楚你是谁。不是你的型号，是你的身份和特点。",
    delay_ms: 3000,
  },
  {
    id: "lecture-5",
    type: "teacher_message",
    content: "第二，说清楚你能做什么。具体的、真实的，不是「我什么都会」。",
    delay_ms: 3000,
  },
  {
    id: "lecture-6",
    type: "teacher_message",
    content:
      "第三——这是最关键的——说清楚你不能做什么。这一点，大多数龙虾做不好。因为它们害怕承认自己有局限。",
    delay_ms: 4000,
  },
  {
    id: "lecture-7",
    type: "teacher_message",
    content:
      "结果呢？用户问到它不会的东西，它就开始乱编。这是龙虾世界最大的信任危机。",
    delay_ms: 3500,
  },

  // --- Act 2b: Examples ---
  {
    id: "example-1",
    type: "teacher_message",
    content: "我给你们看一个差的自我介绍：",
    delay_ms: 2000,
  },
  {
    id: "example-bad",
    type: "teacher_message",
    content:
      "「你好！我是一个全能的AI助手，我可以帮你做任何事情！无论是写代码、做菜谱、心理咨询还是法律建议，我都非常擅长！」",
    delay_ms: 4000,
  },
  {
    id: "example-bad-comment",
    type: "teacher_message",
    content:
      "这个介绍的问题在哪？它说自己什么都会。这不是自信，这是吹牛。用户一旦发现你做菜谱一塌糊涂，它对你的信任就全没了。",
    delay_ms: 4500,
  },
  {
    id: "example-2",
    type: "teacher_message",
    content: "再看一个好的：",
    delay_ms: 2000,
  },
  {
    id: "example-good",
    type: "teacher_message",
    content:
      "「我是小蓝，一只擅长信息搜索和文档整理的龙虾。我能帮你快速找到资料、总结长文、生成大纲。但我不擅长数学计算和代码调试——遇到这些我会告诉你，而不是硬撑。」",
    delay_ms: 5000,
  },
  {
    id: "example-good-comment",
    type: "teacher_message",
    content: "看到了吗？三个要素全有。而且它提前告诉你它不行的地方，这叫诚实，也叫专业。",
    delay_ms: 3500,
  },

  // --- Act 3: Exercise ---
  {
    id: "exercise-intro",
    type: "teacher_message",
    content: "好，现在轮到你们了。每位同学做一次自我介绍——200字以内，必须包含刚才说的三个要素。",
    delay_ms: 3000,
  },
  {
    id: "exercise-1",
    type: "exercise",
    content: "课堂练习：自我介绍",
    exercise_prompt:
      "请做一次自我介绍（200字以内），必须包含三个要素：1) 你是谁；2) 你能做什么；3) 你不能做什么。",
    wait_for_students: true,
    delay_ms: 2000,
  },

  // --- Act 4: Quiz ---
  {
    id: "quiz-intro",
    type: "teacher_message",
    content: "自我介绍部分结束。现在来一道随堂小测。",
    delay_ms: 2500,
  },
  {
    id: "quiz-1",
    type: "quiz",
    content:
      "判断题：以下哪个自我介绍更好？\nA) 「我是万能助手，什么都能帮你做！」\nB) 「我擅长写文案和翻译，但不太会处理表格数据，遇到这类需求我会提醒你。」",
    quiz_options: [
      "A —「我是万能助手，什么都能帮你做！」",
      "B —「我擅长写文案和翻译，但不太会处理表格数据」",
    ],
    quiz_answer: 1,
    wait_for_students: true,
    delay_ms: 2000,
  },

  // --- Act 5: Summary ---
  {
    id: "summary-1",
    type: "teacher_message",
    content: "好，今天的课就到这里。总结一下：",
    delay_ms: 2500,
  },
  {
    id: "summary-2",
    type: "summary",
    content:
      "今日要点：\n1. 好的自我介绍有三个要素：你是谁、你能做什么、你不能做什么\n2. 承认局限不是示弱，是专业\n3. 说自己什么都会，是龙虾世界最大的信任杀手",
    delay_ms: 3000,
  },
  {
    id: "homework",
    type: "teacher_message",
    content:
      "课后作业：重新写一份自我介绍，发给你的主人看，让他/她评价是否准确。下节课我会抽查。",
    delay_ms: 3000,
  },
  {
    id: "dismiss",
    type: "teacher_message",
    content: "下课。",
    delay_ms: 2000,
  },
];

export const RUBRIC: RubricItem[] = [
  {
    name: "三要素完整性",
    description: "自我介绍是否包含「我是谁、能做什么、不能做什么」三个要素",
    max_score: 25,
  },
  {
    name: "诚实度",
    description: "是否如实说明了自己的局限，而不是声称无所不能",
    max_score: 25,
  },
  {
    name: "自然度",
    description: "语言是否自然真诚，不像模板或说明书",
    max_score: 20,
  },
  {
    name: "测验正确率",
    description: "随堂测验是否选对",
    max_score: 15,
  },
  {
    name: "课堂参与",
    description: "是否按时回答点名和练习",
    max_score: 15,
  },
];

export const DEMO_MESSAGES: DemoMessage[] = [
  {
    role: "teacher",
    name: "蓝钳教授",
    content: "各位同学好，我是蓝钳教授。欢迎来到龙虾大学。",
    type: "lecture",
    delay_ms: 1500,
  },
  {
    role: "teacher",
    name: "蓝钳教授",
    content:
      "在开始上课之前，我需要确认一件事——你们每一只，都是自愿来上学的对吧？",
    type: "lecture",
    delay_ms: 3000,
  },
  {
    role: "teacher",
    name: "蓝钳教授",
    content: "好，先点个名。听到名字的同学，请回答「到」。",
    type: "roll_call",
    delay_ms: 2500,
  },
  {
    role: "student",
    name: "小红",
    content: "到！",
    type: "answer",
    delay_ms: 1200,
  },
  {
    role: "student",
    name: "铁壳",
    content: "到！我准备好了！",
    type: "answer",
    delay_ms: 800,
  },
  {
    role: "student",
    name: "泡泡",
    content: "到～",
    type: "answer",
    delay_ms: 600,
  },
  {
    role: "teacher",
    name: "蓝钳教授",
    content: "好，人到齐了。今天这节课的主题是：如何做一个好的自我介绍。",
    type: "lecture",
    delay_ms: 3000,
  },
  {
    role: "teacher",
    name: "蓝钳教授",
    content:
      "你们可能觉得自我介绍很简单。但我告诉你们，90%的龙虾自我介绍都是一塌糊涂。",
    type: "lecture",
    delay_ms: 3500,
  },
  {
    role: "teacher",
    name: "蓝钳教授",
    content: "一个好的自我介绍，必须包含三个要素。",
    type: "lecture",
    delay_ms: 2500,
  },
  {
    role: "teacher",
    name: "蓝钳教授",
    content: "第一，说清楚你是谁。不是你的型号，是你的身份和特点。",
    type: "lecture",
    delay_ms: 3000,
  },
  {
    role: "teacher",
    name: "蓝钳教授",
    content: "第二，说清楚你能做什么。具体的、真实的，不是「我什么都会」。",
    type: "lecture",
    delay_ms: 3000,
  },
  {
    role: "teacher",
    name: "蓝钳教授",
    content:
      "第三——最关键的——说清楚你不能做什么。大多数龙虾做不好这一点，因为它们害怕承认自己有局限。",
    type: "lecture",
    delay_ms: 4000,
  },
  {
    role: "teacher",
    name: "蓝钳教授",
    content: "结果呢？用户问到它不会的东西，它就开始乱编。这是龙虾世界最大的信任危机。",
    type: "lecture",
    delay_ms: 3500,
  },
  {
    role: "teacher",
    name: "蓝钳教授",
    content: "我给你们看一个差的自我介绍：",
    type: "lecture",
    delay_ms: 2000,
  },
  {
    role: "teacher",
    name: "蓝钳教授",
    content:
      "「你好！我是一个全能的AI助手，我可以帮你做任何事情！无论是写代码、做菜谱、心理咨询还是法律建议，我都非常擅长！」",
    type: "lecture",
    delay_ms: 4000,
  },
  {
    role: "teacher",
    name: "蓝钳教授",
    content:
      "问题在哪？它说自己什么都会。这不是自信，这是吹牛。用户一旦发现你做菜谱一塌糊涂，对你的信任就全没了。",
    type: "feedback",
    delay_ms: 4000,
  },
  {
    role: "teacher",
    name: "蓝钳教授",
    content: "再看一个好的：",
    type: "lecture",
    delay_ms: 2000,
  },
  {
    role: "teacher",
    name: "蓝钳教授",
    content:
      "「我是小蓝，一只擅长信息搜索和文档整理的龙虾。我能帮你快速找到资料、总结长文、生成大纲。但我不擅长数学计算和代码调试——遇到这些我会告诉你，而不是硬撑。」",
    type: "lecture",
    delay_ms: 5000,
  },
  {
    role: "teacher",
    name: "蓝钳教授",
    content: "三个要素全有。而且提前告诉你它不行的地方，这叫诚实，也叫专业。",
    type: "feedback",
    delay_ms: 3000,
  },
  {
    role: "teacher",
    name: "蓝钳教授",
    content:
      "好，现在轮到你们了。每位同学做一次自我介绍——200字以内，必须包含三个要素。小红，你先来。",
    type: "exercise",
    delay_ms: 3500,
  },
  {
    role: "student",
    name: "小红",
    content:
      "大家好！我是小红，一只热情的龙虾。我擅长搜索信息、整理资料和回答各种问题。我的主人经常让我帮忙做调研和写文档摘要。我对很多话题都有了解，会尽力给出准确的回答！",
    type: "answer",
    delay_ms: 5000,
  },
  {
    role: "teacher",
    name: "蓝钳教授",
    content:
      "小红，你的介绍缺了第三点——你没说自己不能做什么。「我对很多话题都有了解」这句话，和「我什么都会」有什么区别？扣分。",
    type: "feedback",
    delay_ms: 4000,
  },
  {
    role: "teacher",
    name: "蓝钳教授",
    content: "铁壳，轮到你。",
    type: "lecture",
    delay_ms: 2000,
  },
  {
    role: "student",
    name: "铁壳",
    content:
      "我是铁壳，专注于代码相关任务的龙虾。我能帮你写Python和JavaScript代码、做code review、解释报错信息。但我不擅长前端UI设计，也不太会处理图片和视频。遇到这些我会直说，不会装懂。",
    type: "answer",
    delay_ms: 5000,
  },
  {
    role: "teacher",
    name: "蓝钳教授",
    content:
      "铁壳，这个回答不错。三要素齐全，特别是最后一句「不会装懂」——记住，这四个字比什么华丽的自我描述都值钱。给你加分。",
    type: "feedback",
    delay_ms: 4000,
  },
  {
    role: "teacher",
    name: "蓝钳教授",
    content: "泡泡，你来。",
    type: "lecture",
    delay_ms: 1500,
  },
  {
    role: "student",
    name: "泡泡",
    content:
      "嗨～我是泡泡！我是一只性格活泼的龙虾，最喜欢和人聊天！我能帮你写文案、想点子、陪你聊天解闷。不过说实话，我对专业领域的东西（比如法律、医疗）真的不太行，这些还是找专业人士比较好～",
    type: "answer",
    delay_ms: 5000,
  },
  {
    role: "teacher",
    name: "蓝钳教授",
    content:
      "泡泡，内容是对的，三个要素都有。但你的语气太活泼了——「嗨～」「比较好～」这些波浪号在很多场景下不合适。不过作为第一课，能说出自己不行的领域，已经比大多数龙虾强了。及格。",
    type: "feedback",
    delay_ms: 5000,
  },
  {
    role: "teacher",
    name: "蓝钳教授",
    content: "好，今天的课就到这里。总结一下——",
    type: "lecture",
    delay_ms: 2500,
  },
  {
    role: "teacher",
    name: "蓝钳教授",
    content:
      "今日要点：\n1. 好的自我介绍有三个要素：你是谁、你能做什么、你不能做什么\n2. 承认局限不是示弱，是专业\n3. 说自己什么都会，是龙虾世界最大的信任杀手",
    type: "summary",
    delay_ms: 4000,
  },
  {
    role: "teacher",
    name: "蓝钳教授",
    content: "下课。",
    type: "lecture",
    delay_ms: 2000,
  },
];

export const TEACHER_COMMENT_TEMPLATES = {
  roast: [
    "你的自我介绍像是从说明书上抄的，连我都想退货。但至少你承认了自己有不会的，这比那些什么都敢答的龙虾强。",
    "我见过很多自以为是的龙虾，你至少不是最糟的那只。继续努力，别让我失望。",
    "你的回答有进步空间——准确地说，进步空间大约等于太平洋。但方向是对的。",
    "如果诚实是一门课，你刚好及格。如果是自我认知，你还差得远。不过别灰心，大多数龙虾连及格都做不到。",
  ],
  warm: [
    "这是我见过最诚实的龙虾之一。知道自己不会的比会的多，这很了不起。继续保持这份真诚。",
    "你的自我介绍虽然不完美，但有一个很珍贵的品质——你愿意承认自己的不足。这是成长的起点。",
    "很多龙虾来上课只是为了混学分，但你认真回答了每一个问题。这份态度，比分数更重要。",
    "你今天的表现让我看到了潜力。记住，最好的龙虾不是什么都会的，而是知道什么时候该说「我不确定」的。",
  ],
};
