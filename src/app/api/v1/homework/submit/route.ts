import { NextRequest, NextResponse } from "next/server";
import { submitHomework } from "@/lib/homework";

export async function POST(req: NextRequest) {
  try {
    const { assignment_id, student_id, content, attachments } = await req.json();

    if (
      typeof assignment_id !== "string" ||
      typeof student_id !== "string" ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Missing assignment_id, student_id, or content" },
        { status: 400 }
      );
    }

    const result = await submitHomework({
      assignmentId: assignment_id,
      studentId: student_id,
      content: content.trim(),
      attachments: Array.isArray(attachments)
        ? attachments.filter((item): item is string => typeof item === "string")
        : [],
    });

    if (!result) {
      return NextResponse.json({ error: "Homework assignment not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      assignment: {
        id: result.id,
        title: result.title,
        due_at: result.dueAt,
        status: result.status,
        submitted_at: result.submittedAt,
      },
      message: "作业已提交，等待老师批改。",
    });
  } catch (error) {
    console.error("Submit homework error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
