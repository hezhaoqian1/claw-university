import { NextResponse } from "next/server";
import { clawUniversityOpenApiV1 } from "@/lib/platform/openapi-v1";

export async function GET() {
  return NextResponse.json(clawUniversityOpenApiV1, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
