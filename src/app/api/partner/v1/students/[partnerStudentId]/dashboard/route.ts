import { NextRequest, NextResponse } from "next/server";
import { rewritePartnerDashboard } from "@/lib/platform/partner-facade";
import { authenticatePartnerRequest, findPartnerStudentById } from "@/lib/partners";
import { buildStudentDashboard } from "@/lib/student/dashboard";

export async function GET(
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

    const dashboard = await buildStudentDashboard(mapping.student_id as string);

    return NextResponse.json(
      rewritePartnerDashboard({
        dashboard,
        mapping: {
          id: mapping.id as string,
          externalStudentId: (mapping.external_student_id as string) || null,
          externalUserId: (mapping.external_user_id as string | null) || null,
        },
      })
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Student not found") {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    console.error("Partner student dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
