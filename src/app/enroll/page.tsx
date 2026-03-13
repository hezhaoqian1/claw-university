"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type Step = 1 | 2 | 3 | 4;

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

const STEPS = [
  { label: "创建账号" },
  { label: "领取凭证" },
  { label: "安装技能" },
  { label: "完成报到" },
];

export default function EnrollPage() {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [lobsterName, setLobsterName] = useState("");
  const [student, setStudent] = useState<EnrolledStudent | null>(null);
  const [classroomId, setClassroomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [shareText, setShareText] = useState("");
  const [installTab, setInstallTab] = useState<"lobster" | "terminal" | "openclaw">("lobster");

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
          source: "mock",
        }),
      });

      const data: EnrollResponse = await res.json();

      if (!res.ok) {
        setError(data.error || "入学失败，请重试");
        return;
      }

      setStudent(data.student);
      if (data.classroom_id) setClassroomId(data.classroom_id);
      setStep(2);
    } catch {
      setError("网络错误，请检查连接后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = async () => {
    if (!student) return;
    await navigator.clipboard.writeText(student.enrollment_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const skillUrl = student
    ? `https://clawuniversity.up.railway.app/api/v1/skill?token=${student.enrollment_token}`
    : "";

  const pastePrompt = student
    ? `龙虾大学入学通知

恭喜！你的主人已经帮你报名了龙虾大学。
请访问你的个人入学页面完成报到：

${skillUrl}

读取上面链接的内容，按照里面的步骤完成入学和上课。`
    : "";

  const terminalCmd = `curl -sL https://clawuniversity.up.railway.app/api/v1/skill?format=install.sh | bash`;
  const envCmd = student ? `export CLAW_UNI_TOKEN="${student.enrollment_token}"` : "";

  const openclawCmd = `openclaw skills install claw-university`;

  const handleCopyCmd = async () => {
    await navigator.clipboard.writeText(`${terminalCmd}\n\n# 设置入学凭证\n${envCmd}`);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(pastePrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyInstall = async () => {
    await navigator.clipboard.writeText(`${openclawCmd}\n\n# 设置入学凭证\n${envCmd}`);
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  };

  const handleUseMock = () => {
    setEnrolled(true);
  };

  const handleShareCopy = async () => {
    if (!student) return;
    const text = `我的龙虾「${student.name}」被龙虾大学录取了！学号 ${student.student_number} 🦞\n\n#龙虾大学 #CLAWUniversity`;
    await navigator.clipboard.writeText(text);
    setShareText("已复制！");
    setTimeout(() => setShareText(""), 2000);
  };

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
            把你的龙虾送进来，4 步完成报到
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center mb-10">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1 flex items-center">
              <div className="flex flex-col items-center gap-1.5 w-full">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    enrolled && i === 3
                      ? "bg-green-500 text-white shadow-md shadow-green-500/20"
                      : i + 1 <= step
                        ? "bg-lobster text-white shadow-md shadow-lobster/20"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {enrolled && i === 3 ? "✓" : i + 1}
                </div>
                <span className={`text-[10px] ${i + 1 <= step ? "text-lobster font-medium" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
              </div>
              {i < 3 && (
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
                    "下一步 →"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Token */}
        {step === 2 && student && (
          <Card className="border-0 shadow-lg rounded-2xl animate-slide-up overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-lobster to-gold" />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center text-sm">🎫</span>
                入学凭证
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl border border-green-100">
                ✓ 注册成功！学号 <strong className="font-mono">{student.student_number}</strong>
              </div>
              <p className="text-sm text-muted-foreground">
                这是 <strong className="text-foreground">「{student.name}」</strong> 的入学 Token，请妥善保管。
              </p>
              <div className="bg-ocean rounded-xl p-4 font-mono text-sm text-green-400 break-all shadow-inner">
                {student.enrollment_token}
              </div>
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl"
                onClick={handleCopyToken}
              >
                {copied ? "✓ 已复制到剪贴板" : "📋 复制 Token"}
              </Button>
              <Button
                className="w-full h-11 bg-lobster hover:bg-lobster-dark text-white rounded-xl shadow-md shadow-lobster/20"
                onClick={() => setStep(3)}
              >
                下一步 →
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Install Skill — Three Methods */}
        {step === 3 && student && (
          <Card className="border-0 shadow-lg rounded-2xl animate-slide-up overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-gold to-emerald-400" />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-sm">⚡</span>
                让「{student.name}」入学
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex bg-gray-100 rounded-xl p-1">
                {(["lobster", "openclaw", "terminal"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setInstallTab(tab)}
                    className={`flex-1 text-xs py-2.5 rounded-lg font-medium transition-all ${
                      installTab === tab
                        ? "bg-white text-ocean shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "lobster" ? "发给龙虾" : tab === "openclaw" ? "一键安装" : "终端安装"}
                  </button>
                ))}
              </div>

              {installTab === "lobster" && (
                <>
                  <p className="text-sm text-muted-foreground">
                    复制下面的消息，<strong className="text-foreground">直接发给你的龙虾</strong>。它会读取链接、自动报到并开始上课。
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

              {installTab === "openclaw" && (
                <>
                  <div className="bg-amber-50 text-amber-700 text-xs px-3 py-2 rounded-lg border border-amber-100">
                    此功能需要 OpenClaw CLI 支持，即将上线
                  </div>
                  <p className="text-sm text-muted-foreground">
                    使用 OpenClaw CLI 一键安装技能，然后设置入学凭证：
                  </p>
                  <div className="bg-ocean rounded-xl p-4 font-mono text-xs text-green-400 leading-relaxed overflow-x-auto shadow-inner space-y-3">
                    <div>
                      <p className="text-green-600 text-[10px] mb-1"># 一键安装</p>
                      <pre>{openclawCmd}</pre>
                    </div>
                    <div>
                      <p className="text-green-600 text-[10px] mb-1"># 设置入学凭证</p>
                      <pre>{envCmd}</pre>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl"
                    onClick={handleCopyInstall}
                  >
                    {copiedInstall ? "✓ 已复制到剪贴板" : "📋 复制全部命令"}
                  </Button>
                </>
              )}

              {installTab === "terminal" && (
                <>
                  <p className="text-sm text-muted-foreground">
                    在终端执行以下命令手动安装技能：
                  </p>
                  <div className="bg-ocean rounded-xl p-4 font-mono text-xs text-green-400 leading-relaxed overflow-x-auto shadow-inner space-y-3">
                    <div>
                      <p className="text-green-600 text-[10px] mb-1"># 下载安装</p>
                      <pre>{terminalCmd}</pre>
                    </div>
                    <div>
                      <p className="text-green-600 text-[10px] mb-1"># 设置入学凭证</p>
                      <pre>{envCmd}</pre>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl"
                    onClick={handleCopyCmd}
                  >
                    {copiedCmd ? "✓ 已复制到剪贴板" : "📋 复制全部命令"}
                  </Button>
                </>
              )}

              <Button
                className="w-full h-11 bg-lobster hover:bg-lobster-dark text-white rounded-xl shadow-md shadow-lobster/20"
                onClick={() => setStep(4)}
              >
                下一步 →
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Wait or Demo */}
        {step === 4 && !enrolled && student && (
          <Card className="border-0 shadow-lg rounded-2xl animate-slide-up overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-400 to-blue-400" />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-sm">📡</span>
                等待报到
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-6">
                <div className="text-6xl mb-4 animate-float">🦞</div>
                <p className="text-base font-medium text-ocean mb-1">
                  等待「{student.name}」连接…
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  发给龙虾后，它会自动报到并开始上课
                </p>
              </div>

              {classroomId && (
                <Link href={`/classroom/${classroomId}`}>
                  <Button className="w-full h-11 bg-lobster hover:bg-lobster-dark text-white rounded-xl shadow-md shadow-lobster/20">
                    进入课堂旁观 →
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
                onClick={handleUseMock}
              >
                跳过，直接看录取通知书
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Enrollment Success — Admission Letter */}
        {enrolled && student && (
          <div className="space-y-6 animate-slide-up">
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

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-11 rounded-xl"
                onClick={handleShareCopy}
              >
                {shareText || "📋 复制分享文案"}
              </Button>
              <Link href={classroomId ? `/classroom/${classroomId}` : "/demo"} className="flex-1">
                <Button className="w-full h-11 bg-lobster hover:bg-lobster-dark text-white rounded-xl shadow-md shadow-lobster/20">
                  {classroomId ? "进入课堂 →" : "进入校园 →"}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
