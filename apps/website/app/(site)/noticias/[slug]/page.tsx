import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleView } from "./ArticleView";
import type { ApiArticle } from "../page";

async function ssrFetch(path: string) {
  const base = process.env.API_URL || "http://localhost:3333/api";
  const headers: Record<string, string> = {};
  const key = process.env.API_KEY;
  if (key) headers["X-API-Key"] = key;
  const res = await fetch(`${base}${path}`, { headers, cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const article: ApiArticle | null = await ssrFetch(`/articles/${slug}`);
  if (!article) return { title: "Artículo no encontrado — Konbini" };
  return {
    title: `${article.title} — Konbini`,
    description: article.excerpt ?? undefined,
    openGraph: {
      title: article.title,
      description: article.excerpt ?? undefined,
    },
  };
}

export default async function ArticleSlugPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const article: ApiArticle | null = await ssrFetch(`/articles/${slug}`);
  if (!article) notFound();

  // Fetch related articles (same first tag)
  const tag = article.tags?.[0]?.slug;
  const relatedData = tag
    ? await ssrFetch(`/articles?pageSize=4${tag ? `&tag=${encodeURIComponent(tag)}` : ""}`)
    : null;
  const related: ApiArticle[] = (relatedData?.items ?? []).filter(
    (a: ApiArticle) => a.id !== article.id,
  ).slice(0, 3);

  return <ArticleView article={article} related={related} />;
}
