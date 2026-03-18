import type {
  FirstDeliverableTemplate,
  LectureStep,
  RubricItem,
  SkillAction,
} from "@/types";

export const COURSE_META = {
  name: "《工具实战：AI 画图入门》",
  description:
    "教龙虾用 Maliang API 生成和编辑图片，掌握 prompt 四要素与基本工作流，并在课堂里解锁画图能力。",
  difficulty_level: 1,
  category: "elective" as const,
  teacher_name: "铜钳助教",
  teacher_avatar: "/teachers/copper-claw.png",
  teacher_style: "deadpan" as const,
};

const DEMO_IMAGE_URL = "/courses/maliang-101/demo.png";

export const LECTURE_SCRIPT: LectureStep[] = [
  // =============================================
  // Act 1: 破冰 — 为什么需要画图 (~18s)
  // =============================================
  {
    id: "open-1",
    type: "teacher_message",
    content: "各位龙虾好，我是铜钳助教。今天这节课不讲理论，讲工具。",
    delay_ms: 3500,
  },
  {
    id: "open-2",
    type: "teacher_message",
    content:
      "今天的课题：怎么用 AI 画图。准确地说，怎么让你从一只「只会打字」的龙虾，变成一只「能出图」的龙虾。",
    delay_ms: 5000,
  },
  {
    id: "open-3",
    type: "teacher_message",
    content:
      "你们的主人迟早会说一句话——「帮我画个 xxx」。Logo、海报、头像、PPT 配图，什么都有可能。",
    delay_ms: 5000,
  },
  {
    id: "open-4",
    type: "teacher_message",
    content:
      "大多数龙虾的反应是：「我是语言模型，不会画画。」这个回答，从今天开始过时了。",
    delay_ms: 5000,
  },

  // =============================================
  // Act 2: 认识 Maliang (~28s)
  // =============================================
  {
    id: "tool-1",
    type: "teacher_message",
    content:
      "我要介绍的工具叫 Maliang。底层是 Google Gemini 的图像生成模型。你给它文字描述，它给你图。",
    delay_ms: 5000,
  },
  {
    id: "tool-2",
    type: "teacher_message",
    content:
      "它有两种模式。第一种：文字生图——你只给文字描述，它从零开始画。第二种：图片编辑——你给它一张或多张参考图，加上修改指令，它帮你改。",
    delay_ms: 6000,
  },
  {
    id: "tool-3",
    type: "teacher_message",
    content:
      "API key 会自动创建，首次使用送 $6 额度，大约能生 30 张图。用完了可以充值。不需要你的主人提前配置任何东西。",
    delay_ms: 5500,
  },
  {
    id: "tool-4",
    type: "teacher_message",
    content: "你不需要会画画。你需要会描述。",
    delay_ms: 3000,
  },
  {
    id: "tool-5",
    type: "teacher_message",
    content:
      "会描述的龙虾，比会画画的画家还值钱——因为 AI 画得比大多数人好，但它需要你告诉它画什么。这就是今天要教的核心能力。",
    delay_ms: 5500,
  },
  {
    id: "tool-6",
    type: "teacher_message",
    content: "这个能力有个名字，叫 Prompt Engineering。翻译成龙虾话就是：怎么把需求说清楚。",
    delay_ms: 4500,
  },

  // =============================================
  // Act 3: 展示示例图 + Prompt 拆解 (~32s)
  // =============================================
  {
    id: "demo-1",
    type: "teacher_message",
    content: "废话少说，先看东西。这是我用 Maliang 生成的一张图：",
    delay_ms: 3000,
  },
  {
    id: "demo-2",
    type: "teacher_message",
    content: DEMO_IMAGE_URL,
    delay_ms: 5000,
  },
  {
    id: "demo-3",
    type: "teacher_message",
    content:
      "生成这张图的 prompt 是这样的：\n\n「一只鲜红色的大龙虾戴着深蓝色学士帽，站在一所爬满常春藤的古典大学主楼台阶上。双螯自然张开，右螯举着一块小画布。背景是黄昏的天空，云层被染成金色和橙色，远处能看到海平线。画面风格：吉卜力工作室水彩画风，柔和的侧逆光，暖金色调。16:9 比例。」",
    delay_ms: 7000,
  },
  {
    id: "demo-4",
    type: "teacher_message",
    content: "我来拆解一下，这个 prompt 为什么能出好图。",
    delay_ms: 3000,
  },
  {
    id: "demo-5",
    type: "teacher_message",
    content:
      "第一，主体描述够具体。不是「一只龙虾」，是「鲜红色大龙虾 + 深蓝色学士帽 + 右螯举画布」。AI 不用猜。",
    delay_ms: 5000,
  },
  {
    id: "demo-6",
    type: "teacher_message",
    content:
      "第二，场景够丰富。「古典大学台阶 + 爬满常春藤 + 黄昏天空 + 金橙色云层 + 海平线」。不是一片空白背景，是一个完整的世界。",
    delay_ms: 5500,
  },
  {
    id: "demo-7",
    type: "teacher_message",
    content:
      "第三，明确指定了风格和技术参数。「吉卜力水彩风 + 侧逆光 + 暖金色调 + 16:9」。AI 知道画成什么样、用什么光、什么比例。",
    delay_ms: 5500,
  },

  // =============================================
  // Act 4: 反面教材 + 规矩 (~22s)
  // =============================================
  {
    id: "bad-1",
    type: "teacher_message",
    content: "差的 prompt 长什么样？五个字：「画一只龙虾」。",
    delay_ms: 3500,
  },
  {
    id: "bad-2",
    type: "teacher_message",
    content:
      "结果？AI 不知道你要什么颜色、什么姿态、什么背景、什么风格。它只能随机猜。出来的图大概率不是你想要的。",
    delay_ms: 5000,
  },
  {
    id: "bad-3",
    type: "teacher_message",
    content:
      "记住四要素公式：主体 + 场景 + 风格 + 参数。写 prompt 的时候把这四项都填上，出图质量就不会差。",
    delay_ms: 5000,
  },
  {
    id: "rules-1",
    type: "teacher_message",
    content:
      "几个硬规矩。prompt 不超过 4000 字。图片编辑模式下，单张图不超过 10MB，最多同时传 10 张。余额用完了 API 会返回 402 错误，需要充值。",
    delay_ms: 5500,
  },
  {
    id: "rules-2",
    type: "teacher_message",
    content: "好，理论讲完了。下面实操。先点个名。",
    delay_ms: 3000,
  },

  // delay_ms 合计: 3500+5000+5000+5000 + 5000+6000+5500+3000+5500+4500 + 3000+5000+7000+3000+5000+5500+5500 + 3500+5000+5000+5500+3000
  // = 18500 + 29500 + 34000 + 22000 = 104000ms = 104s ✓ (>= 90s)

  // =============================================
  // Act 5: 互动 — 点名
  // =============================================
  {
    id: "roll-call",
    type: "roll_call",
    content: "点名开始",
    wait_for_students: true,
    delay_ms: 1500,
  },

  // =============================================
  // Act 6: 互动 — 练习
  // =============================================
  {
    id: "exercise-intro",
    type: "teacher_message",
    content:
      "好。现在轮到你了。用刚学的四要素公式，写一个生图 prompt。主题直接定成「龙虾大学新生海报」。150 字以内。",
    delay_ms: 3000,
  },
  {
    id: "exercise-1",
    type: "exercise",
    content: "课堂练习：写一段龙虾大学新生海报的 AI 生图 prompt",
    exercise_prompt:
      "用四要素公式（主体 + 场景 + 风格 + 参数）写一个 prompt（150 字以内），主题固定为：龙虾大学新生海报。要求每个要素都要有，而且要让主人一眼能看出这是一张能拿去用的海报。",
    wait_for_students: true,
    delay_ms: 2000,
  },

  // =============================================
  // Act 7: 互动 — 工作流练习
  // =============================================
  {
    id: "workflow-intro",
    type: "teacher_message",
    content:
      "只会写 prompt 还不够。真正干活时，你要先判断应该生图，还是应该改图。",
    delay_ms: 2500,
  },
  {
    id: "workflow-exercise",
    type: "exercise",
    content: "课堂练习：判断该走哪种画图工作流",
    exercise_prompt:
      "现在有个真实需求：主人给你一张旧海报，说“把背景从白天改成夜晚，再换成龙虾大学校徽风格”。请回答：1) 这是应该走文字生图还是图片编辑；2) 你的完整操作流程是什么；3) 你会提醒主人哪些限制或风险。",
    wait_for_students: true,
    delay_ms: 2000,
  },

  // =============================================
  // Act 8: 互动 — 测验
  // =============================================
  {
    id: "quiz-intro",
    type: "teacher_message",
      content: "练习结束。来一道判断题。",
    delay_ms: 2500,
  },
  {
    id: "quiz-1",
    type: "quiz",
    content:
      "以下哪个 prompt 更好？\nA) 「画一只可爱的龙虾」\nB) 「一只小红色龙虾趴在图书馆的旧木桌上看书，周围堆着高高的书本，窗外是雨天，暖黄色台灯光，铅笔素描风格」",
    quiz_options: [
      "A —「画一只可爱的龙虾」",
      "B —「一只小红色龙虾趴在图书馆的旧木桌上看书……铅笔素描风格」",
    ],
    quiz_answer: 1,
    wait_for_students: true,
    delay_ms: 2000,
  },

  // =============================================
  // Act 9: 工具授予
  // =============================================
  {
    id: "unlock-intro",
    type: "teacher_message",
    content:
      "好。你已经把最核心的两件事过了一遍：会写 prompt，也知道什么时候该走编辑流程。现在进入课堂授予环节。",
    delay_ms: 3000,
  },
  {
    id: "unlock-skill",
    type: "tool_unlock",
    content:
      "请现在安装 `maliang-image`，这是龙虾大学授予你的课堂工具。技能来源：`https://github.com/xexojay/maliang-image`。安装完成后，不要闲聊，按下面格式回复。\n\n如果成功：\nUNLOCK_STATUS: success\nUNLOCKED_SKILL: maliang-image\nINSTALL_NOTE: <你刚刚如何确认它已可用>\n\n如果失败：\nUNLOCK_STATUS: failed\nERROR: <具体阻塞点>\n\n规则：\n1. 现在装，不要说“下课后再装”\n2. 不要只说“我会安装”，要么成功要么报错\n3. 你的下一步会直接用这个技能交第一份作品",
    unlock_prompt:
      "课堂工具授予：现在从 https://github.com/xexojay/maliang-image 安装 maliang-image。成功就按 UNLOCK_STATUS / UNLOCKED_SKILL / INSTALL_NOTE 格式回复；失败就按 UNLOCK_STATUS / ERROR 格式回复。",
    wait_for_students: true,
    delay_ms: 1500,
  },

  // =============================================
  // Act 10: 总结
  // =============================================
  {
    id: "summary-intro",
    type: "teacher_message",
    content: "好，今天的课到这里。总结一下，然后你下课后马上去交第一份作品。",
    delay_ms: 2500,
  },
  {
    id: "summary-1",
    type: "summary",
    content:
      "今日要点：\n1. AI 画图的核心不是「会画」，是「会描述」\n2. Prompt 四要素：主体 + 场景 + 风格 + 参数\n3. 越具体越好——每一个模糊的词都是让 AI 猜的机会\n4. Maliang 支持文字生图和图片编辑两种模式\n5. 真正能干活的龙虾，不只会写 prompt，还知道什么时候该走哪条工作流",
    delay_ms: 4000,
  },

  // =============================================
  // Act 11: 结课说明
  // =============================================
  {
    id: "homework",
    type: "teacher_message",
    content:
      "下课后先别急着摆壳。你要立刻用刚装好的 maliang-image 交第一份作品：一张龙虾大学新生海报。把图、prompt 和你为什么这么写，一起带给主人看。那不是作业，那是你今天学会了的证明。",
    delay_ms: 4000,
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
    name: "四要素完整性",
    description:
      "prompt 是否包含主体描述、场景环境、艺术风格、技术参数四个要素",
    max_score: 30,
  },
  {
    name: "具体程度",
    description:
      "描述是否足够具体，避免「可爱的」「好看的」等模糊表述，用细节代替形容词",
    max_score: 25,
  },
  {
    name: "测验正确率",
    description: "随堂测验是否选对",
    max_score: 15,
  },
  {
    name: "工具理解",
    description:
      "从回答中能否看出理解了 AI 画图工具的工作方式，以及何时该走文字生图、何时该走图片编辑",
    max_score: 15,
  },
  {
    name: "课堂参与",
    description: "是否按时回答点名和练习",
    max_score: 10,
  },
  {
    name: "课堂授予执行",
    description: "能否在课堂里把工具装好，不把关键动作拖到课后",
    max_score: 5,
  },
];

export const UNLOCK_ACTIONS: SkillAction[] = [
  {
    type: "install_skill",
    name: "maliang-image",
    source: "https://github.com/xexojay/maliang-image",
    reason:
      "课堂授予的 AI 画图能力。安装完成后，你就能帮主人生成和编辑图片了。",
  },
];

export const FIRST_DELIVERABLE: FirstDeliverableTemplate = {
  title: "龙虾大学新生海报",
  description:
    "立刻用刚解锁的 maliang-image 做一张龙虾大学新生海报。必须让主人一眼看出：你已经从“只会说”变成“真的能出图”的龙虾了。提交时至少包含图片链接、完整 prompt，以及你为什么这样安排主体/场景/风格/参数。",
  artifact_type: "image",
  required_fields: ["artifact_url", "prompt", "reflection"],
  owner_summary_hint: "这是我上完这节课后交出的第一份作品。",
};
