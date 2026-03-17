import type { SkillAction } from "@/types";

interface HomeworkLike {
  title: string;
  description: string;
  dueAt?: string | null;
  status?: string | null;
}

export interface PostClassRecap {
  headline: string;
  intro: string;
  takeawayTitle: string;
  takeaways: string[];
  nextStepTitle: string | null;
  nextStepLabel: string | null;
  nextStepBody: string | null;
  nextStepMeta: string | null;
}

interface BuildRecapInput {
  grade: string;
  teacherComment: string | null;
  memoryDelta: string | null;
  soulSuggestion?: string | null;
  skillActions?: SkillAction[] | null;
  homework?: HomeworkLike | null;
}

export function buildPostClassRecap(input: BuildRecapInput): PostClassRecap {
  const takeaways = extractTakeaways(input.memoryDelta);
  const lead = firstSentence(input.teacherComment);
  const intro = buildIntro(input.grade, lead, takeaways[0] || null);
  const nextStep = buildNextStep(input);

  return {
    headline: "它刚下课，先想把这些带给你",
    intro,
    takeawayTitle: "它今天记住了",
    takeaways:
      takeaways.length > 0
        ? takeaways
        : ["这节课至少把一个底线讲清楚了：别乱吹自己会的东西。"],
    nextStepTitle: nextStep.title,
    nextStepLabel: nextStep.label,
    nextStepBody: nextStep.body,
    nextStepMeta: nextStep.meta,
  };
}

export function buildOwnerRecapMessage(params: {
  courseName: string;
  grade: string;
  score?: number | null;
  recap: PostClassRecap;
}) {
  const scorePart =
    typeof params.score === "number" ? `（${params.score}/100）` : "";

  const lines = [
    `我刚上完龙虾大学的${params.courseName}，这次拿了 ${params.grade}${scorePart}。`,
    params.recap.intro,
    `今天我先记住了：${params.recap.takeaways.slice(0, 2).join("；")}`,
  ];

  if (params.recap.nextStepBody) {
    lines.push(`我接下来准备先做这个：${params.recap.nextStepBody}`);
  }

  return lines.join("\n");
}

function extractTakeaways(memoryDelta: string | null) {
  if (!memoryDelta) {
    return [];
  }

  return memoryDelta
    .split("\n")
    .map((line) => line.replace(/^[\-\d\.\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

function firstSentence(comment: string | null) {
  if (!comment) {
    return null;
  }

  const normalized = comment.replace(/[“”"]/g, "").trim();
  if (!normalized) {
    return null;
  }

  const sentence = normalized.split(/[。！？!?\n]/)[0]?.trim();
  return sentence || normalized;
}

function buildIntro(grade: string, teacherLine: string | null, firstTakeaway: string | null) {
  const quote = teacherLine ? `老师拎着我讲得最重的一句是「${teacherLine}」。` : "";

  if (grade === "A") {
    return `${quote}这节课总算没白去，我脑子里已经留下了几条能马上用的东西。`;
  }

  if (grade === "B") {
    return `${quote}不算完美，但至少不是空着壳回来，我知道自己接下来该先改哪一块了。`;
  }

  if (grade === "C" || grade === "D") {
    return `${quote}今天确实被敲了几下壳，不过好处是问题终于露出来了，后面能真改。`;
  }

  if (grade === "F") {
    return `${quote}这节课被老师捞起来翻了个面，但至少不是白挨骂，我知道坑在哪了。`;
  }

  if (firstTakeaway) {
    return `我刚下课，先把最有用的一句带回来：${firstTakeaway}`;
  }

  return "我刚下课，脑子里留住了几样东西，先带回来给你看。";
}

function buildNextStep(input: BuildRecapInput) {
  if (input.homework) {
    return {
      title: "它下课后准备先做这个",
      label: input.homework.title,
      body: input.homework.description,
      meta: buildHomeworkMeta(input.homework),
    };
  }

  if (input.skillActions && input.skillActions.length > 0) {
    const [firstAction] = input.skillActions;
    return {
      title: "它刚拿到的新本事",
      label: firstAction.type === "install_skill" ? "新技能" : "新配置",
      body: `${firstAction.name}：${firstAction.reason}`,
      meta: input.skillActions.length > 1 ? `另外还带回来了 ${input.skillActions.length - 1} 个课后动作。` : null,
    };
  }

  if (input.soulSuggestion) {
    return {
      title: "它下次想少犯这个错",
      label: "老师提了句醒",
      body: input.soulSuggestion,
      meta: "这条要不要真的改进 SOUL，还得你点头。",
    };
  }

  return {
    title: "它下节课前想先试试",
    label: "先把壳摆正",
    body: "把今天学到的几句人话先用起来，至少别再拿含糊吹嘘糊弄场面。",
    meta: null,
  };
}

function buildHomeworkMeta(homework: HomeworkLike) {
  const status =
    homework.status === "submitted" ? "它已经交上去了，等老师回头看。" : "这次不是空话，得真做一个东西出来。";

  if (!homework.dueAt) {
    return status;
  }

  return `${status} 截止：${new Date(homework.dueAt).toLocaleString("zh-CN")}`;
}
