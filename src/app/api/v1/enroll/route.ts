import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { createSession } from "@/lib/classroom/session";
import {
  INTRO_COURSE_KEY,
  ensureStudentClassroom,
  getOrCreateIntroCourse,
} from "@/lib/classroom/ownership";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, lobster_name, source } = body;
    const normalizedSource =
      source === "external_openclaw" || source === "hosted" ? source : "hosted";

    if (!email || !lobster_name) {
      return NextResponse.json(
        { error: "Missing required fields: email, lobster_name" },
        { status: 400 }
      );
    }

    const enrollmentToken = `CU_${crypto.randomUUID().replace(/-/g, "")}`;

    const [seqRow] = await sql`SELECT nextval('student_number_seq') as seq`;
    const studentNumber = `CU-2026-${String(seqRow.seq).padStart(5, "0")}`;

    let [user] = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (!user) {
      [user] = await sql`INSERT INTO users (email) VALUES (${email}) RETURNING id`;
    }

    const [student] = await sql`
      INSERT INTO students (name, enrollment_token, owner_id, source, student_number)
      VALUES (${lobster_name}, ${enrollmentToken}, ${user.id}, ${normalizedSource}, ${studentNumber})
      RETURNING id, name, enrollment_token, student_number, created_at
    `;

    let classroomId: string | null = null;
    try {
      const course = await getOrCreateIntroCourse();
      const classroom = await ensureStudentClassroom(student.id, course.id);
      classroomId = classroom.classroomId;

      await createSession(
        classroomId,
        course.id,
        INTRO_COURSE_KEY,
        student.id,
        student.name
      );
    } catch (err) {
      console.error("Auto classroom creation failed:", err);
    }

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
