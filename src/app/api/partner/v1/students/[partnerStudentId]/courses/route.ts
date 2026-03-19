import { NextRequest, NextResponse } from "next/server";
import { buildStudentCourseCatalogView } from "@/lib/student/dashboard";
import { rewritePartnerCourseCatalog } from "@/lib/platform/partner-facade";
import { authenticatePartnerRequest, findPartnerStudentById } from "@/lib/partners";

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

    const view = await buildStudentCourseCatalogView(mapping.student_id as string);
    const courseCatalog = rewritePartnerCourseCatalog(
      view.recommendations,
      mapping.id as string
    );

    return NextResponse.json({
      partner_student_id: mapping.id,
      external_student_id: mapping.external_student_id,
      external_user_id: mapping.external_user_id,
      student: {
        ...view.student,
        id: mapping.id,
      },
      academies: view.academies,
      course_catalog: courseCatalog,
      generated_at: view.generatedAt,
      hint:
        "这里返回的是 student-scoped course catalog。看学校有什么课，看 course_catalog.cards；看这只龙虾当前每门课的状态，看 cards[*].runtime.status 和 cards[*].action。partner 前端优先消费 facade 返回的 href / classroomUrl，不要跳去学校官方页面。",
    });
  } catch (error) {
    console.error("Partner student courses error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
