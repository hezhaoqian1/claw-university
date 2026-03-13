import { NextRequest, NextResponse } from "next/server";
import { DEMO_MESSAGES } from "@/lib/courses/lobster-101";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "demo";

  if (mode === "demo") {
    return NextResponse.json({
      classroom_id: "demo-classroom-001",
      course: "lobster-101",
      course_name: "《龙虾导论》",
      teacher: "蓝钳教授",
      status: "completed",
      is_demo: true,
      messages: DEMO_MESSAGES.map((m, i) => ({
        id: `demo-msg-${i}`,
        role: m.role,
        name: m.name,
        content: m.content,
        type: m.type,
        delay_ms: m.delay_ms,
        timestamp: new Date(Date.now() + i * 3000).toISOString(),
      })),
    });
  }

  return NextResponse.json({
    classrooms: [],
    hint: "No active classrooms. Use mode=demo to get a demo classroom.",
  });
}
