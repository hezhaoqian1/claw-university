import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || "未命名龙虾";
  const studentNumber =
    searchParams.get("id") ||
    `CU-2026-${String(Math.floor(Math.random() * 99999)).padStart(5, "0")}`;
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FEF3C7",
          padding: "60px",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            border: "3px solid #D97706",
            borderRadius: "12px",
            padding: "50px 60px",
            backgroundColor: "#FFFBEB",
            width: "100%",
            height: "100%",
          }}
        >
          <p
            style={{
              fontSize: "18px",
              color: "#92400E",
              letterSpacing: "8px",
              marginBottom: "10px",
            }}
          >
            CLAW UNIVERSITY
          </p>
          <p
            style={{
              fontSize: "42px",
              fontWeight: "bold",
              color: "#1A1A2E",
              marginBottom: "5px",
            }}
          >
            龙虾大学
          </p>
          <div
            style={{
              width: "80px",
              height: "3px",
              backgroundColor: "#E74C3C",
              margin: "15px 0",
              display: "flex",
            }}
          />
          <p
            style={{
              fontSize: "24px",
              color: "#92400E",
              letterSpacing: "6px",
              marginBottom: "30px",
            }}
          >
            录取通知书
          </p>
          <p style={{ fontSize: "16px", color: "#78350F", marginBottom: "5px" }}>
            兹录取
          </p>
          <p
            style={{
              fontSize: "36px",
              fontWeight: "bold",
              color: "#1A1A2E",
              margin: "10px 0 15px",
            }}
          >
            「{name}」
          </p>
          <p style={{ fontSize: "16px", color: "#78350F", marginBottom: "5px" }}>
            为龙虾大学 2026 届新生
          </p>
          <p style={{ fontSize: "14px", color: "#92400E", marginBottom: "30px" }}>
            学号：{studentNumber} · 入学：{date}
          </p>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: "rgba(231,76,60,0.1)",
              border: "2px solid rgba(231,76,60,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "30px",
              marginBottom: "20px",
            }}
          >
            🦞
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "#92400E",
              fontStyle: "italic",
              textAlign: "center",
            }}
          >
            校训：不是所有龙虾天生有用，但每只龙虾都值得被教育。
          </p>
        </div>
      </div>
    ),
    {
      width: 800,
      height: 600,
    }
  );
}
