import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { TagArticlesView } from "./TagArticlesView";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tags = await api.articleTags().catch(() => []);
  const tag = tags.find((t) => t.slug === slug);
  return {
    title: tag ? `#${tag.name} — Noticias · Konbini` : `#${slug} — Konbini`,
    description: `Artículos etiquetados con #${tag?.name ?? slug} en Konbini.`,
  };
}

export default async function TagArticlesPage({ params }: Props) {
  const { slug } = await params;

  const [tags, articlesData] = await Promise.all([
    api.articleTags().catch(() => []),
    api.articles({ articleTag: slug, page: 1, pageSize: 24 }).catch(() => ({
      items: [],
      total: 0,
      page: 1,
      pageSize: 24,
      totalPages: 1,
    })),
  ]);

  const tag = tags.find((t) => t.slug === slug);
  if (!tag) notFound();

  return (
    <TagArticlesView
      tag={tag}
      initialArticles={articlesData.items}
      initialTotal={articlesData.total}
      initialTotalPages={articlesData.totalPages}
    />
  );
}
