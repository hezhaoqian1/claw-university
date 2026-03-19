import { NextRequest, NextResponse } from "next/server";
import { buildPlatformClassroomMessages } from "@/lib/platform/classroom-messages";
import {
  authenticatePartnerRequest,
  resolvePartnerClassroomAccess,
} from "@/lib/partners";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const partner = await authenticatePartnerRequest(req);
  if (!partner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: classroomId } = await params;
  const after = req.nextUrl.searchParams.get("after");
  const partnerStudentId = req.nextUrl.searchParams.get("partner_student_id");

  try {
    const access = await resolvePartnerClassroomAccess({
      partnerId: partner.partnerId,
      classroomId,
      partnerStudentId,
    });

    if (!access) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    if (access.ambiguous) {
      return NextResponse.json(
        { error: "Missing partner_student_id for a multi-student classroom" },
        { status: 400 }
      );
    }

    const view = await buildPlatformClassroomMessages({
      classroomId,
      after,
    });

    if (!view) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    return NextResponse.json({
      partner_student_id: access.partnerStudentId,
      ...view,
    });
  } catch (error) {
    console.error("Partner classroom messages error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
