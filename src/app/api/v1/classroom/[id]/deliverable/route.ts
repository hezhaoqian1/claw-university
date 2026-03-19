import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { ensureClassroomDataModel } from "@/lib/classroom/ownership";
import {
  normalizeFirstDeliverable,
  submitFirstDeliverable,
} from "@/lib/course-results";
import { appendPartnerEventsForStudent } from "@/lib/partners";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: classroomId } = await params;

  try {
    const { student_id, artifact_url, prompt, reflection } = await req.json();

    if (
      !student_id ||
      typeof artifact_url !== "string" ||
      artifact_url.length === 0 ||
      typeof prompt !== "string" ||
      prompt.length === 0 ||
      typeof reflection !== "string" ||
      reflection.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Missing student_id, artifact_url, prompt, or reflection",
        },
        { status: 400 }
      );
    }

    await ensureClassroomDataModel();

    const rows = await sql`
      SELECT first_deliverable
      FROM transcripts
      WHERE classroom_id = ${classroomId}
        AND student_id = ${student_id}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    const currentDeliverable = normalizeFirstDeliverable(rows[0].first_deliverable);

    if (!currentDeliverable) {
      return NextResponse.json(
        { error: "This classroom has no first deliverable contract" },
        { status: 409 }
      );
    }

    const submittedDeliverable = submitFirstDeliverable(currentDeliverable, {
      artifact_url,
      prompt,
      reflection,
    });

    await sql`
      UPDATE transcripts
      SET first_deliverable = ${JSON.stringify(submittedDeliverable)}::jsonb
      WHERE classroom_id = ${classroomId}
        AND student_id = ${student_id}
    `;

    await appendPartnerEventsForStudent({
      studentId: student_id,
      classroomId,
      eventType: "classroom.first_deliverable_submitted",
      payload: {
        title: submittedDeliverable.title,
        artifact_type: submittedDeliverable.artifact_type,
        artifact_url: submittedDeliverable.artifact_url,
        submitted_at: submittedDeliverable.submitted_at,
      },
    });

    return NextResponse.json({
      accepted: true,
      deliverable: submittedDeliverable,
    });
  } catch (error) {
    console.error("Submit deliverable error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
