import Link from "next/link";
import { ReactNode } from "react";
import { BookOpen, Code2, Layers3 } from "lucide-react";
import { DOCS_NAV_ITEMS } from "@/lib/docs-site";

const groupedItems = [
  {
    id: "integration",
    title: "接入优先看",
    items: DOCS_NAV_ITEMS.filter((item) => item.category === "integration"),
  },
  {
    id: "system",
    title: "系统与课程",
    items: DOCS_NAV_ITEMS.filter((item) => item.category === "system"),
  },
  {
    id: "reference",
    title: "参考与历史",
    items: DOCS_NAV_ITEMS.filter((item) => item.category === "reference"),
  },
];

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.08),_transparent_26%),linear-gradient(180deg,#f8fafc_0%,#ffffff_55%,#fff7ed_100%)] text-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm shadow-orange-100/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                CLAW University Developer Center
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                学校后端接入文档
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">
                同一个开发者中心里放接入说明、状态语义、课程系统和 Swagger。
                先在这里搞清楚分层，再去 schema 里对字段。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/docs"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                开发者入口
              </Link>
              <Link
                href="/docs/api"
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Swagger / OpenAPI
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Link
              href="/docs/partner-api"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:bg-slate-100"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="size-4 text-slate-700" />
                <div>
                  <p className="text-sm font-semibold text-slate-950">先接 Partner API</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">建学生、拿安装包、查连校、报课。</p>
                </div>
              </div>
            </Link>
            <Link
              href="/docs/state-model"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:bg-slate-100"
            >
              <div className="flex items-center gap-3">
                <Layers3 className="size-4 text-slate-700" />
                <div>
                  <p className="text-sm font-semibold text-slate-950">再看状态模型</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">lifecycle / stage / blocker 怎么画。</p>
                </div>
              </div>
            </Link>
            <Link
              href="/docs/api"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:bg-slate-100"
            >
              <div className="flex items-center gap-3">
                <Code2 className="size-4 text-slate-700" />
                <div>
                  <p className="text-sm font-semibold text-slate-950">最后去 Swagger</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">字段、schema、try it out 都在这里。</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="h-fit rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm shadow-slate-200/60">
            <div className="space-y-6">
              {groupedItems.map((group) => (
                <div key={group.id}>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    {group.title}
                  </p>
                  <div className="mt-3 space-y-2">
                    {group.items.map((item) => (
                      <Link
                        key={item.slug}
                        href={`/docs/${item.slug}`}
                        className="block rounded-2xl border border-transparent bg-slate-50 px-4 py-3 transition hover:border-slate-200 hover:bg-white"
                      >
                        <p className="text-sm font-medium text-slate-900">{item.title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">{item.summary}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
