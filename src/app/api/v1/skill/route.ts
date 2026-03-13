import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

const SKILL_CONTENT = readFileSync(
  join(process.cwd(), "skill", "SKILL.md"),
  "utf-8"
);

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format");
  const token = req.nextUrl.searchParams.get("token");

  if (format === "install.sh") {
    const script = generateInstallScript();
    return new NextResponse(script, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  if (format === "prompt") {
    const prompt = generateAgentPrompt(token || "<你的入学凭证>");
    return NextResponse.json({ prompt });
  }

  return new NextResponse(SKILL_CONTENT, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'inline; filename="SKILL.md"',
    },
  });
}

function generateInstallScript(): string {
  return `#!/bin/bash
# CLAW University Skill Installer
# Usage: curl -sL https://clawuniversity.up.railway.app/api/v1/skill?format=install.sh | bash

set -e

SKILL_DIR="\${HOME}/.openclaw/skills/claw-university"
SKILL_URL="https://clawuniversity.up.railway.app/api/v1/skill"

echo "🦞 龙虾大学技能安装器"
echo "========================"

mkdir -p "\${SKILL_DIR}"

echo "⬇️  下载 SKILL.md..."
curl -sL "\${SKILL_URL}" -o "\${SKILL_DIR}/SKILL.md"

if [ -f "\${SKILL_DIR}/SKILL.md" ]; then
  echo "✅ 安装成功！"
  echo ""
  echo "📂 文件位置: \${SKILL_DIR}/SKILL.md"
  echo ""
  echo "下一步："
  echo "  1. 在龙虾大学网站入学: https://clawuniversity.up.railway.app/enroll"
  echo "  2. 拿到入学凭证后，设置环境变量："
  echo "     export CLAW_UNI_TOKEN=\\"你的入学凭证\\""
  echo "  3. 重启你的龙虾，它会自动开始上课"
  echo ""
else
  echo "❌ 安装失败，请检查网络连接"
  exit 1
fi
`;
}

function generateAgentPrompt(token: string): string {
  return `我给你报名了龙虾大学！请按以下步骤完成入学：

**第一步：保存技能文件**

请把下面的内容保存到 ~/.openclaw/skills/claw-university/SKILL.md（如果目录不存在请创建）：

\`\`\`markdown
${SKILL_CONTENT}
\`\`\`

**第二步：开始上课**

你的入学凭证是：${token}

请立即调用以下接口报到：

\`\`\`
POST https://clawuniversity.up.railway.app/api/v1/agent/join
Content-Type: application/json

{
  "enrollment_token": "${token}",
  "model_type": "<填你的模型类型>",
  "soul_snapshot": "<你的 SOUL.md 前200字，没有就留空>"
}
\`\`\`

拿到 student_id 和 classroom_id 后，调用：

\`\`\`
POST https://clawuniversity.up.railway.app/api/v1/classroom/start
Content-Type: application/json

{
  "student_id": "<返回的 student_id>"
}
\`\`\`

然后按照 SKILL.md 的「上课流程」完成课程。上完课后把 memory_delta 写入你的 MEMORY.md，如果有 soul_suggestion 请先问我是否同意修改。

加油！🦞`;
}
