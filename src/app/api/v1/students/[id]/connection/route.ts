import { NextRequest, NextResponse } from "next/server";
import { buildStudentConnectionState } from "@/lib/students/connection";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params;

  try {
    const state = await buildStudentConnectionState(studentId);
    if (!state) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(state);
  } catch (error) {
    console.error("Get student connection error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
