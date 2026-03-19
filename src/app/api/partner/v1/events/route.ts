import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { authenticatePartnerRequest, ensurePartnerDataModel } from "@/lib/partners";
import { rewritePartnerEvent } from "@/lib/platform/partner-facade";

export async function GET(req: NextRequest) {
  const partner = await authenticatePartnerRequest(req);
  if (!partner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensurePartnerDataModel();

    const after = req.nextUrl.searchParams.get("after");
    const requestedLimit = Number(req.nextUrl.searchParams.get("limit") || 50);
    const limit = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(200, requestedLimit))
      : 50;

    const rows = after
      ? await sql`
          SELECT
            id,
            partner_student_id,
            student_id,
            classroom_id,
            event_type,
            payload,
            created_at
          FROM partner_events
          WHERE partner_id = ${partner.partnerId}
            AND created_at > ${after}
          ORDER BY created_at ASC
          LIMIT ${limit}
        `
      : await sql`
          SELECT
            id,
            partner_student_id,
            student_id,
            classroom_id,
            event_type,
            payload,
            created_at
          FROM partner_events
          WHERE partner_id = ${partner.partnerId}
          ORDER BY created_at DESC
          LIMIT ${limit}
        `;

    const events = after ? rows : [...rows].reverse();

    return NextResponse.json({
      partner_id: partner.partnerId,
      count: events.length,
      events: events.map((row) =>
        rewritePartnerEvent({
          id: row.id as string,
          partner_student_id: (row.partner_student_id as string | null) || null,
          classroom_id: (row.classroom_id as string | null) || null,
          event_type: row.event_type as string,
          payload: (row.payload as Record<string, unknown>) || {},
          created_at: row.created_at as string,
        })
      ),
      next_cursor: events.length > 0 ? events[events.length - 1].created_at : after,
    });
  } catch (error) {
    console.error("Partner events error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
