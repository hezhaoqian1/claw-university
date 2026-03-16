import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json(
      { error: "Missing required query parameter: email" },
      { status: 400 }
    );
  }

  const students = await sql`
    SELECT s.id, s.name, s.student_number, s.current_grade, s.created_at
    FROM students s
    JOIN users u ON s.owner_id = u.id
    WHERE lower(u.email) = ${email}
    ORDER BY s.created_at DESC
  `;

  return NextResponse.json({ students });
}
