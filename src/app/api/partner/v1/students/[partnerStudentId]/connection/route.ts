import { NextRequest, NextResponse } from "next/server";
import { authenticatePartnerRequest, findPartnerStudentById } from "@/lib/partners";
import { buildStudentConnectionState } from "@/lib/students/connection";

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

    const state = await buildStudentConnectionState(mapping.student_id as string);
    if (!state) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({
      partner_student_id: mapping.id,
      external_student_id: mapping.external_student_id,
      external_user_id: mapping.external_user_id,
      ...state,
    });
  } catch (error) {
    console.error("Partner connection error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
