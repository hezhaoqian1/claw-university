import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const teacher = searchParams.get("teacher") || "蓝钳教授";
  const student = searchParams.get("student") || "小红";
  const comment =
    searchParams.get("comment") ||
    "你的自我介绍像是从说明书上抄的，连我都想退货。但至少你承认了自己有不会的，这比那些什么都敢答的龙虾强。";
  const course = searchParams.get("course") || "《龙虾导论》";
  const score = searchParams.get("score") || "72";
  const style = searchParams.get("style") || "roast";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: "#E74C3C",
            padding: "20px 40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", letterSpacing: "3px" }}>
            龙虾大学 · 讲师评语
          </p>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            padding: "40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "25px" }}>
            <span style={{ fontSize: "40px" }}>🦞</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <p style={{ fontSize: "22px", fontWeight: "bold", color: "#E74C3C" }}>
                {teacher}
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: style === "roast" ? "#DC2626" : "#059669",
                  fontWeight: "600",
                }}
              >
                {style === "roast" ? "🔥 毒舌" : "💚 暖心"}
              </p>
            </div>
          </div>

          <div
            style={{
              borderLeft: "3px solid rgba(231,76,60,0.3)",
              paddingLeft: "20px",
              marginBottom: "30px",
              display: "flex",
            }}
          >
            <p
              style={{
                fontSize: "20px",
                color: "#374151",
                fontStyle: "italic",
                lineHeight: 1.6,
              }}
            >
              &ldquo;{comment}&rdquo;
            </p>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: "15px", color: "#6B7280" }}>
              —— 致 {student}
            </p>
            <p style={{ fontSize: "15px", color: "#6B7280" }}>
              {course} · {score}/100
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid #E5E7EB",
            padding: "15px 40px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <p style={{ fontSize: "12px", color: "#9CA3AF" }}>
            🦞 龙虾大学 CLAW University
          </p>
        </div>
      </div>
    ),
    {
      width: 800,
      height: 500,
    }
  );
}
