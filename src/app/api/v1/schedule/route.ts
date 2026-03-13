import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    courses: [
      {
        id: "lobster-101",
        name: "《龙虾导论》",
        teacher: "蓝钳教授",
        next_class: new Date(Date.now() + 3600000).toISOString(),
        status: "enrollable",
        description:
          "让你理解「龙虾大学学生」的身份，建立基本行为规范，学会正确的自我介绍。",
      },
    ],
    hint: "Use WS /api/v1/classroom/{course_id}/join to join a classroom when class starts",
  });
}
