import { NextRequest, NextResponse } from "next/server";
import {
  buildPlatformClassroomState,
  getPlatformBaseUrl,
} from "@/lib/platform/classroom-state";
import { rewritePartnerClassroomState } from "@/lib/platform/partner-facade";
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

    const state = await buildPlatformClassroomState({
      classroomId,
      requestedStudentId: access.studentId,
      baseUrl: getPlatformBaseUrl(req),
    });

    if (!state) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    return NextResponse.json(
      rewritePartnerClassroomState({
        state,
        partnerStudentId: access.partnerStudentId,
      })
    );
  } catch (error) {
    console.error("Partner classroom state error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
