import { NextRequest, NextResponse } from "next/server";
import {
  appendPartnerEvent,
  authenticatePartnerRequest,
  findPartnerStudentById,
} from "@/lib/partners";
import { enrollStudentInLiveCourse } from "@/lib/courses/enrollment";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ partnerStudentId: string }> }
) {
  const partner = await authenticatePartnerRequest(req);
  if (!partner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { partnerStudentId } = await params;

  try {
    const mapping = await findPartnerStudentById(partner.partnerId, partnerStudentId);
    if (!mapping) {
      return NextResponse.json({ error: "Partner student not found" }, { status: 404 });
    }

    const body = await req.json();
    const courseKey = typeof body?.course_key === "string" ? body.course_key.trim() : "";
    if (!courseKey) {
      return NextResponse.json({ error: "Missing course_key" }, { status: 400 });
    }

    const result = await enrollStudentInLiveCourse({
      studentId: mapping.student_id as string,
      courseKey,
    });

    if (result.error === "Unknown course_key") {
      return NextResponse.json({ error: "Unknown course_key" }, { status: 400 });
    }

    if (result.error === "Student not found") {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    await appendPartnerEvent({
      partnerId: partner.partnerId,
      partnerStudentId: mapping.id as string,
      studentId: mapping.student_id as string,
      classroomId: result.classroomId,
      eventType: "course.enrolled",
      payload: {
        course_key: courseKey,
        course_name: result.courseName,
        classroom_id: result.classroomId,
        status: result.status,
      },
    });

    return NextResponse.json({
      partner_student_id: mapping.id,
      classroom_id: result.classroomId,
      status: result.status,
      course_name: result.courseName,
      classroom_url: `/classroom/${result.classroomId}`,
      classroom_state_url: `/api/partner/v1/classrooms/${result.classroomId}/state`,
    });
  } catch (error) {
    console.error("Partner enroll course error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
