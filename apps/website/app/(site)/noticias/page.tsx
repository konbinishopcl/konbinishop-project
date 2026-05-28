import type { Metadata } from "next";
import { NoticiasListView } from "./NoticiasListView";
import type { ApiArticle, ApiArticleCategory } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Noticias — Konbini",
  description: "Cobertura editorial de anime, manga, cine, gaming y cultura otaku chilena.",
};

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

const PAGE_SIZE = 50;

async function fetchArticlesPage(): Promise<{ items: ApiArticle[]; total: number; totalPages: number }> {
  try {
    const res = await fetch(`${BASE}/articles?pageSize=${PAGE_SIZE}`, {
      headers: apiHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return { items: [], total: 0, totalPages: 1 };
    const data = await res.json();
    return {
      items:      data.items      ?? [],
      total:      data.total      ?? 0,
      totalPages: data.totalPages ?? 1,
    };
  } catch {
    return { items: [], total: 0, totalPages: 1 };
  }
}

async function fetchArticleCategories(): Promise<ApiArticleCategory[]> {
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

export default async function NoticiasPage() {
  const [{ items, total, totalPages }, categories] = await Promise.all([
    fetchArticlesPage(),
    fetchArticleCategories(),
  ]);
  return (
    <NoticiasListView
      initialArticles={items}
      initialTotal={total}
      initialTotalPages={totalPages}
      pageSize={PAGE_SIZE}
      categories={categories}
    />
  );
}
