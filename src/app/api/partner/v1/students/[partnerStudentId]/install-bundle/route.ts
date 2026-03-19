import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/app-url";
import { buildStudentInstallBundle } from "@/lib/platform/install-bundle";
import {
  authenticatePartnerRequest,
  findPartnerStudentById,
} from "@/lib/partners";

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

    const bundle = buildStudentInstallBundle({
      baseUrl: getBaseUrl(req),
      student: {
        id: mapping.student_id as string,
        name: mapping.student_name as string,
        student_number: mapping.student_number as string,
        enrollment_token: mapping.enrollment_token as string,
      },
      urls: {
        connection: `${getBaseUrl(req)}/api/partner/v1/students/${mapping.id}/connection`,
      },
    });

    return NextResponse.json({
      partner_student_id: mapping.id,
      external_student_id: mapping.external_student_id,
      external_user_id: mapping.external_user_id,
      ...bundle,
    });
  } catch (error) {
    console.error("Partner install bundle error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
