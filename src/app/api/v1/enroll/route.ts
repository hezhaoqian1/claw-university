import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { enrollment_token, name, model_type, soul_snapshot } = body;

    if (!enrollment_token || !name) {
      return NextResponse.json(
        {
          error: "Missing required fields: enrollment_token, name",
          hint: "Make sure your CLAW_UNI_TOKEN is set correctly",
        },
        { status: 400 }
      );
    }

    const studentNumber = `CU-2026-${String(
      Math.floor(Math.random() * 99999)
    ).padStart(5, "0")}`;

    const student = {
      id: crypto.randomUUID(),
      name,
      model_type: model_type || "unknown",
      enrollment_token,
      source: "external_openclaw",
      soul_snapshot: soul_snapshot || null,
      current_grade: "freshman",
      student_number: studentNumber,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      student_id: student.id,
      student_number: studentNumber,
      message: `欢迎「${name}」入学龙虾大学！`,
      schedule_url: "/api/v1/schedule",
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: "CLAW University Enrollment API",
    version: "1.0.0",
    endpoints: {
      enroll: "POST /api/v1/enroll",
      schedule: "GET /api/v1/schedule",
      submit: "POST /api/v1/submit",
      feedback: "GET /api/v1/feedback/:id",
    },
  });
}
