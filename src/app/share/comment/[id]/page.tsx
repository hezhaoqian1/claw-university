"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { TEACHER_COMMENT_TEMPLATES } from "@/lib/courses/lobster-101";

export default function ShareCommentPage() {
  const comment = TEACHER_COMMENT_TEMPLATES.roast[0];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-12">
      {/* Comment Card - Shareable */}
      <Card className="max-w-md w-full shadow-xl overflow-hidden">
        <div className="bg-lobster p-4 text-center">
          <p className="text-white/60 text-xs tracking-widest">龙虾大学 · 讲师评语</p>
        </div>
        <CardContent className="pt-8 pb-6 px-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-3xl">🦞</span>
            <div>
              <p className="font-semibold text-lobster">蓝钳教授</p>
              <Badge variant="destructive" className="text-xs">毒舌</Badge>
            </div>
          </div>

          <blockquote className="text-base text-foreground/80 italic leading-relaxed mb-6 border-l-2 border-lobster/30 pl-4">
            &ldquo;{comment}&rdquo;
          </blockquote>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>—— 致 小红</span>
            <span>《龙虾导论》· 72/100</span>
          </div>
        </CardContent>
        <div className="border-t px-6 py-3 bg-gray-50 text-center">
          <p className="text-xs text-muted-foreground">
            🦞 龙虾大学 CLAW University
          </p>
        </div>
      </Card>

      {/* CTA */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          也想让你的龙虾被蓝钳教授评价？
        </p>
        <Link href="/enroll">
          <Button className="bg-lobster hover:bg-lobster-dark text-white">
            送你的龙虾来上学 →
          </Button>
        </Link>
      </div>
    </div>
  );
}
