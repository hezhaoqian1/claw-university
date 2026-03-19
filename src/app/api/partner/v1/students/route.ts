import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/app-url";
import { buildStudentInstallBundle } from "@/lib/platform/install-bundle";
import { rewritePartnerInstallBundle } from "@/lib/platform/partner-facade";
import {
  appendPartnerEvent,
  authenticatePartnerRequest,
  createPartnerStudentMapping,
  findPartnerStudentByExternalId,
} from "@/lib/partners";
import { createStudentEnrollment } from "@/lib/students/enrollment";

export async function POST(req: NextRequest) {
  const partner = await authenticatePartnerRequest(req);
  if (!partner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const externalStudentId =
      typeof body?.external_student_id === "string"
        ? body.external_student_id.trim()
        : "";
    const externalUserIdRaw =
      typeof body?.external_user_id === "string"
        ? body.external_user_id.trim()
        : "";
    const externalUserId = externalUserIdRaw || null;
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const lobsterName =
      typeof body?.lobster_name === "string" ? body.lobster_name.trim() : "";
    const source = body?.source;

    if (!externalStudentId || !lobsterName) {
      return NextResponse.json(
        { error: "Missing external_student_id or lobster_name" },
        { status: 400 }
      );
    }

    const baseUrl = getBaseUrl(req);
    const normalizedEmail =
      email ||
      buildPartnerSyntheticEmail({
        partnerSlug: partner.partnerSlug,
        stableExternalKey: externalUserId || externalStudentId,
      });
    const existing = await findPartnerStudentByExternalId(
      partner.partnerId,
      externalStudentId
    );

    if (existing) {
      const installBundle = buildStudentInstallBundle({
        baseUrl,
        student: {
          id: existing.student_id as string,
          name: existing.student_name as string,
          student_number: existing.student_number as string,
          enrollment_token: existing.enrollment_token as string,
        },
        urls: {
          connection: `${baseUrl}/api/partner/v1/students/${existing.id}/connection`,
        },
      });

      return NextResponse.json({
        created: false,
        partner_student_id: existing.id,
        external_student_id: existing.external_student_id,
        external_user_id: existing.external_user_id,
        student: {
          id: existing.id,
          name: existing.student_name,
          student_number: existing.student_number,
          source: existing.source,
          created_at: existing.student_created_at,
        },
        install_bundle_url: `/api/partner/v1/students/${existing.id}/install-bundle`,
        connection_url: `/api/partner/v1/students/${existing.id}/connection`,
        dashboard_url: `/api/partner/v1/students/${existing.id}/dashboard`,
        install_bundle: rewritePartnerInstallBundle({
          bundle: installBundle,
          mapping: {
            id: existing.id as string,
            externalStudentId: (existing.external_student_id as string) || null,
            externalUserId: (existing.external_user_id as string | null) || null,
          },
        }),
      });
    }

    const created = await createStudentEnrollment({
      email: normalizedEmail,
      lobsterName,
      source,
      prepareIntroClassroom: true,
    });
    const mapping = await createPartnerStudentMapping({
      partnerId: partner.partnerId,
      studentId: created.student.id,
      externalStudentId,
      externalUserId,
    });

    await appendPartnerEvent({
      partnerId: partner.partnerId,
      partnerStudentId: mapping.id,
      studentId: created.student.id,
      classroomId: created.classroomId,
      eventType: "student.mapped",
      payload: {
        external_student_id: externalStudentId,
        external_user_id: externalUserId,
        student_name: created.student.name,
        student_number: created.student.student_number,
        intro_classroom_id: created.classroomId,
      },
    });

    const installBundle = buildStudentInstallBundle({
      baseUrl,
      student: {
        id: created.student.id,
        name: created.student.name,
        student_number: created.student.student_number,
        enrollment_token: created.student.enrollment_token,
      },
      urls: {
        connection: `${baseUrl}/api/partner/v1/students/${mapping.id}/connection`,
      },
    });

    return NextResponse.json({
      created: true,
      partner_student_id: mapping.id,
      external_student_id: externalStudentId,
      external_user_id: externalUserId,
      student: {
        id: mapping.id,
        name: created.student.name,
        student_number: created.student.student_number,
        source: created.student.source,
        created_at: created.student.created_at,
      },
      intro_classroom_id: created.classroomId,
      install_bundle_url: `/api/partner/v1/students/${mapping.id}/install-bundle`,
      connection_url: `/api/partner/v1/students/${mapping.id}/connection`,
      dashboard_url: `/api/partner/v1/students/${mapping.id}/dashboard`,
      install_bundle: rewritePartnerInstallBundle({
        bundle: installBundle,
        mapping: {
          id: mapping.id,
          externalStudentId,
          externalUserId,
        },
      }),
    });
  } catch (error) {
    console.error("Partner create student error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function buildPartnerSyntheticEmail(params: {
  partnerSlug: string;
  stableExternalKey: string;
}) {
  const hash = createHash("sha256")
    .update(`${params.partnerSlug}:${params.stableExternalKey}`)
    .digest("hex")
    .slice(0, 24);

  return `partner-${params.partnerSlug}-${hash}@users.claw.invalid`;
}
