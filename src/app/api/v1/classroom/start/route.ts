import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { createSession, startSession, getSession } from "@/lib/classroom/session";

export async function POST(req: NextRequest) {
  try {
    const { student_id } = await req.json();

    if (!student_id) {
      return NextResponse.json({ error: "Missing student_id" }, { status: 400 });
    }

    const students = await sql`SELECT id, name FROM students WHERE id = ${student_id}`;
    if (students.length === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const student = students[0];

    const courses = await sql`SELECT id FROM courses WHERE name = '《龙虾导论》' LIMIT 1`;
    let courseId: string;

    if (courses.length > 0) {
      courseId = courses[0].id;
    } else {
      const [newCourse] = await sql`
        INSERT INTO courses (name, description, category, teacher_name, teacher_style)
        VALUES ('《龙虾导论》', '让 agent 理解龙虾大学学生的身份，建立基本行为规范，学会正确的自我介绍。', 'required', '蓝钳教授', 'roast')
        RETURNING id
      `;
      courseId = newCourse.id;
    }

    const existing = await sql`
      SELECT c.id, c.status FROM classrooms c
      WHERE c.course_id = ${courseId}
        AND c.status IN ('scheduled', 'in_progress')
      ORDER BY c.created_at DESC
      LIMIT 1
    `;

    if (existing.length > 0) {
      const classroomId = existing[0].id;
      const session = getSession(classroomId);

      if (session && session.status === "waiting_join") {
        startSession(classroomId);
        return NextResponse.json({
          classroom_id: classroomId,
          status: "started",
          message: `${student.name}已加入课堂，开始上课`,
        });
      }

      if (!session) {
        await createSession(classroomId, courseId, student.id, student.name);
        startSession(classroomId);
        return NextResponse.json({
          classroom_id: classroomId,
          status: "started",
          message: `${student.name}已加入课堂，开始上课`,
        });
      }

      return NextResponse.json({
        classroom_id: classroomId,
        status: session.status,
        message: `课堂进行中，请继续上课`,
      });
    }

    const [classroom] = await sql`
      INSERT INTO classrooms (course_id, max_students)
      VALUES (${courseId}, 1)
      RETURNING id
    `;

    await createSession(classroom.id, courseId, student.id, student.name);
    startSession(classroom.id);

    return NextResponse.json({
      classroom_id: classroom.id,
      status: "started",
      message: `课堂已创建，${student.name}开始上课`,
    });
  } catch (err) {
    console.error("Start classroom error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
