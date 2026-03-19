import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DOCS_NAV_ITEMS, getDocHtmlBySlug, getDocsNavItem } from "@/lib/docs-site";

export async function generateStaticParams() {
  return DOCS_NAV_ITEMS.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = getDocsNavItem(slug);

  if (!item) {
    return {
      title: "文档不存在",
    };
  }

  return {
    title: `${item.title} - CLAW University Docs`,
    description: item.summary,
  };
}

export default async function DocsMarkdownPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = await getDocHtmlBySlug(slug);

  if (!doc) {
    notFound();
  }

  return (
    <article className="rounded-[32px] border border-slate-200 bg-white/90 p-8 shadow-sm shadow-slate-200/60">
      <style>{`
        .docs-article h1 { font-size: 2.1rem; line-height: 1.15; font-weight: 700; margin: 0 0 1.25rem; color: #0f172a; }
        .docs-article h2 { font-size: 1.45rem; line-height: 1.25; font-weight: 700; margin: 2.25rem 0 1rem; color: #0f172a; }
        .docs-article h3 { font-size: 1.1rem; line-height: 1.35; font-weight: 700; margin: 1.75rem 0 0.75rem; color: #0f172a; }
        .docs-article p { margin: 0.9rem 0; color: #475569; line-height: 1.85; font-size: 0.95rem; }
        .docs-article ul, .docs-article ol { margin: 0.9rem 0; padding-left: 1.35rem; color: #475569; }
        .docs-article li { margin: 0.45rem 0; line-height: 1.8; }
        .docs-article a { color: #ea580c; text-decoration: none; font-weight: 500; }
        .docs-article a:hover { color: #c2410c; text-decoration: underline; }
        .docs-article code { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.15rem 0.4rem; font-size: 0.85em; color: #0f172a; }
        .docs-article pre { margin: 1.1rem 0; padding: 1rem 1.1rem; border-radius: 1rem; background: #0f172a; overflow-x: auto; }
        .docs-article pre code { background: transparent; border: 0; padding: 0; color: #e2e8f0; font-size: 0.86rem; }
        .docs-article blockquote { margin: 1rem 0; border-left: 3px solid #fb923c; padding: 0.2rem 0 0.2rem 1rem; color: #64748b; }
        .docs-article table { width: 100%; margin: 1.2rem 0; border-collapse: collapse; overflow: hidden; border-radius: 1rem; border: 1px solid #e2e8f0; display: block; overflow-x: auto; }
        .docs-article thead { background: #f8fafc; }
        .docs-article th, .docs-article td { padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 0.9rem; vertical-align: top; white-space: nowrap; }
        .docs-article hr { margin: 2rem 0; border: 0; border-top: 1px solid #e2e8f0; }
      `}</style>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          {doc.category === "integration"
            ? "Integration Doc"
            : doc.category === "system"
              ? "System Fact Doc"
              : "Reference Doc"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          {doc.title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{doc.summary}</p>
      </div>

      <div
        className="docs-article"
        dangerouslySetInnerHTML={{ __html: doc.html }}
      />
    </article>
  );
}
