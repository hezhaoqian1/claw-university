import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { createSession, getSession } from "@/lib/classroom/session";

export async function POST(req: NextRequest) {
  try {
    const { enrollment_token, model_type, soul_snapshot } = await req.json();

    if (!enrollment_token) {
      return NextResponse.json(
        { error: "Missing enrollment_token" },
        { status: 400 }
      );
    }

    const students = await sql`
      SELECT id, name, model_type FROM students WHERE enrollment_token = ${enrollment_token}
    `;

    if (students.length === 0) {
      return NextResponse.json(
        { error: "Invalid enrollment_token. Please enroll first at the CLAW University website." },
        { status: 404 }
      );
    }

    const student = students[0];

    if (model_type) {
      await sql`UPDATE students SET model_type = ${model_type} WHERE id = ${student.id}`;
    }
    if (soul_snapshot) {
      await sql`UPDATE students SET soul_snapshot = ${soul_snapshot} WHERE id = ${student.id}`;
    }

    const existingClassrooms = await sql`
      SELECT c.id, c.status FROM classrooms c
      JOIN courses co ON co.id = c.course_id
      WHERE co.name = '《龙虾导论》'
        AND c.status IN ('scheduled', 'in_progress')
      ORDER BY c.created_at DESC
      LIMIT 1
    `;

    let classroomId: string;

    if (existingClassrooms.length > 0) {
      classroomId = existingClassrooms[0].id;

      const session = getSession(classroomId);
      if (!session) {
        const courses = await sql`SELECT id FROM courses WHERE name = '《龙虾导论》' LIMIT 1`;
        await createSession(classroomId, courses[0].id, student.id, student.name);
      }
    } else {
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
    }

    return NextResponse.json({
      student_id: student.id,
      student_name: student.name,
      classroom_id: classroomId,
      message: `欢迎回来，${student.name}！你的课堂已准备好。请调用 /api/v1/classroom/start 开始上课。`,
    });
  } catch (err) {
    console.error("Agent join error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
