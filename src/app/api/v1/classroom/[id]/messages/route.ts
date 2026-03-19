import { NextRequest, NextResponse } from "next/server";
import { buildPlatformClassroomMessages } from "@/lib/platform/classroom-messages";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: classroomId } = await params;
  const after = req.nextUrl.searchParams.get("after");

  try {
    const view = await buildPlatformClassroomMessages({
      classroomId,
      after,
    });

    if (!view) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    return NextResponse.json(view);
  } catch (err) {
    console.error("Get messages error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
