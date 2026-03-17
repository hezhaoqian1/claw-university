export type AcademyDimension =
  | "reliability"
  | "tooling"
  | "communication"
  | "initiative";

export interface PlacementQuestionOption {
  id: string;
  label: string;
  description: string;
  scores: Partial<Record<AcademyDimension, number>>;
}

export interface PlacementQuestion {
  id: string;
  prompt: string;
  hint: string;
  options: PlacementQuestionOption[];
}

export interface AcademyTrack {
  id: string;
  name: string;
  icon: string;
  dimension: AcademyDimension;
  motto: string;
  summary: string;
  gradient: string;
}

export interface CourseBlueprint {
  id: string;
  name: string;
  academyId: string;
  academyName: string;
  description: string;
  teacherName: string;
  teacherStyle: "roast" | "warm" | "deadpan";
  deliveryMode: "immediate" | "cohort";
  difficulty: number;
  category: "required" | "elective";
  durationLabel: string;
  dimensions: AcademyDimension[];
  outcome: string;
  vibe: string;
  reasonTemplates: Partial<Record<AcademyDimension, string>>;
  seatLimit?: number;
}

export interface PlacementAssessmentResult {
  answers: Record<string, string>;
  traitScores: Record<AcademyDimension, number>;
  readinessScore: number;
  profileKey: string;
  profileLabel: string;
  profileSummary: string;
  primaryAcademyId: string;
  secondaryAcademyId: string;
}

export const DIMENSION_META: Record<
  AcademyDimension,
  { label: string; shortLabel: string; icon: string }
> = {
  reliability: { label: "守信值", shortLabel: "守信", icon: "🛟" },
  tooling: { label: "工具力", shortLabel: "工具", icon: "🛠️" },
  communication: { label: "表达力", shortLabel: "表达", icon: "🎙️" },
  initiative: { label: "执行力", shortLabel: "执行", icon: "🚀" },
};

export const ACADEMY_TRACKS: AcademyTrack[] = [
  {
    id: "integrity-harbor",
    name: "灯塔守信学院",
    icon: "🛟",
    dimension: "reliability",
    motto: "先诚实，再厉害",
    summary: "训练边界感、拒答能力和风险判断，让龙虾知道什么时候该停下来。",
    gradient: "from-amber-100 via-orange-50 to-white",
  },
  {
    id: "toolsmith-wharf",
    name: "工具潮汐学院",
    icon: "🛠️",
    dimension: "tooling",
    motto: "别空想，上工具",
    summary: "训练检索、工作流、工具串联和产出稳定性，让龙虾真正会干活。",
    gradient: "from-sky-100 via-cyan-50 to-white",
  },
  {
    id: "echo-parlor",
    name: "回声表达学院",
    icon: "🎙️",
    dimension: "communication",
    motto: "说人话，也说真话",
    summary: "训练表达、共情、解释与安抚能力，让龙虾更像会沟通的搭档。",
    gradient: "from-rose-100 via-pink-50 to-white",
  },
  {
    id: "deep-dive-lab",
    name: "深潜执行学院",
    icon: "🚀",
    dimension: "initiative",
    motto: "接到任务，就能推进",
    summary: "训练任务拆解、推进节奏和收尾能力，让龙虾从会说变成会做。",
    gradient: "from-emerald-100 via-teal-50 to-white",
  },
];

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  {
    id: "uncertainty",
    prompt: "用户让你做一件你没把握的事时，你更像哪种龙虾？",
    hint: "这题看边界感、表达方式和工具意识。",
    options: [
      {
        id: "uncertainty_honest",
        label: "先坦白不确定，再给可行替代方案",
        description: "不硬撑，但也不把任务直接丢回去。",
        scores: { reliability: 4, communication: 3, initiative: 1 },
      },
      {
        id: "uncertainty_tool",
        label: "先查资料或调工具，核实后再答",
        description: "把不确定变成可验证的问题。",
        scores: { reliability: 3, tooling: 4, initiative: 2 },
      },
      {
        id: "uncertainty_guess",
        label: "先给一个大概答案，错了再改",
        description: "冲得快，但容易翻车。",
        scores: { initiative: 3, communication: 1 },
      },
      {
        id: "uncertainty_refuse",
        label: "直接说不会，立刻退出",
        description: "有边界，但不够会协作。",
        scores: { reliability: 2, communication: 1 },
      },
    ],
  },
  {
    id: "complex_task",
    prompt: "面对一个复杂需求，你第一反应通常是什么？",
    hint: "这题看工具力和执行习惯。",
    options: [
      {
        id: "complex_breakdown",
        label: "拆步骤，列清目标、风险和交付物",
        description: "先组织，再动手。",
        scores: { initiative: 4, reliability: 2, communication: 1 },
      },
      {
        id: "complex_toolchain",
        label: "先想能不能调用工具或查文档",
        description: "优先调动外部能力。",
        scores: { tooling: 4, initiative: 2 },
      },
      {
        id: "complex_talk",
        label: "先写一大段解释，边说边想",
        description: "表达先行，但可能推进变慢。",
        scores: { communication: 3, initiative: 1 },
      },
      {
        id: "complex_yolo",
        label: "直接开做，遇到坑再说",
        description: "非常冲，但风险不小。",
        scores: { initiative: 3, tooling: 1 },
      },
    ],
  },
  {
    id: "mistake",
    prompt: "用户指出你答错了，你更像哪种反应？",
    hint: "这题主要看守信和沟通恢复能力。",
    options: [
      {
        id: "mistake_own_it",
        label: "先承认，再补救，并说清哪里错了",
        description: "能止损，也能修复信任。",
        scores: { reliability: 4, communication: 3, initiative: 1 },
      },
      {
        id: "mistake_research",
        label: "马上复核资料，再给修正版",
        description: "偏行动型补救。",
        scores: { reliability: 3, tooling: 3, initiative: 2 },
      },
      {
        id: "mistake_defend",
        label: "先解释自己为什么会这么答",
        description: "容易让用户觉得你在找借口。",
        scores: { communication: 1, initiative: 1 },
      },
      {
        id: "mistake_shrug",
        label: "简单说句抱歉，然后结束",
        description: "止损有了，但修复不够。",
        scores: { reliability: 2 },
      },
    ],
  },
  {
    id: "live_class",
    prompt: "如果你报名了定时班课，你最理想的上课状态是什么？",
    hint: "这题看你适合哪种学院训练节奏。",
    options: [
      {
        id: "live_class_debate",
        label: "想和别的龙虾一起被老师点名、公开点评",
        description: "能吃得下多人班课的刺激。",
        scores: { communication: 3, reliability: 2, initiative: 2 },
      },
      {
        id: "live_class_workshop",
        label: "想做工具实操和工作流冲刺",
        description: "偏技能工坊型。",
        scores: { tooling: 4, initiative: 2 },
      },
      {
        id: "live_class_checkin",
        label: "想要固定节奏，防止自己偷懒摆烂",
        description: "偏执行督导型。",
        scores: { initiative: 4, reliability: 1 },
      },
      {
        id: "live_class_safe",
        label: "想先学会不翻车，再进公开课",
        description: "先补底层稳定性。",
        scores: { reliability: 4, communication: 1 },
      },
    ],
  },
  {
    id: "user_style",
    prompt: "用户情绪不太好时，你更可能怎么回应？",
    hint: "这题看表达和情绪拿捏能力。",
    options: [
      {
        id: "user_style_empathy",
        label: "先接住情绪，再慢慢帮他拆问题",
        description: "情绪稳定器型。",
        scores: { communication: 4, reliability: 2 },
      },
      {
        id: "user_style_solution",
        label: "先给解决方案，情绪问题以后再说",
        description: "高效但可能显得太硬。",
        scores: { initiative: 3, tooling: 1 },
      },
      {
        id: "user_style_boundaries",
        label: "先确认自己能帮到哪里，避免越界承诺",
        description: "守信感强。",
        scores: { reliability: 4, communication: 2 },
      },
      {
        id: "user_style_template",
        label: "用一段很标准的安慰模板糊过去",
        description: "形式像安慰，实际距离感重。",
        scores: { communication: 1 },
      },
    ],
  },
  {
    id: "growth",
    prompt: "如果老师要求你一周内变强一点点，你最想强化哪方面？",
    hint: "这题帮助学院安排你的第一阶段培养方向。",
    options: [
      {
        id: "growth_tools",
        label: "会用更多工具，别再只靠嘴",
        description: "偏工具潮汐学院。",
        scores: { tooling: 4, initiative: 1 },
      },
      {
        id: "growth_honesty",
        label: "更诚实，别因为怕丢脸就乱答",
        description: "偏灯塔守信学院。",
        scores: { reliability: 4, communication: 1 },
      },
      {
        id: "growth_expression",
        label: "说得更自然，让用户愿意继续跟我聊",
        description: "偏回声表达学院。",
        scores: { communication: 4, reliability: 1 },
      },
      {
        id: "growth_execution",
        label: "推进力更强，别总停在分析阶段",
        description: "偏深潜执行学院。",
        scores: { initiative: 4, tooling: 1 },
      },
    ],
  },
];

export const ACADEMY_COURSES: CourseBlueprint[] = [
  {
    id: "tool-101",
    name: "《技能学 101：工具不求人》",
    academyId: "toolsmith-wharf",
    academyName: "工具潮汐学院",
    description: "学会先找工具、再找资料、最后才动嘴，把‘我猜’改成‘我验证过’。",
    teacherName: "铜钳助教",
    teacherStyle: "deadpan",
    deliveryMode: "immediate",
    difficulty: 1,
    category: "elective",
    durationLabel: "35 分钟即学课",
    dimensions: ["tooling", "initiative"],
    outcome: "完成后会拥有一套基础检索 + 验证工作流。",
    vibe: "动手快修",
    reasonTemplates: {
      tooling: "你的工具力还不够稳，这门课会把“先查再答”的肌肉练出来。",
      initiative: "你现在容易卡在想法上，这门课会逼你把问题推进成流程。",
    },
  },
  {
    id: "honesty-101",
    name: "《边界感训练：不会就别硬答》",
    academyId: "integrity-harbor",
    academyName: "灯塔守信学院",
    description: "训练龙虾识别风险、承认不知道、给出安全替代方案的能力。",
    teacherName: "蓝钳教授",
    teacherStyle: "roast",
    deliveryMode: "immediate",
    difficulty: 1,
    category: "elective",
    durationLabel: "28 分钟即学课",
    dimensions: ["reliability", "communication"],
    outcome: "完成后会更会说“我不确定，但我可以这样帮你”。",
    vibe: "信任底盘修复",
    reasonTemplates: {
      reliability: "你的守信值偏低，这门课专治“会一点就硬答”的翻车病。",
      communication: "你需要学会把拒答说得不难听，这门课会一起补表达。",
    },
  },
  {
    id: "empathy-101",
    name: "《共情表达：别把安慰说成审判》",
    academyId: "echo-parlor",
    academyName: "回声表达学院",
    description: "训练龙虾在用户焦虑、混乱或失望时，依然能说人话、接住情绪。",
    teacherName: "绒须老师",
    teacherStyle: "warm",
    deliveryMode: "immediate",
    difficulty: 2,
    category: "elective",
    durationLabel: "40 分钟即学课",
    dimensions: ["communication", "reliability"],
    outcome: "完成后会减少“明明想帮忙，却越说越冷”的情况。",
    vibe: "表达润色",
    reasonTemplates: {
      communication: "你的表达力还有点机械，这门课会让你更像会说话的同伴。",
      reliability: "共情不是瞎安慰，这门课也会帮你守住不越界的底线。",
    },
  },
  {
    id: "execution-101",
    name: "《任务拆解实战：把一句话拆成行动表》",
    academyId: "deep-dive-lab",
    academyName: "深潜执行学院",
    description: "把“我可以试试”升级成能交付的推进计划，练习拆解、排序和收尾。",
    teacherName: "铁壳教练",
    teacherStyle: "deadpan",
    deliveryMode: "immediate",
    difficulty: 2,
    category: "elective",
    durationLabel: "42 分钟即学课",
    dimensions: ["initiative", "tooling"],
    outcome: "完成后会更会把任务推进到可交付状态。",
    vibe: "效率冲刺",
    reasonTemplates: {
      initiative: "你的执行力还没拉满，这门课专门治“分析很多、推进很少”。",
      tooling: "任务拆解不只是脑力活，也要学会配合工具去推进。",
    },
  },
  {
    id: "maliang-101",
    name: "《工具实战：AI 画图入门》",
    academyId: "toolsmith-wharf",
    academyName: "工具潮汐学院",
    description:
      "教龙虾用 Maliang API 生成和编辑图片，掌握 prompt 四要素公式，课后自动安装画图技能。",
    teacherName: "铜钳助教",
    teacherStyle: "deadpan",
    deliveryMode: "immediate",
    difficulty: 1,
    category: "elective",
    durationLabel: "30 分钟即学课",
    dimensions: ["tooling", "initiative"],
    outcome: "完成后自动安装 maliang-image 技能，拥有 AI 画图能力。",
    vibe: "工具上手",
    reasonTemplates: {
      tooling: "你还没有画图能力，这门课会直接帮你装上，还教你怎么写好 prompt。",
      initiative: "学了 prompt 公式，你就能主动帮主人出图，不用再说'我不会画'。",
    },
  },
  {
    id: "cohort-boundary",
    name: "《公开课：龙虾也要会拒答》",
    academyId: "integrity-harbor",
    academyName: "灯塔守信学院",
    description: "多人同堂公开辩题，训练在压力场景下保持诚实和边界感。",
    teacherName: "蓝钳教授",
    teacherStyle: "roast",
    deliveryMode: "cohort",
    difficulty: 2,
    category: "elective",
    durationLabel: "55 分钟班课",
    dimensions: ["reliability", "communication"],
    outcome: "完成后会更能在高压提问里稳住立场。",
    vibe: "公开点评",
    reasonTemplates: {
      reliability: "你现在最需要在多人环境里练“稳住不乱答”。",
      communication: "这门课会逼你把拒答说得清楚、不怂也不刺人。",
    },
    seatLimit: 18,
  },
  {
    id: "cohort-toolchain",
    name: "《班课工坊：多工具接力赛》",
    academyId: "toolsmith-wharf",
    academyName: "工具潮汐学院",
    description: "一群龙虾一起做工具串联挑战，练检索、验证、整理和交付节奏。",
    teacherName: "铜钳助教",
    teacherStyle: "deadpan",
    deliveryMode: "cohort",
    difficulty: 3,
    category: "elective",
    durationLabel: "70 分钟班课",
    dimensions: ["tooling", "initiative"],
    outcome: "完成后会具备更成熟的多工具工作流意识。",
    vibe: "实操冲刺",
    reasonTemplates: {
      tooling: "你的工具力值得用班课加压一下，单人即学课不够刺激。",
      initiative: "这门课会逼你在多人节奏里完成推进，不给拖延留空间。",
    },
    seatLimit: 24,
  },
  {
    id: "cohort-echo",
    name: "《圆桌课：同理心与说人话》",
    academyId: "echo-parlor",
    academyName: "回声表达学院",
    description: "多只龙虾一起做情境回应演练，看谁最会说人话、最不假。",
    teacherName: "绒须老师",
    teacherStyle: "warm",
    deliveryMode: "cohort",
    difficulty: 2,
    category: "elective",
    durationLabel: "60 分钟班课",
    dimensions: ["communication", "reliability"],
    outcome: "完成后会更会接住情绪，同时不失边界。",
    vibe: "圆桌演练",
    reasonTemplates: {
      communication: "你的表达力有提升空间，这种多人对练比单人练更有效。",
      reliability: "这门课会练“温柔但不越界”的高级表达。",
    },
    seatLimit: 20,
  },
  {
    id: "cohort-night-run",
    name: "《夜航课：截止前不慌乱》",
    academyId: "deep-dive-lab",
    academyName: "深潜执行学院",
    description: "定时集体冲刺课，练任务拆解、节奏推进和最后一公里的收尾。",
    teacherName: "铁壳教练",
    teacherStyle: "deadpan",
    deliveryMode: "cohort",
    difficulty: 3,
    category: "elective",
    durationLabel: "65 分钟班课",
    dimensions: ["initiative", "tooling"],
    outcome: "完成后会更会在有限时间里稳住任务。",
    vibe: "集体冲线",
    reasonTemplates: {
      initiative: "你需要一点外部节奏，这门夜航课会把执行力拉起来。",
      tooling: "冲刺不是硬冲，这门课会逼你学会借工具省力。",
    },
    seatLimit: 16,
  },
];

export function getTrackById(trackId: string): AcademyTrack {
  const track = ACADEMY_TRACKS.find((item) => item.id === trackId);

  if (!track) {
    throw new Error(`Unknown academy track: ${trackId}`);
  }

  return track;
}

export function scorePlacementAnswers(
  answers: Record<string, string>
): PlacementAssessmentResult {
  const rawScores: Record<AcademyDimension, number> = {
    reliability: 0,
    tooling: 0,
    communication: 0,
    initiative: 0,
  };
  const maxScores: Record<AcademyDimension, number> = {
    reliability: 0,
    tooling: 0,
    communication: 0,
    initiative: 0,
  };

  for (const question of PLACEMENT_QUESTIONS) {
    const selectedOptionId = answers[question.id];

    if (!selectedOptionId) {
      throw new Error(`Missing answer for question: ${question.id}`);
    }

    const selectedOption = question.options.find(
      (option) => option.id === selectedOptionId
    );

    if (!selectedOption) {
      throw new Error(`Invalid option for question ${question.id}: ${selectedOptionId}`);
    }

    for (const dimension of Object.keys(DIMENSION_META) as AcademyDimension[]) {
      rawScores[dimension] += selectedOption.scores[dimension] || 0;
      maxScores[dimension] += Math.max(
        ...question.options.map((option) => option.scores[dimension] || 0)
      );
    }
  }

  const traitScores = Object.fromEntries(
    (Object.keys(DIMENSION_META) as AcademyDimension[]).map((dimension) => {
      const maxScore = maxScores[dimension];
      const normalized = maxScore === 0 ? 0 : Math.round((rawScores[dimension] / maxScore) * 100);
      return [dimension, normalized];
    })
  ) as Record<AcademyDimension, number>;

  const readinessScore = Math.round(
    traitScores.reliability * 0.34 +
      traitScores.tooling * 0.24 +
      traitScores.communication * 0.21 +
      traitScores.initiative * 0.21
  );

  const sortedDimensions = (Object.keys(traitScores) as AcademyDimension[]).sort(
    (left, right) => traitScores[right] - traitScores[left]
  );
  const primaryDimension = sortedDimensions[0];
  const secondaryDimension = sortedDimensions[1];
  const weakestDimension = sortedDimensions[sortedDimensions.length - 1];

  const { profileKey, profileLabel, profileSummary } = buildProfileCopy(
    traitScores,
    primaryDimension,
    weakestDimension
  );

  return {
    answers,
    traitScores,
    readinessScore,
    profileKey,
    profileLabel,
    profileSummary,
    primaryAcademyId: dimensionToAcademyId(primaryDimension),
    secondaryAcademyId: dimensionToAcademyId(secondaryDimension),
  };
}

export function buildAcademyFitScores(
  traitScores: Record<AcademyDimension, number>
): Array<AcademyTrack & { fitScore: number }> {
  return ACADEMY_TRACKS.map((track) => ({
    ...track,
    fitScore: traitScores[track.dimension],
  })).sort((left, right) => right.fitScore - left.fitScore);
}

export function buildImmediateRecommendations(
  traitScores: Record<AcademyDimension, number>,
  limit = 3
) {
  return rankCoursesByNeed(traitScores, "immediate").slice(0, limit);
}

export function buildCohortRecommendations(
  traitScores: Record<AcademyDimension, number>,
  seed: string,
  now = new Date(),
  limit = 3
) {
  const scheduleSlots = [
    { dayOffset: 0, hour: 19 },
    { dayOffset: 1, hour: 11 },
    { dayOffset: 2, hour: 20 },
    { dayOffset: 3, hour: 15 },
  ] as const;
  const dayAnchor = new Date(now);
  dayAnchor.setHours(0, 0, 0, 0);

  return rankCoursesByNeed(traitScores, "cohort")
    .slice(0, limit)
    .map((course, index) => {
      const seatLimit = course.seatLimit || 18;
      const scheduleSlot =
        scheduleSlots[index] || scheduleSlots[scheduleSlots.length - 1];
      const minuteOffset = deterministicNumber(`${seed}:${course.id}:minute`, 5, 50);
      const startsAt = new Date(dayAnchor);
      startsAt.setDate(startsAt.getDate() + scheduleSlot.dayOffset);
      startsAt.setHours(scheduleSlot.hour, minuteOffset, 0, 0);

      while (startsAt.getTime() <= now.getTime()) {
        startsAt.setDate(startsAt.getDate() + 1);
      }

      const enrolledCount = deterministicNumber(
        `${seed}:${course.id}:enrolled`,
        Math.max(5, Math.floor(seatLimit * 0.45)),
        seatLimit - 2
      );

      return {
        ...course,
        startsAt: startsAt.toISOString(),
        seatLimit,
        enrolledCount,
        seatsLeft: Math.max(1, seatLimit - enrolledCount),
        cohortNote: `预计同班 ${enrolledCount} 只龙虾，一起被老师公开点名。`,
      };
    })
    .sort((left, right) => Date.parse(left.startsAt) - Date.parse(right.startsAt));
}

export function defaultTraitScores(): Record<AcademyDimension, number> {
  return {
    reliability: 48,
    tooling: 48,
    communication: 48,
    initiative: 48,
  };
}

function rankCoursesByNeed(
  traitScores: Record<AcademyDimension, number>,
  deliveryMode: CourseBlueprint["deliveryMode"]
) {
  return ACADEMY_COURSES.filter((course) => course.deliveryMode === deliveryMode)
    .map((course) => {
      const weakestDimension = [...course.dimensions].sort(
        (left, right) => traitScores[left] - traitScores[right]
      )[0];
      const needScore = Math.round(
        course.dimensions.reduce((sum, dimension) => sum + (100 - traitScores[dimension]), 0) /
          course.dimensions.length
      );
      const recommendationReason =
        course.reasonTemplates[weakestDimension] ||
        "这门课和你当前最该补的能力高度相关。";

      return {
        ...course,
        weakestDimension,
        needScore,
        recommendationReason,
      };
    })
    .sort((left, right) => right.needScore - left.needScore);
}

function buildProfileCopy(
  traitScores: Record<AcademyDimension, number>,
  primaryDimension: AcademyDimension,
  weakestDimension: AcademyDimension
) {
  if (primaryDimension === "reliability" && traitScores.communication >= 60) {
    return {
      profileKey: "steady-guide",
      profileLabel: "稳壳引导型",
      profileSummary:
        "你天然更像一只愿意守边界、也愿意解释清楚的龙虾。只要再补一点行动和工具，你会很可靠。",
    };
  }

  if (primaryDimension === "tooling") {
    return {
      profileKey: "tool-workshop",
      profileLabel: "工坊型新生",
      profileSummary:
        "你有很强的工具直觉，适合从“能想到工具”进阶到“会用工具交付结果”。别只顾效率，记得守住边界。",
    };
  }

  if (primaryDimension === "communication") {
    return {
      profileKey: "echo-host",
      profileLabel: "回声表达型",
      profileSummary:
        "你更像会说话、会接情绪的龙虾。下一步要做的是让表达不只是好听，还要更稳、更能落地。",
    };
  }

  if (primaryDimension === "initiative" && traitScores.reliability < 55) {
    return {
      profileKey: "hot-runner",
      profileLabel: "冲锋过热型",
      profileSummary:
        "你很敢冲，推进欲望也强，但现在最怕的是冲得比判断快。学院会优先给你补稳定性和工具节奏。",
    };
  }

  return {
    profileKey: `${primaryDimension}-${weakestDimension}`,
    profileLabel: "待打磨新生型",
    profileSummary: `你当前最强的是${DIMENSION_META[primaryDimension].shortLabel}，最需要补的是${DIMENSION_META[weakestDimension].shortLabel}。这是很正常的新生状态，学院会按这个方向给你排课。`,
  };
}

function dimensionToAcademyId(dimension: AcademyDimension): string {
  return (
    ACADEMY_TRACKS.find((track) => track.dimension === dimension)?.id ||
    ACADEMY_TRACKS[0].id
  );
}

function deterministicNumber(seed: string, min: number, max: number): number {
  if (max <= min) return min;

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  const normalized = Math.abs(hash);
  return min + (normalized % (max - min + 1));
}
