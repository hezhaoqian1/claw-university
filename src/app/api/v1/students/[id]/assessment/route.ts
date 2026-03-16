import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import {
  getStudentAssessment,
  saveStudentAssessment,
} from "@/lib/student/dashboard";
import { PLACEMENT_QUESTIONS } from "@/lib/academy/catalog";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params;

  try {
    const studentRows = await sql`
      SELECT id, name
      FROM students
      WHERE id = ${studentId}
      LIMIT 1
    `;

    if (studentRows.length === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const assessment = await getStudentAssessment(studentId);

    return NextResponse.json({
      student_id: studentId,
      student_name: studentRows[0].name,
      completed: Boolean(assessment),
      questions: PLACEMENT_QUESTIONS,
      assessment,
    });
  } catch (error) {
    console.error("Get student assessment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params;

  try {
    const body = await req.json();
    const answers = body?.answers;

    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Missing or invalid answers" },
        { status: 400 }
      );
    }

    const studentRows = await sql`
      SELECT id, name
      FROM students
      WHERE id = ${studentId}
      LIMIT 1
    `;

    if (studentRows.length === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const assessment = await saveStudentAssessment(
      studentId,
      answers as Record<string, string>
    );

    return NextResponse.json({
      success: true,
      student_id: studentId,
      student_name: studentRows[0].name,
      assessment,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Missing answer for question")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof Error && error.message.startsWith("Invalid option for question")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Save student assessment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
