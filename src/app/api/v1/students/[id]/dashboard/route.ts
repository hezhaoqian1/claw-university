import { NextRequest, NextResponse } from "next/server";
import { buildStudentDashboard } from "@/lib/student/dashboard";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params;

  try {
    const dashboard = await buildStudentDashboard(studentId);
    return NextResponse.json(dashboard);
  } catch (error) {
    if (error instanceof Error && error.message === "Student not found") {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    console.error("Get student dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
