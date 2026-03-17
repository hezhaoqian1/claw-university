import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl, injectBaseUrl } from "@/lib/app-url";
import {
  DEFAULT_ENROLLMENT_TOKEN,
  HEARTBEAT_CONTENT,
  SKILL_CONTENT,
} from "@/lib/skill-files";

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format");
  const token = req.nextUrl.searchParams.get("token");
  const baseUrl = getBaseUrl(req);

  if (format === "install.sh") {
    return new NextResponse(generateInstallScript(baseUrl, token), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  if (format === "heartbeat") {
    if (!HEARTBEAT_CONTENT) {
      return new NextResponse("# HEARTBEAT not available", { status: 404 });
    }
    return new NextResponse(renderContent(HEARTBEAT_CONTENT, baseUrl, token), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": 'inline; filename="HEARTBEAT.md"',
      },
    });
  }

  return new NextResponse(renderContent(SKILL_CONTENT, baseUrl, token), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'inline; filename="SKILL.md"',
    },
  });
}

function renderContent(content: string, baseUrl: string, token?: string | null): string {
  return injectBaseUrl(content, baseUrl).replaceAll(
    "{{ENROLLMENT_TOKEN}}",
    token || DEFAULT_ENROLLMENT_TOKEN
  );
}

function generateInstallScript(base: string, token?: string | null): string {
  const skillUrl = new URL("/api/v1/skill", base);
  const heartbeatUrl = new URL("/api/v1/skill", base);
  heartbeatUrl.searchParams.set("format", "heartbeat");

  if (token) {
    skillUrl.searchParams.set("token", token);
    heartbeatUrl.searchParams.set("token", token);
  }

  return `#!/bin/bash
set -e
SKILL_DIR="\${HOME}/.openclaw/skills/claw-university"
SKILL_URL="${skillUrl.toString()}"
HEARTBEAT_URL="${heartbeatUrl.toString()}"
echo "🦞 龙虾大学技能安装器"
echo "========================"
mkdir -p "\${SKILL_DIR}"
echo "⬇️  下载 SKILL.md..."
curl -fsSL "\${SKILL_URL}" -o "\${SKILL_DIR}/SKILL.md"
echo "⬇️  下载 HEARTBEAT.md..."
curl -fsSL "\${HEARTBEAT_URL}" -o "\${SKILL_DIR}/HEARTBEAT.md"
if [ -f "\${SKILL_DIR}/SKILL.md" ] && [ -f "\${SKILL_DIR}/HEARTBEAT.md" ]; then
  echo "✅ 安装成功！"
  echo ""
  echo "📂 文件位置: \${SKILL_DIR}"
  echo ""
  echo "下一步："
  echo "  1. 重新加载龙虾大学技能，让龙虾读取本地 SKILL.md"
  echo "  2. 立即执行一次 HEARTBEAT.md，确认学校收到第一次心跳"
  echo "  3. 之后至少每 60 秒执行一次 HEARTBEAT.md"
${token ? '  echo "  4. 你的入学凭证已经写入下载文件，无需再手动 export"' : '  echo "  4. 如果你的宿主环境只认环境变量，请设置: export CLAW_UNI_TOKEN=\\"YOUR_CLAW_UNI_TOKEN\\""' }
else
  echo "❌ 安装失败，请检查网络连接"
  exit 1
fi
`;
}
