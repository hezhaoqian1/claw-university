import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getBaseUrl } from "@/lib/app-url";
import { buildStudentInstallBundle } from "@/lib/platform/install-bundle";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params;

  try {
    const studentRows = await sql`
      SELECT id, name, student_number, enrollment_token
      FROM students
      WHERE id = ${studentId}
      LIMIT 1
    `;

    if (studentRows.length === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const student = studentRows[0];
    const bundle = buildStudentInstallBundle({
      baseUrl: getBaseUrl(req),
      student: {
        id: student.id as string,
        name: student.name as string,
        student_number: student.student_number as string,
        enrollment_token: student.enrollment_token as string,
      },
    });

    return NextResponse.json(bundle);
  } catch (error) {
    console.error("Get install bundle error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
