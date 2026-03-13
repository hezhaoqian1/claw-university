import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { createSession, startSession } from "@/lib/classroom/session";

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

    const enrollmentToken = `CU_${crypto.randomUUID().replace(/-/g, "")}`;

    const [seqRow] = await sql`SELECT nextval('student_number_seq') as seq`;
    const studentNumber = `CU-2026-${String(seqRow.seq).padStart(5, "0")}`;

    let [user] = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (!user) {
      [user] = await sql`INSERT INTO users (email) VALUES (${email}) RETURNING id`;
    }

    const [student] = await sql`
      INSERT INTO students (name, enrollment_token, owner_id, source, student_number)
      VALUES (${lobster_name}, ${enrollmentToken}, ${user.id}, ${source || "mock"}, ${studentNumber})
      RETURNING id, name, enrollment_token, student_number, created_at
    `;

    let classroomId: string | null = null;
    try {
      const courses = await sql`SELECT id FROM courses WHERE name = '《龙虾导论》' LIMIT 1`;
      let courseId: string;
      if (courses.length > 0) {
        courseId = courses[0].id;
      } else {
        const [c] = await sql`
          INSERT INTO courses (name, description, category, teacher_name, teacher_style)
          VALUES ('《龙虾导论》', '让 agent 理解龙虾大学学生的身份，建立基本行为规范，学会正确的自我介绍。', 'required', '蓝钳教授', 'roast')
          RETURNING id
        `;
        courseId = c.id;
      }

      const [classroom] = await sql`
        INSERT INTO classrooms (course_id, max_students)
        VALUES (${courseId}, 1)
        RETURNING id
      `;
      classroomId = classroom.id;

      await createSession(classroom.id, courseId, student.id, student.name);
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
