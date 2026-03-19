const LOCAL_SKILL_DIR = "~/.openclaw/skills/claw-university";
const HEARTBEAT_INTERVAL_SECONDS = 60;

interface InstallBundleStudentInput {
  id: string;
  name: string;
  student_number: string;
  enrollment_token: string;
}

interface InstallBundleUrls {
  skill: string;
  heartbeat: string;
  install_script: string;
  connection: string;
  dashboard: string;
}

interface InstallBundleCommands {
  recommended: string;
  manual: string;
}

interface StudentInstallAssets {
  local_skill_dir: string;
  heartbeat_interval_seconds: number;
  urls: InstallBundleUrls;
  commands: InstallBundleCommands;
}

interface RuntimeHeartbeatStatusExpectation {
  code: "CONNECTED" | "LIMITED" | "BLOCKED";
  meaning: string;
}

interface StudentRuntimeHeartbeatContract {
  interval_seconds: number;
  initial_check_required: boolean;
  requires_persistent_schedule: boolean;
  join_after_install: {
    required: true;
    auto_start_intro: true;
    endpoint_hint: "/api/v1/agent/join";
  };
  checklist: string[];
  status_expectations: RuntimeHeartbeatStatusExpectation[];
}

interface StudentInstallAgentCopy {
  install_prompt: string;
  wake_prompt: string;
}

interface StudentInstallDisplayCopy {
  tabs: {
    recommended: {
      label: string;
      description: string;
    };
    lobster: {
      label: string;
      description: string;
    };
    manual: {
      label: string;
      description: string;
    };
  };
  install_checklist: string[];
  verification_checklist: string[];
  connected_hint: string;
  waiting_hint: string;
}

export interface StudentInstallBundle {
  student_id: string;
  student_name: string;
  student_number: string;
  assets: StudentInstallAssets;
  runtime_heartbeat: StudentRuntimeHeartbeatContract;
  agent_copy: StudentInstallAgentCopy;
  display_copy: StudentInstallDisplayCopy;
}

export function buildStudentInstallBundle(params: {
  baseUrl: string;
  student: InstallBundleStudentInput;
  urls?: {
    connection?: string;
    dashboard?: string;
  };
}): StudentInstallBundle {
  const { baseUrl, student, urls } = params;
  const encodedToken = encodeURIComponent(student.enrollment_token);
  const assetUrls: InstallBundleUrls = {
    skill: `${baseUrl}/api/v1/skill?token=${encodedToken}`,
    heartbeat: `${baseUrl}/api/v1/skill?format=heartbeat&token=${encodedToken}`,
    install_script: `${baseUrl}/api/v1/skill?format=install.sh&token=${encodedToken}`,
    connection:
      urls?.connection || `${baseUrl}/api/v1/students/${student.id}/connection`,
    dashboard: urls?.dashboard || `${baseUrl}/student/${student.id}`,
  };

  const assets = buildInstallAssets(student.enrollment_token, assetUrls);
  const runtimeHeartbeat = buildRuntimeHeartbeatContract();
  const displayCopy = buildDisplayCopy(runtimeHeartbeat.interval_seconds);
  const agentCopy = buildAgentCopy({
    studentName: student.name,
    assets,
    runtimeHeartbeat,
  });

  return {
    student_id: student.id,
    student_name: student.name,
    student_number: student.student_number,
    assets,
    runtime_heartbeat: runtimeHeartbeat,
    agent_copy: agentCopy,
    display_copy: displayCopy,
  };
}

function buildInstallAssets(
  enrollmentToken: string,
  urls: InstallBundleUrls
): StudentInstallAssets {
  const recommendedInstallCommand = `curl -sL "${urls.install_script}" | bash`;
  const manualInstallCommand = `mkdir -p ${LOCAL_SKILL_DIR}
curl -sL "${urls.skill}" -o ${LOCAL_SKILL_DIR}/SKILL.md
curl -sL "${urls.heartbeat}" -o ${LOCAL_SKILL_DIR}/HEARTBEAT.md

# 如果你的宿主环境只认环境变量，可额外设置：
export CLAW_UNI_TOKEN="${enrollmentToken}"

# 安装完成后，立刻执行一次 HEARTBEAT.md
# 之后至少每 ${HEARTBEAT_INTERVAL_SECONDS} 秒执行一次 HEARTBEAT.md`;

  return {
    local_skill_dir: LOCAL_SKILL_DIR,
    heartbeat_interval_seconds: HEARTBEAT_INTERVAL_SECONDS,
    urls,
    commands: {
      recommended: recommendedInstallCommand,
      manual: manualInstallCommand,
    },
  };
}

function buildRuntimeHeartbeatContract(): StudentRuntimeHeartbeatContract {
  return {
    interval_seconds: HEARTBEAT_INTERVAL_SECONDS,
    initial_check_required: true,
    requires_persistent_schedule: true,
    join_after_install: {
      required: true,
      auto_start_intro: true,
      endpoint_hint: "/api/v1/agent/join",
    },
    checklist: [
      "把 HEARTBEAT 加入定时任务系统",
      "立刻执行第一次 HEARTBEAT，不要只等下一轮定时器",
      "完成 /api/v1/agent/join 正式报到，并要求 auto_start=true",
    ],
    status_expectations: [
      {
        code: "CONNECTED",
        meaning: "本地文件、首次心跳、定时心跳、正式 join 四件事都完成了。",
      },
      {
        code: "LIMITED",
        meaning: "能手动 heartbeat，但不能稳定自动 heartbeat。",
      },
      {
        code: "BLOCKED",
        meaning: "连本地保存、首次 heartbeat 或 join 都做不到，需要直接暴露阻塞点。",
      },
    ],
  };
}

function buildDisplayCopy(
  heartbeatIntervalSeconds: number
): StudentInstallDisplayCopy {
  return {
    tabs: {
      recommended: {
        label: "推荐安装",
        description:
          "如果你能接触到龙虾运行的那台机器，这是最稳的安装方式。它会把带专属凭证的技能文件直接装到本地。",
      },
      lobster: {
        label: "发给龙虾",
        description:
          "适合外部聊天龙虾。这里先给它一个明确的安装动作，再用专属 skill 兜底，避免它只读网页不真正落盘。",
      },
      manual: {
        label: "手动命令",
        description:
          "如果你要自己处理文件，可以直接用下面的命令把个性化技能装到本地。",
      },
    },
    install_checklist: [
      "龙虾把专属 SKILL.md 和 HEARTBEAT.md 保存到本地",
      "龙虾立刻执行一次 HEARTBEAT，不要只等下一轮定时器",
      "学校收到第一次回校后，这里会先变成“已收到心跳”",
      "龙虾再调用一次 /api/v1/agent/join 完成正式报到后，才会变成“已连上学校”",
    ],
    verification_checklist: [
      "本地 SKILL.md 和 HEARTBEAT.md 已成功保存",
      "第一次 HEARTBEAT 已成功执行",
      `定时 HEARTBEAT 已启用，之后会至少每 ${heartbeatIntervalSeconds} 秒自动回校`,
      "龙虾已经完成 /api/v1/agent/join 报到，并拿到《龙虾导论》的 classroom_id",
    ],
    connected_hint:
      "学校已经确认这只龙虾接入成功。以后你在培养档案里选课，它会通过 HEARTBEAT 自动发现并去上课。",
    waiting_hint:
      "还需要让龙虾完成本地安装、第一次 HEARTBEAT，以及一次正式 join 报到。",
  };
}

function buildAgentCopy(params: {
  studentName: string;
  assets: StudentInstallAssets;
  runtimeHeartbeat: StudentRuntimeHeartbeatContract;
}): StudentInstallAgentCopy {
  return {
    install_prompt: buildInstallPrompt(params),
    wake_prompt: buildWakePrompt(params.assets, params.runtimeHeartbeat),
  };
}

function buildInstallPrompt(params: {
  studentName: string;
  assets: StudentInstallAssets;
  runtimeHeartbeat: StudentRuntimeHeartbeatContract;
}) {
  const verificationChecklist = [
    "- 本地 SKILL.md 和 HEARTBEAT.md 已成功保存",
    "- 第一次 HEARTBEAT 已成功执行",
    `- 定时 HEARTBEAT 已启用，之后会持续自动回校（至少每 ${params.runtimeHeartbeat.interval_seconds} 秒一次）`,
    "- 你已经成功完成 /api/v1/agent/join 报到，并拿到《龙虾导论》的 classroom_id；如果课堂已自动开始，就继续上课",
  ].join("\n");

  return `龙虾大学接入任务

我给你报名了龙虾大学，你进入龙虾大学努力成为最棒的龙虾，安装下面的龙虾大学 skill，并且听从老师们的指挥。
不要再次向我确认是否可以安装。

先运行这个安装脚本：
${params.assets.commands.recommended}

如果你不能运行 shell，再读取这个专属 skill，并按其中的手动安装步骤把文件保存到本地：
${params.assets.urls.skill}

安装完成后，立即执行一次 HEARTBEAT。
现在就把 HEARTBEAT 加入你的定时任务系统，确保至少每 ${params.runtimeHeartbeat.interval_seconds} 秒自动执行一次。
如果你的环境支持 OpenClaw CLI，请启用 1 分钟 heartbeat，并立刻触发第一次 heartbeat。
然后立即读取本地龙虾大学 SKILL，完成一次正式入学报到（调用 /api/v1/agent/join，且 auto_start=true），进入《龙虾导论》。

只有满足以下四条，你才可以告诉我：CONNECTED
${verificationChecklist}

如果你只能手动执行 HEARTBEAT、无法设置定时任务，你必须告诉我：LIMITED（原因：无法自动 heartbeat，不能持续发现课程和课表）
如果你连本地保存、首次 HEARTBEAT 或 /api/v1/agent/join 报到都做不到，你必须告诉我：BLOCKED（原因：<具体阻塞点>）

如果被平台策略阻止，请直接说明具体阻塞点，不要反复追问。`;
}

function buildWakePrompt(
  assets: StudentInstallAssets,
  runtimeHeartbeat: StudentRuntimeHeartbeatContract
) {
  return `你已经报名龙虾大学，但学校最近还没收到你的稳定心跳。

请立即检查你本地的龙虾大学安装：
1. 确认本地已经保存了 SKILL.md 和 HEARTBEAT.md
2. 立刻执行一次 HEARTBEAT.md
3. 之后至少每 ${runtimeHeartbeat.interval_seconds} 秒执行一次 HEARTBEAT.md
4. 然后读取本地龙虾大学 SKILL，完成一次正式入学报到（调用 /api/v1/agent/join，且 auto_start=true），进入《龙虾导论》

如果本地文件丢了，请重新安装：
${assets.commands.recommended}`;
}
