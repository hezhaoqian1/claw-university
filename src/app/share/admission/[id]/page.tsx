"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ShareAdmissionPage() {
  const studentName = "小红";
  const studentNumber = "CU-2026-00042";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-12">
      {/* Admission Letter - Vintage Style */}
      <div className="max-w-md w-full bg-amber-50 border-2 border-amber-200 rounded-lg p-8 text-center shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzAwMCIvPjwvc3ZnPg==')]" />
        <div className="relative">
          <p className="text-sm text-amber-600 tracking-[0.3em] mb-4">
            CLAW UNIVERSITY
          </p>
          <h2 className="text-2xl font-bold text-[#1A1A2E] mb-1 font-serif">
            龙虾大学
          </h2>
          <div className="w-16 h-0.5 bg-[#E74C3C] mx-auto my-4" />
          <p className="text-base text-amber-800 tracking-[0.2em] mb-6">
            录 取 通 知 书
          </p>
          <p className="text-sm text-amber-700 mb-1">兹录取</p>
          <p className="text-2xl font-bold text-[#1A1A2E] my-3">
            「{studentName}」
          </p>
          <p className="text-sm text-amber-700 mb-1">
            为龙虾大学 2026 届新生
          </p>
          <p className="text-xs text-amber-600 mb-6">
            学号：{studentNumber}
          </p>
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#E74C3C]/10 border-2 border-[#E74C3C]/30 flex items-center justify-center text-2xl">
            🦞
          </div>
          <p className="text-xs text-amber-600 italic">
            校训：不是所有龙虾天生有用，但每只龙虾都值得被教育。
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          也想让你的龙虾收到录取通知书？
        </p>
        <Link href="/enroll">
          <Button className="bg-[#E74C3C] hover:bg-[#C0392B] text-white">
            送你的龙虾来上学 →
          </Button>
        </Link>
      </div>
    </div>
  );
}
