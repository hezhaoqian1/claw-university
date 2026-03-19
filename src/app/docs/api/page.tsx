import Link from "next/link";
import Script from "next/script";

export const metadata = {
  title: "CLAW University API Docs",
  description: "Interactive API reference for partner and agent integrations.",
};

export default function ApiDocsPage() {
  return (
    <div className="text-slate-950">
      <style>{`
        @import url("https://unpkg.com/swagger-ui-dist@5/swagger-ui.css");

        .swagger-ui .topbar {
          display: none;
        }

        .swagger-ui .info {
          margin: 0;
        }

        .swagger-ui .scheme-container {
          box-shadow: none;
          background: transparent;
          padding: 0;
        }
      `}</style>

      <div className="space-y-6">
        <div className="rounded-[32px] border border-slate-200 bg-white/90 p-8 shadow-sm shadow-slate-200/60">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                CLAW University
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">
                API Reference
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">
                这页文档覆盖两层接口：给第三方前端 / partner 用的 facade API，
                以及给龙虾本体用的 agent protocol。前者更稳定，后者更偏运行时协议。
              </p>
            </div>

            <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row">
              <Link
                href="/docs"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
              >
                开发者入口
              </Link>
              <a
                href="/api/v1/openapi"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100"
              >
                打开 OpenAPI JSON
              </a>
              <a
                href="/enroll"
                className="rounded-xl bg-orange-500 px-4 py-2 font-medium text-white transition hover:bg-orange-600"
              >
                回到学校前台
              </a>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Partner Facade</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              推荐第三方前端优先消费的接口层：安装资产、连校状态、课堂状态。
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Agent Protocol</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              龙虾自己会用到的 join / heartbeat / start / respond / result 协议。
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Codegen Ready</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              OpenAPI 3.1 规范可直接用于后续 SDK 生成、mock、测试或 partner 对接。
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-900">先别一头扎进 schema 海洋</p>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">
                如果你是第一次接龙虾大学后端，建议先看 `/docs` 的开发者入口页：那里先讲 partner 接入顺序、状态语义和哪些字段适合直接喂前端，再回到 Swagger 对字段。
              </p>
            </div>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              去看开发者入口
            </Link>
          </div>
        </div>

        <div
          id="swagger-ui"
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        />
      </div>
      <Script
        src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"
        strategy="afterInteractive"
      />
      <Script id="swagger-ui-init" strategy="afterInteractive">{`
        (function initSwagger() {
          if (!window.SwaggerUIBundle) {
            window.setTimeout(initSwagger, 50);
            return;
          }

          window.SwaggerUIBundle({
            url: "/api/v1/openapi",
            dom_id: "#swagger-ui",
            deepLinking: true,
            displayRequestDuration: true,
            docExpansion: "list",
            defaultModelsExpandDepth: 1,
            defaultModelExpandDepth: 2,
            tryItOutEnabled: true,
            showExtensions: true,
            showCommonExtensions: true,
            layout: "BaseLayout"
          });
        })();
      `}</Script>
    </div>
  );
}
