import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ApiArticle, ApiArticleCategory } from "@/lib/api";
import { NewsCategoryView } from "./NewsCategoryView";

export const dynamic = "force-dynamic";

const BASE =
  typeof window === "undefined"
    ? process.env.API_URL || "http://localhost:3333/api"
    : "/api";

function apiHeaders(): Record<string, string> {
  const h: Record<string, string> = {};
  const key = process.env.API_KEY;
  if (key) h["X-API-Key"] = key;
  return h;
}

async function fetchCategories(): Promise<ApiArticleCategory[]> {
  try {
    const res = await fetch(`${BASE}/article-categories`, {
      headers: apiHeaders(),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function fetchArticles(slug: string, page = 1, pageSize = 24): Promise<{
  items: ApiArticle[];
  total: number;
  totalPages: number;
}> {
  try {
    const params = new URLSearchParams({
      articleCategory: slug,
      page: String(page),
      pageSize: String(pageSize),
    });
    const res = await fetch(`${BASE}/articles?${params}`, {
      headers: apiHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return { items: [], total: 0, totalPages: 1 };
    const data = await res.json();
    return {
      items: data.items ?? [],
      total: data.total ?? 0,
      totalPages: data.totalPages ?? 1,
    };
  } catch {
    return { items: [], total: 0, totalPages: 1 };
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const categories = await fetchCategories();
  const cat = categories.find((c) => c.slug === slug);
  const name = cat?.name ?? slug;
  return {
    title: `${name} — Noticias · Konbini`,
    description: `Cobertura editorial de ${name.toLowerCase()} en Konbini.`,
  };
}

export default async function NewsCategoryPage({ params }: PageProps) {
  const { slug } = await params;

  const [categories, { items, total, totalPages }] = await Promise.all([
    fetchCategories(),
    fetchArticles(slug),
  ]);

  const category = categories.find((c) => c.slug === slug);
  if (!category) {
    notFound();
  }

  return (
    <NewsCategoryView
      category={category}
      initialArticles={items}
      initialTotal={total}
      initialTotalPages={totalPages}
      pageSize={24}
    />
  );
}
