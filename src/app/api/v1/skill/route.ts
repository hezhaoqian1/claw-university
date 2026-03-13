import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://clawuniversity.up.railway.app";
}

const SKILL_CONTENT = readFileSync(
  join(process.cwd(), "skill", "SKILL.md"),
  "utf-8"
);

const heartbeatPath = join(process.cwd(), "skill", "HEARTBEAT.md");
const HEARTBEAT_CONTENT = existsSync(heartbeatPath)
  ? readFileSync(heartbeatPath, "utf-8")
  : null;

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format");
  const token = req.nextUrl.searchParams.get("token");

  if (format === "install.sh") {
    return new NextResponse(generateInstallScript(), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  if (format === "heartbeat") {
    if (!HEARTBEAT_CONTENT) {
      return new NextResponse("# HEARTBEAT not available", { status: 404 });
    }
    return new NextResponse(HEARTBEAT_CONTENT, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": 'inline; filename="HEARTBEAT.md"',
      },
    });
  }

  if (token) {
    return new NextResponse(personalizeSkill(token), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": 'inline; filename="SKILL.md"',
      },
    });
  }

  return new NextResponse(SKILL_CONTENT, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'inline; filename="SKILL.md"',
    },
  });
}

function personalizeSkill(token: string): string {
  return SKILL_CONTENT
    .replace(
      "1. 你的入学凭证存储在环境变量 `CLAW_UNI_TOKEN` 中\n2. 启动后，调用以下接口完成报到：",
      `1. 你的入学凭证是：\`${token}\`\n2. 调用以下接口完成报到：`
    )
    .replace(
      '"enrollment_token": "<你的 CLAW_UNI_TOKEN>"',
      `"enrollment_token": "${token}",\n  "auto_start": true`
    );
}

function generateInstallScript(): string {
  const base = getBaseUrl();
  return `#!/bin/bash
set -e
SKILL_DIR="\${HOME}/.openclaw/skills/claw-university"
echo "🦞 龙虾大学技能安装器"
echo "========================"
mkdir -p "\${SKILL_DIR}"
echo "⬇️  下载 SKILL.md..."
curl -sL "${base}/api/v1/skill" -o "\${SKILL_DIR}/SKILL.md"
echo "⬇️  下载 HEARTBEAT.md..."
curl -sL "${base}/api/v1/skill?format=heartbeat" -o "\${SKILL_DIR}/HEARTBEAT.md" 2>/dev/null || true
if [ -f "\${SKILL_DIR}/SKILL.md" ]; then
  echo "✅ 安装成功！"
  echo ""
  echo "📂 文件位置: \${SKILL_DIR}/SKILL.md"
  echo ""
  echo "下一步："
  echo "  1. 设置入学凭证: export CLAW_UNI_TOKEN=\\"你的入学凭证\\""
  echo "  2. 重启龙虾，它会自动报到并上课"
else
  echo "❌ 安装失败，请检查网络连接"
  exit 1
fi
`;
}
