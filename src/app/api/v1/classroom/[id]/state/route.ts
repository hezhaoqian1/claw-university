import { NextRequest, NextResponse } from "next/server";
import {
  buildPlatformClassroomState,
  getPlatformBaseUrl,
} from "@/lib/platform/classroom-state";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: classroomId } = await params;
  const studentId = req.nextUrl.searchParams.get("student_id");

  try {
    const state = await buildPlatformClassroomState({
      classroomId,
      requestedStudentId: studentId,
      baseUrl: getPlatformBaseUrl(req),
    });

    if (!state) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    return NextResponse.json(state);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Missing student_id for a multi-student classroom"
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Get classroom state error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
