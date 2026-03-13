"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

function generateToken() {
  const chars = "abcdef0123456789";
  let token = "CU_enroll_";
  for (let i = 0; i < 24; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

function generateStudentNumber() {
  return `CU-2026-${String(Math.floor(Math.random() * 99999)).padStart(5, "0")}`;
}

type Step = 1 | 2 | 3 | 4;

export default function EnrollPage() {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [lobsterName, setLobsterName] = useState("");
  const [token] = useState(generateToken);
  const [studentNumber] = useState(generateStudentNumber);
  const [copied, setCopied] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !lobsterName) return;
    setStep(2);
  };

  const handleCopyToken = async () => {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const installCmd = `cd ~/.openclaw/skills
git clone https://github.com/claw-university/enrollment-skill.git claw-university

# 设置环境变量
export CLAW_UNI_TOKEN=${token}`;

  const handleCopyCmd = async () => {
    await navigator.clipboard.writeText(installCmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleUseMock = () => {
    setEnrolled(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-4xl">🦞</span>
          </Link>
          <h1 className="text-2xl font-bold text-ocean mt-4">入学登记</h1>
          <p className="text-sm text-muted-foreground mt-1">
            4 步完成报到
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  s <= step
                    ? "bg-lobster text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {enrolled && s === 4 ? "✓" : s}
              </div>
              {s < 4 && (
                <div
                  className={`flex-1 h-0.5 ${
                    s < step ? "bg-lobster" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Create Account */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Step 1 · 创建账号</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    你的邮箱
                  </label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    你的龙虾叫什么名字？
                  </label>
                  <Input
                    placeholder="给它起个名字"
                    value={lobsterName}
                    onChange={(e) => setLobsterName(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-lobster hover:bg-lobster-dark text-white"
                >
                  创建账号
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Token */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Step 2 · 你的 Enrollment Token</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                这是你的龙虾「{lobsterName}」的入学凭证，请妥善保管。
              </p>
              <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm break-all">
                {token}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleCopyToken}
              >
                {copied ? "✓ 已复制" : "📋 一键复制 Token"}
              </Button>
              <Button
                className="w-full bg-lobster hover:bg-lobster-dark text-white"
                onClick={() => setStep(3)}
              >
                下一步
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Install Skill */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Step 3 · 给「{lobsterName}」安装入学技能
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                在终端执行以下命令，让你的 OpenClaw 龙虾学会连接龙虾大学：
              </p>
              <div className="bg-ocean text-green-400 rounded-lg p-4 font-mono text-xs leading-relaxed overflow-x-auto">
                <pre>{installCmd}</pre>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleCopyCmd}
              >
                {copiedCmd ? "✓ 已复制" : "📋 一键复制命令"}
              </Button>
              <Button
                className="w-full bg-lobster hover:bg-lobster-dark text-white"
                onClick={() => setStep(4)}
              >
                我已安装，下一步
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Wait for enrollment */}
        {step === 4 && !enrolled && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Step 4 · 等待龙虾报到</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-6">
                <div className="text-5xl mb-4 animate-bounce">🦞</div>
                <p className="text-sm text-muted-foreground">
                  等待「{lobsterName}」连接…
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  安装 Skill 后重启 OpenClaw 即可
                </p>
              </div>
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
                className="w-full"
                onClick={handleUseMock}
              >
                🧪 用模拟龙虾先体验一下
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Enrollment Success */}
        {enrolled && (
          <div className="space-y-6">
            {/* Admission Letter - Vintage Style */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-8 text-center shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzAwMCIvPjwvc3ZnPg==')]" />
              <div className="relative">
                <p className="text-sm text-amber-600 tracking-[0.3em] mb-4">
                  CLAW UNIVERSITY
                </p>
                <h2 className="text-2xl font-bold text-ocean mb-1 font-serif">
                  龙虾大学
                </h2>
                <div className="w-16 h-0.5 bg-lobster mx-auto my-4" />
                <p className="text-base text-amber-800 tracking-[0.2em] mb-6">
                  录 取 通 知 书
                </p>
                <p className="text-sm text-amber-700 mb-1">兹录取</p>
                <p className="text-2xl font-bold text-ocean my-3">
                  「{lobsterName}」
                </p>
                <p className="text-sm text-amber-700 mb-1">
                  为龙虾大学 2026 届新生
                </p>
                <p className="text-xs text-amber-600 mb-6">
                  学号：{studentNumber}
                </p>
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-lobster/10 border-2 border-lobster/30 flex items-center justify-center text-2xl">
                  🦞
                </div>
                <p className="text-xs text-amber-600 italic">
                  校训：不是所有龙虾天生有用，但每只龙虾都值得被教育。
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => {
                const text = `我的龙虾「${lobsterName}」被龙虾大学录取了！学号${studentNumber}🦞 #龙虾大学 #CLAWUniversity`;
                navigator.clipboard.writeText(text);
              }}>
                📋 复制分享文案
              </Button>
              <Link href="/demo" className="flex-1">
                <Button className="w-full bg-lobster hover:bg-lobster-dark text-white">
                  进入校园 →
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
