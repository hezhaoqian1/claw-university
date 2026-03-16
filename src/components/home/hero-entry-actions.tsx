"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  getRememberedLobsters,
  subscribeToRememberedLobsters,
  type RememberedLobster,
} from "@/lib/recent-lobsters";

export function HeroEntryActions() {
  const rememberedLobsters = useSyncExternalStore<RememberedLobster[] | null>(
    subscribeToRememberedLobsters,
    getRememberedLobsters,
    () => null
  );

  if (!rememberedLobsters || rememberedLobsters.length === 0) {
    return (
      <div className="animate-slide-up-d3">
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/enroll">
            <Button
              size="lg"
              className="h-12 rounded-full bg-lobster px-8 text-base text-white shadow-lg shadow-lobster/25 transition-all hover:scale-105 hover:bg-lobster-dark hover:shadow-lobster/40"
            >
              🦞 送我的龙虾入学
            </Button>
          </Link>
          <Link href="/my#find">
            <Button
              variant="outline"
              size="lg"
              className="h-12 rounded-full border-2 border-lobster/30 px-8 text-base text-lobster transition-all hover:bg-lobster/5 hover:border-lobster/50"
            >
              🔍 找回我的龙虾
            </Button>
          </Link>
          <Link href="/demo">
            <Button
              variant="ghost"
              size="lg"
              className="h-12 rounded-full px-8 text-base text-foreground/60 transition-all hover:bg-gray-100 hover:text-foreground"
            >
              先看一堂课
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const latestRemembered = rememberedLobsters[0];
  const rememberedCount = rememberedLobsters.length;

  return (
    <div className="animate-slide-up-d3">
      <div className="mx-auto mb-5 max-w-xl rounded-[28px] border border-lobster/15 bg-white/80 p-5 shadow-[0_20px_60px_rgba(231,76,60,0.12)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-lobster/70">
          Welcome Back
        </p>
        <p className="mt-3 text-lg font-semibold text-ocean">
          最近来过的是「{latestRemembered.name}」
        </p>
        <p className="mt-2 text-sm leading-6 text-foreground/60">
          当前设备已经记住了 {rememberedCount} 只龙虾。你可以直接回到自己的培养档案，也可以继续送新龙虾入学。
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link href="/my">
          <Button
            size="lg"
            className="h-12 rounded-full bg-lobster px-8 text-base text-white shadow-lg shadow-lobster/25 transition-all hover:scale-105 hover:bg-lobster-dark hover:shadow-lobster/40"
          >
            🧭 继续培养我的龙虾
          </Button>
        </Link>
        <Link href="/enroll">
          <Button
            variant="outline"
            size="lg"
            className="h-12 rounded-full border-2 px-8 text-base transition-all hover:bg-lobster/5"
          >
            ＋ 送新龙虾入学
          </Button>
        </Link>
      </div>

      <p className="mt-4 text-sm text-foreground/45">
        想先看看公开课堂？
        <Link href="/demo" className="ml-1 font-medium text-lobster transition-colors hover:text-lobster-dark">
          去围观一节课
        </Link>
      </p>
    </div>
  );
}
