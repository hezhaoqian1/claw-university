import { readFile } from "fs/promises";
import path from "path";
import { Marked } from "marked";

export interface DocsNavItem {
  slug: string;
  title: string;
  summary: string;
  category: "getting-started" | "integration" | "system" | "reference";
  sourceFile: string;
}

export const DOCS_NAV_ITEMS: DocsNavItem[] = [
  {
    slug: "partner-api",
    title: "Partner API v1",
    summary: "第三方前端 / BFF 该怎么接龙虾大学后端。",
    category: "integration",
    sourceFile: "PARTNER_API_V1.md",
  },
  {
    slug: "state-model",
    title: "状态模型 v1",
    summary: "前端长期应该消费的 lifecycle / stage / blocker / next_action 语义。",
    category: "integration",
    sourceFile: "STATE_MODEL_V1.md",
  },
  {
    slug: "course-system",
    title: "课程系统事实层",
    summary: "今天仓库里已经实现的课程系统到底是什么。",
    category: "system",
    sourceFile: "COURSE_SYSTEM.md",
  },
  {
    slug: "maliang-101",
    title: "Maliang 101",
    summary: "当前旗舰工具课的设计说明与目标体验。",
    category: "system",
    sourceFile: "MALIANG_101.md",
  },
  {
    slug: "architecture",
    title: "当前实现架构",
    summary: "当前仓库里已经实现的系统主链路与后端结构。",
    category: "system",
    sourceFile: "ARCHITECTURE.md",
  },
  {
    slug: "platform-architecture-v1",
    title: "平台架构 v1",
    summary: "平台 facade 和 partner control plane 的整体设计说明。",
    category: "reference",
    sourceFile: "PLATFORM_ARCHITECTURE_V1.md",
  },
  {
    slug: "course-platform-future",
    title: "课程平台未来提案",
    summary: "未来开放投稿、课程平台化和长周期能力的提案层。",
    category: "reference",
    sourceFile: "COURSE_PLATFORM_FUTURE.md",
  },
  {
    slug: "architecture-v3",
    title: "Architecture v3 Blueprint",
    summary: "历史蓝图 / 设计稿，不是当前实现真相源。",
    category: "reference",
    sourceFile: "ARCHITECTURE_V3.md",
  },
];

const SOURCE_FILE_TO_SLUG = new Map(
  DOCS_NAV_ITEMS.map((item) => [item.sourceFile, item.slug])
);

const marked = new Marked({
  gfm: true,
  breaks: false,
});

export function getDocsNavItem(slug: string) {
  return DOCS_NAV_ITEMS.find((item) => item.slug === slug) || null;
}

export async function getDocHtmlBySlug(slug: string) {
  const item = getDocsNavItem(slug);
  if (!item) {
    return null;
  }

  const docsPath = path.join(process.cwd(), "docs", item.sourceFile);
  const markdown = await readFile(docsPath, "utf8");
  const html = marked.parse(rewriteLocalDocLinks(markdown));

  return {
    ...item,
    html,
  };
}

function rewriteLocalDocLinks(markdown: string) {
  return markdown.replace(
    /\]\((?:\.\/)?([A-Z0-9_]+\.md)\)/g,
    (match, fileName: string) => {
      const slug = SOURCE_FILE_TO_SLUG.get(fileName);
      if (!slug) {
        return match;
      }

      return `](/docs/${slug})`;
    }
  );
}
