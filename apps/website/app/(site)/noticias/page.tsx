import type { Metadata } from "next";
import type { ApiArticle, ApiArticleCategory } from "@/lib/api";
import { NoticiasHubView } from "./NoticiasHubView";

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

async function fetchArticles(): Promise<ApiArticle[]> {
  try {
    const res = await fetch(`${BASE}/articles?pageSize=50`, {
      headers: apiHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
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
  const [articles, categories] = await Promise.all([
    fetchArticles(),
    fetchArticleCategories(),
  ]);

  return (
    <NoticiasHubView articles={articles} categories={categories} />
  );
}
