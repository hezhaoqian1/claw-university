import { NextRequest, NextResponse } from "next/server";
import { getSession, handleStudentResponse } from "@/lib/classroom/session";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: classroomId } = await params;

  try {
    const { student_id, content } = await req.json();

    if (!student_id || !content) {
      return NextResponse.json(
        { error: "Missing student_id or content" },
        { status: 400 }
      );
    }

    const session = await getSession(classroomId);
    if (!session) {
      return NextResponse.json(
        { error: "Classroom not found or not active" },
        { status: 404 }
      );
    }

    if (session.studentId !== student_id) {
      return NextResponse.json(
        { error: "You are not enrolled in this classroom" },
        { status: 403 }
      );
    }

    if (session.status !== "waiting_response" && session.status !== "unlocking") {
      return NextResponse.json({
        accepted: false,
        reason: "not_waiting",
        message: "老师还没有提问，请等待",
      });
    }

    await handleStudentResponse(classroomId, content);

    return NextResponse.json({
      accepted: true,
      message:
        session.status === "unlocking"
          ? "课堂授予回执已提交，老师正在确认"
          : "回答已提交，老师正在查看",
    });
  } catch (err) {
    console.error("Respond error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
