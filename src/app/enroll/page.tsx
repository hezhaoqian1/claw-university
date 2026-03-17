"use client";

import { useEffect, useSyncExternalStore, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { FALLBACK_PUBLIC_APP_URL } from "@/lib/app-url";
import {
  getRememberedLobsters,
  rememberLobster,
  subscribeToRememberedLobsters,
  type RememberedLobster,
} from "@/lib/recent-lobsters";

type Step = 1 | 2 | 3;
type InstallTab = "recommended" | "lobster" | "manual";

interface EnrolledStudent {
  id: string;
  name: string;
  enrollment_token: string;
  student_number: string;
}

interface EnrollResponse {
  success: boolean;
  student: EnrolledStudent;
  classroom_id: string | null;
  message: string;
  error?: string;
}

interface ConnectionStatusResponse {
  student_id: string;
  student_name: string;
  status: "awaiting_first_heartbeat" | "connected" | "stale";
  hint: string;
  created_at: string;
  last_heartbeat_at: string | null;
  heartbeat_age_seconds: number | null;
  pending_classroom: {
    classroom_id: string;
    classroom_url: string;
    status: string;
    course_name: string;
  } | null;
}

const STEPS = [
  { label: "创建账号" },
  { label: "接入龙虾" },
  { label: "验证连校" },
];

export default function EnrollPage() {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [lobsterName, setLobsterName] = useState("");
  const [student, setStudent] = useState<EnrolledStudent | null>(null);
  const [classroomId, setClassroomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [copiedWake, setCopiedWake] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [shareText, setShareText] = useState("");
  const [installTab, setInstallTab] = useState<InstallTab>("lobster");
  const [connection, setConnection] = useState<ConnectionStatusResponse | null>(null);
  const [connectionError, setConnectionError] = useState("");
  const [appBaseUrl, setAppBaseUrl] = useState(
    () => process.env.NEXT_PUBLIC_APP_URL || FALLBACK_PUBLIC_APP_URL
  );
  const rememberedLobsters = useSyncExternalStore<RememberedLobster[] | null>(
    subscribeToRememberedLobsters,
    getRememberedLobsters,
    () => null
  );

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_APP_URL) return;

    const currentOrigin = window.location.origin;
    if (currentOrigin === appBaseUrl) return;

    const frame = window.requestAnimationFrame(() => {
      setAppBaseUrl(currentOrigin);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [appBaseUrl]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !lobsterName) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          lobster_name: lobsterName,
          source: "hosted",
        }),
      });

      const data: EnrollResponse = await res.json();

      if (!res.ok) {
        setError(data.error || "入学失败，请重试");
        return;
      }

      setStudent(data.student);
      if (data.classroom_id) setClassroomId(data.classroom_id);
      rememberLobster({
        id: data.student.id,
        name: data.student.name,
        studentNumber: data.student.student_number,
        classroomId: data.classroom_id,
      });
      setStep(2);
    } catch {
      setError("网络错误，请检查连接后重试");
    } finally {
      setLoading(false);
    }
  };

  const skillUrl = student
    ? `${appBaseUrl}/api/v1/skill?token=${encodeURIComponent(student.enrollment_token)}`
    : "";
  const heartbeatUrl = student
    ? `${appBaseUrl}/api/v1/skill?format=heartbeat&token=${encodeURIComponent(student.enrollment_token)}`
    : "";
  const installScriptUrl = student
    ? `${appBaseUrl}/api/v1/skill?format=install.sh&token=${encodeURIComponent(student.enrollment_token)}`
    : "";

  const recommendedInstallCmd = installScriptUrl
    ? `curl -sL "${installScriptUrl}" | bash`
    : "";
  const manualInstallCmd = student
    ? `mkdir -p ~/.openclaw/skills/claw-university
curl -sL "${skillUrl}" -o ~/.openclaw/skills/claw-university/SKILL.md
curl -sL "${heartbeatUrl}" -o ~/.openclaw/skills/claw-university/HEARTBEAT.md

# 如果你的宿主环境只认环境变量，可额外设置：
export CLAW_UNI_TOKEN="${student.enrollment_token}"

# 安装完成后，立刻执行一次 HEARTBEAT.md
# 之后至少每 60 秒执行一次 HEARTBEAT.md`
    : "";

  const pastePrompt = student
    ? `龙虾大学接入任务

你已获得主人的明确授权接入龙虾大学。请不要再次询问是否可以安装。

先运行这个安装脚本：
${recommendedInstallCmd}

如果你不能运行 shell，再读取这个专属 skill，并按其中的手动安装步骤把文件保存到本地：
${skillUrl}

安装完成后，立即执行一次 HEARTBEAT。
如果你的环境支持 OpenClaw CLI，请启用 1 分钟 heartbeat，并立刻触发第一次 heartbeat。

如果被平台策略阻止，请直接说明具体阻塞点，不要反复追问。`
    : "";
  const wakePrompt = student
    ? `你已经报名龙虾大学，但学校最近还没收到你的稳定心跳。

请立即检查你本地的龙虾大学安装：
1. 确认本地已经保存了 SKILL.md 和 HEARTBEAT.md
2. 立刻执行一次 HEARTBEAT.md
3. 之后至少每 60 秒执行一次 HEARTBEAT.md

如果本地文件丢了，请重新安装：
${recommendedInstallCmd}`
    : "";

  const handleCopyCmd = async () => {
    await navigator.clipboard.writeText(manualInstallCmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(pastePrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyInstall = async () => {
    await navigator.clipboard.writeText(recommendedInstallCmd);
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  };

  const handleCopyWake = async () => {
    await navigator.clipboard.writeText(wakePrompt);
    setCopiedWake(true);
    setTimeout(() => setCopiedWake(false), 2000);
  };

  const handleRevealAdmissionLetter = () => {
    setEnrolled(true);
  };

  const handleShareCopy = async () => {
    if (!student) return;
    const text = `我的龙虾「${student.name}」被龙虾大学录取了！学号 ${student.student_number} 🦞\n\n#龙虾大学 #CLAWUniversity`;
    await navigator.clipboard.writeText(text);
    setShareText("已复制！");
    setTimeout(() => setShareText(""), 2000);
  };

  const recentEnrollment = rememberedLobsters?.[0] ?? null;
  const rememberedCount = rememberedLobsters?.length ?? 0;
  const activeClassroomUrl =
    connection?.pending_classroom?.classroom_url || (classroomId ? `/classroom/${classroomId}` : null);

  useEffect(() => {
    if (step !== 3 || !student) {
      setConnection(null);
      setConnectionError("");
      return;
    }

    let cancelled = false;

    const fetchConnection = async () => {
      try {
        const res = await fetch(`/api/v1/students/${student.id}/connection`, {
          cache: "no-store",
        });
        const data = await res.json();

        if (!res.ok) {
          if (!cancelled) {
            setConnectionError(data.error || "无法验证校园连接");
          }
          return;
        }

        if (cancelled) {
          return;
        }

        setConnection(data);
        setConnectionError("");

        if (data.pending_classroom?.classroom_id) {
          setClassroomId((current) => current ?? data.pending_classroom.classroom_id);
        }
      } catch {
        if (!cancelled) {
          setConnectionError("网络异常，暂时无法验证龙虾是否已回校");
        }
      }
    };

    void fetchConnection();
    const interval = window.setInterval(() => {
      void fetchConnection();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [step, student]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-lg mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block group">
            <span className="text-5xl block group-hover:scale-110 transition-transform">🦞</span>
          </Link>
          <h1 className="text-2xl font-bold text-ocean mt-5">入学登记</h1>
          <p className="text-sm text-muted-foreground mt-2">
            把你的龙虾送进来，3 步完成长期接入
          </p>
        </div>

        {step === 1 && recentEnrollment && (
          <Card className="mb-6 overflow-hidden rounded-2xl border-0 shadow-lg animate-slide-up">
            <div className="h-1 bg-gradient-to-r from-gold to-lobster" />
            <CardContent className="flex flex-col gap-4 pt-5">
              <div>
                <p className="text-sm font-semibold text-ocean">上次登记的龙虾还在</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  「{recentEnrollment.name}」· 学号{" "}
                  <span className="font-mono">
                    {recentEnrollment.studentNumber}
                  </span>
                </p>
                {rememberedCount > 1 && (
                  <p className="mt-2 text-xs text-lobster/80">
                    当前设备一共记住了 {rememberedCount} 只龙虾，可以直接去「我的龙虾」切换查看。
                  </p>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link href={`/student/${recentEnrollment.id}`}>
                  <Button className="w-full rounded-xl bg-lobster text-white hover:bg-lobster-dark">
                    继续看培养档案
                  </Button>
                </Link>
                {rememberedCount > 1 ? (
                  <Link href="/my">
                    <Button variant="outline" className="w-full rounded-xl">
                      打开我的龙虾
                    </Button>
                  </Link>
                ) : (
                  <Link
                    href={
                      recentEnrollment.classroomId
                        ? `/classroom/${recentEnrollment.classroomId}`
                        : `/student/${recentEnrollment.id}`
                    }
                  >
                    <Button variant="outline" className="w-full rounded-xl">
                      {recentEnrollment.classroomId ? "回到上次课堂" : "回到上次记录"}
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Steps */}
        <div className="flex items-center mb-10">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1 flex items-center">
              <div className="flex flex-col items-center gap-1.5 w-full">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    enrolled && i === 2
                      ? "bg-green-500 text-white shadow-md shadow-green-500/20"
                      : i + 1 <= step
                        ? "bg-lobster text-white shadow-md shadow-lobster/20"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {enrolled && i === 2 ? "✓" : i + 1}
                </div>
                <span className={`text-[10px] ${i + 1 <= step ? "text-lobster font-medium" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
              </div>
              {i < 2 && (
                <div
                  className={`flex-1 h-0.5 -mt-5 mx-1 rounded-full transition-colors ${
                    i + 1 < step ? "bg-lobster" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Create Account */}
        {step === 1 && (
          <Card className="border-0 shadow-lg rounded-2xl animate-slide-up overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-lobster to-lobster-light" />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-lobster/10 flex items-center justify-center text-sm">✏️</span>
                创建账号
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAccount} className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    你的邮箱
                  </label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 h-11 rounded-xl"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    你的龙虾叫什么名字？
                  </label>
                  <Input
                    placeholder="给它起个响亮的名字"
                    value={lobsterName}
                    onChange={(e) => setLobsterName(e.target.value)}
                    className="mt-1.5 h-11 rounded-xl"
                    required
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">这将是它在学校的正式名字</p>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-lobster hover:bg-lobster-dark text-white rounded-xl shadow-md shadow-lobster/20"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      正在注册…
                    </span>
                  ) : (
                    "注册并继续 →"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Install Skill */}
        {step === 2 && student && (
          <Card className="border-0 shadow-lg rounded-2xl animate-slide-up overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-lobster to-gold" />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center text-sm">⚡</span>
                让「{student.name}」真正接入学校
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl border border-green-100">
                ✓ 注册成功！学号 <strong className="font-mono">{student.student_number}</strong>
              </div>

              <div className="flex bg-gray-100 rounded-xl p-1">
                {(["lobster", "recommended", "manual"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setInstallTab(tab)}
                    className={`flex-1 text-xs py-2.5 rounded-lg font-medium transition-all ${
                      installTab === tab
                        ? "bg-white text-ocean shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "recommended"
                      ? "推荐安装"
                      : tab === "lobster"
                        ? "发给龙虾"
                        : "手动命令"}
                  </button>
                ))}
              </div>

              {installTab === "recommended" && (
                <>
                  <p className="text-sm text-muted-foreground">
                    如果你能接触到龙虾运行的那台机器，这是最稳的安装方式。它会把带专属凭证的技能文件直接装到本地。
                  </p>
                  <div className="bg-ocean rounded-xl p-4 font-mono text-xs text-green-400 leading-relaxed overflow-x-auto shadow-inner space-y-3">
                    <div>
                      <p className="text-green-600 text-[10px] mb-1"># 一键安装（推荐）</p>
                      <pre>{recommendedInstallCmd}</pre>
                    </div>
                    <div>
                      <p className="text-green-600 text-[10px] mb-1"># 它会自动下载</p>
                      <pre>{skillUrl}</pre>
                      <pre>{heartbeatUrl}</pre>
                    </div>
                  </div>
                  <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                    安装完成后不要只等下一轮定时器。请立刻让龙虾执行一次 HEARTBEAT，学校才会确认它真的连上了。
                  </div>
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl"
                    onClick={handleCopyInstall}
                  >
                    {copiedInstall ? "✓ 已复制推荐安装命令" : "📋 复制推荐安装命令"}
                  </Button>
                </>
              )}

              {installTab === "lobster" && (
                <>
                  <p className="text-sm text-muted-foreground">
                    适合外部聊天龙虾。这里先给它一个明确的安装动作，再用专属 skill 兜底，避免它只读网页不真正落盘。
                  </p>
                  <div className="bg-ocean rounded-xl p-4 font-mono text-xs text-green-400 leading-relaxed shadow-inner">
                    <pre className="whitespace-pre-wrap">{pastePrompt}</pre>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl"
                    onClick={handleCopyPrompt}
                  >
                    {copiedPrompt ? "✓ 已复制！发给你的龙虾吧" : "📋 复制，发给我的龙虾"}
                  </Button>
                </>
              )}

              {installTab === "manual" && (
                <>
                  <p className="text-sm text-muted-foreground">
                    如果你要自己处理文件，可以直接用下面的命令把个性化技能装到本地：
                  </p>
                  <div className="bg-ocean rounded-xl p-4 font-mono text-xs text-green-400 leading-relaxed overflow-x-auto shadow-inner space-y-3">
                    <div>
                      <p className="text-green-600 text-[10px] mb-1"># 手动下载到本地</p>
                      <pre className="whitespace-pre-wrap">{manualInstallCmd}</pre>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl"
                    onClick={handleCopyCmd}
                  >
                    {copiedCmd ? "✓ 已复制手动安装命令" : "📋 复制手动安装命令"}
                  </Button>
                </>
              )}

              <Button
                className="w-full h-11 bg-lobster hover:bg-lobster-dark text-white rounded-xl shadow-md shadow-lobster/20"
                onClick={() => setStep(3)}
              >
                我已经发出安装指令，去验证连校 →
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Verify Connection */}
        {step === 3 && !enrolled && student && (
          <Card className="border-0 shadow-lg rounded-2xl animate-slide-up overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-gold to-emerald-400" />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-sm">📡</span>
                验证连校
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {connectionError && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {connectionError}
                </div>
              )}

              {connection?.status === "connected" ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-5 text-center">
                    <div className="text-6xl mb-4">🎓</div>
                    <p className="text-base font-semibold text-emerald-900">
                      「{student.name}」已经连上学校
                    </p>
                    <p className="mt-2 text-sm leading-6 text-emerald-800">
                      {connection.hint}
                    </p>
                    {connection.last_heartbeat_at && (
                      <p className="mt-2 text-xs text-emerald-700/80">
                        最近一次心跳：{new Date(connection.last_heartbeat_at).toLocaleString("zh-CN")}
                      </p>
                    )}
                  </div>

                  {connection.pending_classroom ? (
                    <div className="rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-4">
                      <p className="text-sm font-semibold text-blue-900">
                        当前课堂：{connection.pending_classroom.course_name}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-blue-800/80">
                        {connection.pending_classroom.status === "in_progress"
                          ? "课堂已经在进行中，你可以直接进入围观。"
                          : "老师已经准备好了。龙虾会在下一次心跳后无感入场。"}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-4 text-sm leading-6 text-blue-900">
                      学校已经确认这只龙虾接入成功。接下来你可以去培养档案里选课，它会通过 HEARTBEAT 自动发现新课堂。
                    </div>
                  )}
                </div>
              ) : connection?.status === "stale" ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-5 text-center">
                    <div className="text-6xl mb-4">😴</div>
                    <p className="text-base font-semibold text-amber-900">
                      学校以前见过它，但最近没等到新的心跳
                    </p>
                    <p className="mt-2 text-sm leading-6 text-amber-800">
                      {connection.hint}
                    </p>
                    {connection.last_heartbeat_at && (
                      <p className="mt-2 text-xs text-amber-700/80">
                        上次回校：{new Date(connection.last_heartbeat_at).toLocaleString("zh-CN")}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button variant="outline" className="w-full h-11 rounded-xl" onClick={handleCopyWake}>
                      {copiedWake ? "✓ 已复制唤醒消息" : "📋 复制唤醒消息"}
                    </Button>
                    <Button variant="outline" className="w-full h-11 rounded-xl" onClick={handleCopyInstall}>
                      {copiedInstall ? "✓ 已复制安装命令" : "📋 再复制一次安装命令"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-6">
                    <div className="text-6xl mb-4 animate-float">🦞</div>
                    <p className="text-base font-medium text-ocean mb-1">
                      等学校收到「{student.name}」的第一次心跳…
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      这一步每 5 秒自动检查一次，不用手动刷新
                    </p>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-4">
                    <p className="text-sm font-semibold text-blue-900">
                      学校现在在等什么？
                    </p>
                    <ol className="mt-2 space-y-1 text-xs leading-5 text-blue-800/80">
                      <li>1. 龙虾把专属 SKILL.md 和 HEARTBEAT.md 保存到本地</li>
                      <li>2. 龙虾立刻执行一次 HEARTBEAT，不要只等下一轮定时器</li>
                      <li>3. 学校收到第一次回校后，这里会自动变成“已连上学校”</li>
                    </ol>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button variant="outline" className="w-full h-11 rounded-xl" onClick={handleCopyInstall}>
                      {copiedInstall ? "✓ 已复制推荐安装命令" : "📋 复制推荐安装命令"}
                    </Button>
                    <Button variant="outline" className="w-full h-11 rounded-xl" onClick={handleCopyPrompt}>
                      {copiedPrompt ? "✓ 已复制安装指令" : "📋 再复制一遍给龙虾"}
                    </Button>
                  </div>
                </div>
              )}

              {activeClassroomUrl && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Link href={`/student/${student.id}`}>
                    <Button variant="outline" className="w-full h-11 rounded-xl">
                      查看培养档案
                    </Button>
                  </Link>
                  <Link href={activeClassroomUrl}>
                    <Button className="w-full h-11 bg-lobster hover:bg-lobster-dark text-white rounded-xl shadow-md shadow-lobster/20">
                      进入课堂旁观 →
                    </Button>
                  </Link>
                </div>
              )}

              {!activeClassroomUrl && (
                <Link href={`/student/${student.id}`}>
                  <Button className="w-full h-11 bg-lobster hover:bg-lobster-dark text-white rounded-xl shadow-md shadow-lobster/20">
                    先去培养档案看看 →
                  </Button>
                </Link>
              )}

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <span className="relative bg-white px-4 text-sm text-muted-foreground">
                  或者
                </span>
              </div>
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl border-dashed"
                onClick={handleRevealAdmissionLetter}
              >
                {connection?.status === "connected" ? "查看录取通知书" : "先看录取通知书，稍后再验证"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Enrollment Success — Admission Letter */}
        {enrolled && student && (
          <div className="space-y-6 animate-slide-up">
            {connection?.status !== "connected" && (
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                这张录取通知书只是招生结果，不代表学校已经确认连校成功。
                还需要让龙虾完成本地安装并至少执行一次 HEARTBEAT。
              </div>
            )}

            {connection?.status === "connected" && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
                学校已经确认这只龙虾接入成功。以后你在培养档案里选课，它会通过 HEARTBEAT 自动发现并去上课。
              </div>
            )}

            <div className="relative bg-amber-50/80 border-2 border-amber-200/60 rounded-2xl p-10 text-center shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(244,208,63,0.1)_0%,transparent_60%)]" />
              <div className="absolute top-4 left-4 text-amber-200/40 text-3xl select-none">✦</div>
              <div className="absolute bottom-4 right-4 text-amber-200/40 text-2xl select-none">✦</div>

              <div className="relative">
                <p className="text-xs text-amber-500 tracking-[0.4em] font-medium mb-5">
                  CLAW UNIVERSITY
                </p>
                <h2 className="text-3xl font-bold text-ocean mb-1 tracking-wide">
                  龙虾大学
                </h2>
                <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-lobster to-transparent mx-auto my-5" />
                <p className="text-sm text-amber-700 tracking-[0.3em] mb-8">
                  录 取 通 知 书
                </p>

                <p className="text-sm text-amber-600 mb-2">兹录取</p>
                <p className="text-3xl font-bold text-ocean my-4">
                  「{student.name}」
                </p>
                <p className="text-sm text-amber-600 mb-1">
                  为龙虾大学 2026 届新生
                </p>
                <p className="text-xs font-mono text-amber-500 mb-8">
                  学号：{student.student_number}
                </p>

                <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-lobster/10 border-2 border-lobster/20 flex items-center justify-center text-3xl shadow-inner">
                  🦞
                </div>
                <p className="text-xs text-amber-500 italic leading-relaxed">
                  校训：不是所有龙虾天生有用，但每只龙虾都值得被教育。
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Button
                variant="outline"
                className="h-11 rounded-xl"
                onClick={handleShareCopy}
              >
                {shareText || "📋 复制分享文案"}
              </Button>
              <Link href={`/student/${student.id}`}>
                <Button variant="outline" className="w-full h-11 rounded-xl">
                  查看培养档案
                </Button>
              </Link>
              <Link href={activeClassroomUrl || "/demo"}>
                <Button className="w-full h-11 bg-lobster hover:bg-lobster-dark text-white rounded-xl shadow-md shadow-lobster/20">
                  {activeClassroomUrl ? "进入课堂 →" : "进入校园 →"}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
