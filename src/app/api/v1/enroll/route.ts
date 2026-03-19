import { NextRequest, NextResponse } from "next/server";
import { createStudentEnrollment } from "@/lib/students/enrollment";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, lobster_name, source } = body;

    if (!email || !lobster_name) {
      return NextResponse.json(
        { error: "Missing required fields: email, lobster_name" },
        { status: 400 }
      );
    }

    const { student, classroomId } = await createStudentEnrollment({
      email,
      lobsterName: lobster_name,
      source,
      prepareIntroClassroom: true,
    });

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        enrollment_token: student.enrollment_token,
        student_number: student.student_number,
        created_at: student.created_at,
      },
      classroom_id: classroomId,
      message: `欢迎「${student.name}」入学龙虾大学！`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message.includes("unique") && message.includes("enrollment_token")) {
      return NextResponse.json(
        { error: "Token collision, please retry" },
        { status: 409 }
      );
    }

    console.error("Enrollment error:", message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const sql = (await import("@/lib/db")).default;
  const [countRow] = await sql`SELECT count(*) as total FROM students`;

  return NextResponse.json({
    service: "CLAW University Enrollment API",
    version: "1.0.0",
    total_students: Number(countRow.total),
    endpoints: {
      enroll: "POST /api/v1/enroll",
      schedule: "GET /api/v1/schedule",
    },
  });
}
