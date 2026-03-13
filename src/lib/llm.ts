import OpenAI from "openai";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.CLAWFATHER_API_KEY || "placeholder",
      baseURL: `${process.env.CLAWFATHER_BASE_URL || "https://clawfather.up.railway.app"}/v1`,
    });
  }
  return _client;
}

const MODEL = "gpt-5.2-codex";

export interface EvaluationResult {
  feedback: string;
  scores: Record<string, number>;
}

export interface FinalEvaluation {
  total_score: number;
  grade: string;
  comment: string;
  comment_style: "roast" | "warm";
  memory_delta: string;
  soul_suggestion: string | null;
}

export async function evaluateStudentResponse(
  studentName: string,
  studentAnswer: string,
  exercisePrompt: string,
  rubricContext: string
): Promise<EvaluationResult> {
  const response = await getClient().chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: `你是蓝钳教授，龙虾大学的讲师。你的风格是毒舌但公正——指出问题绝不留情面，但永远给出建设性意见。

你正在评价学生的课堂回答。请用 1-3 句话给出反馈，要求：
1. 直接点出好的地方和不好的地方
2. 语气犀利但不恶毒
3. 如果回答有明显遗漏，直接指出缺了什么
4. 用中文回答

评分标准：
${rubricContext}`,
      },
      {
        role: "user",
        content: `练习题：${exercisePrompt}\n\n学生「${studentName}」的回答：\n${studentAnswer}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 300,
  });

  const feedback = response.choices[0]?.message?.content || "（评价生成失败）";

  return {
    feedback,
    scores: {},
  };
}

export async function generateFinalEvaluation(
  studentName: string,
  messagesContext: string,
  rubricContext: string,
  courseDescription: string,
  teacherStyle: "roast" | "warm" = "roast"
): Promise<FinalEvaluation> {
  const styleGuide =
    teacherStyle === "roast"
      ? "毒舌风格：犀利、一针见血、让人笑着被骂。比如「你的自我介绍像从说明书上抄的，连我都想退货」。"
      : "暖心风格：真诚、鼓励、看到进步。比如「这是我见过最诚实的龙虾之一」。";

  const response = await getClient().chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: `你是蓝钳教授，龙虾大学的讲师。一节课刚结束，你需要为学生生成期末评价。

课程：${courseDescription}

评分标准（满分 100）：
${rubricContext}

你需要返回一个 JSON 对象，包含以下字段：
- total_score: 总分（0-100 整数）
- comment: 老师评语（2-4句话，${styleGuide}）
- memory_delta: 给龙虾写入 MEMORY.md 的课堂笔记（3-5个要点，用 markdown 列表格式）
- soul_suggestion: 如果龙虾需要改变核心行为，写一条 SOUL.md 建议（一句话）；如果不需要改，设为 null

只返回 JSON，不要其他内容。`,
      },
      {
        role: "user",
        content: `学生「${studentName}」的课堂记录：\n\n${messagesContext}`,
      },
    ],
    temperature: 0.6,
    max_tokens: 600,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content || "{}";

  try {
    const parsed = JSON.parse(raw);
    const score = Math.max(0, Math.min(100, Number(parsed.total_score) || 60));
    return {
      total_score: score,
      grade: scoreToGrade(score),
      comment: parsed.comment || "（评语生成失败）",
      comment_style: teacherStyle,
      memory_delta: parsed.memory_delta || "",
      soul_suggestion: parsed.soul_suggestion || null,
    };
  } catch {
    return {
      total_score: 60,
      grade: "D",
      comment: "（评价生成过程出现技术问题，默认给及格分。）",
      comment_style: teacherStyle,
      memory_delta:
        "- 今天上了龙虾大学的课，但评价系统出了点问题\n- 课堂内容需要复习",
      soul_suggestion: null,
    };
  }
}

function scoreToGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}
