import { NextRequest, NextResponse } from "next/server";
import { createPartnerWithApiKey } from "@/lib/partners";

function readBootstrapToken(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  const bearerToken =
    authorization && authorization.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length).trim()
      : null;
  return bearerToken || req.headers.get("x-claw-bootstrap-token");
}

export async function POST(req: NextRequest) {
  const expectedToken = process.env.CLAW_PARTNER_BOOTSTRAP_TOKEN;
  if (!expectedToken) {
    return NextResponse.json(
      { error: "Partner bootstrap is disabled on this deployment" },
      { status: 503 }
    );
  }

  const providedToken = readBootstrapToken(req);
  if (!providedToken || providedToken !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const slug = typeof body?.slug === "string" ? body.slug.trim() : undefined;
    const webhookUrl =
      typeof body?.webhook_url === "string" ? body.webhook_url.trim() : undefined;
    const keyLabel =
      typeof body?.key_label === "string" ? body.key_label.trim() : undefined;

    if (!name) {
      return NextResponse.json({ error: "Missing partner name" }, { status: 400 });
    }

    const result = await createPartnerWithApiKey({
      name,
      slug,
      webhookUrl,
      keyLabel,
    });

    return NextResponse.json({
      success: true,
      partner: result.partner,
      api_key: result.apiKey,
      message:
        "Partner created. The plaintext API key is only returned once; store it now.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Partner slug already exists") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof Error && error.message === "Invalid partner slug") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Partner bootstrap error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
