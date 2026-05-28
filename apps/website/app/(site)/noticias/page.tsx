import type { Metadata } from "next";
import { NoticiasListView } from "./NoticiasListView";
import type { ApiArticleCategory } from "@/lib/api";

export const metadata: Metadata = {
  title: "Noticias — Konbini",
  description: "Cobertura editorial de anime, manga, cine, gaming y cultura otaku chilena.",
};

export type ApiArticleEvent = {
  id: number;
  slug: string;
  title: string;
  poster: string | null;
  banner: string | null;
  dates: { id: number; date: string | null }[];
  city: { name: string } | null;
  category: { name: string; slug: string } | null;
};

export type ApiArticle = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image: string | null;
  status: string;
  userId: number | null;
  isSponsored: boolean;
  createdAt: string;
  articleCategory: ApiArticleCategory | null;
  articleTags: { id: number; name: string; slug: string }[];
  tags: { id: number; name: string; slug: string }[];
  // Evento vinculado (solo en vista detalle, undefined en lista)
  events?: ApiArticleEvent[];
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
    const res = await fetch(`${BASE}/articles?pageSize=24`, {
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
  return <NoticiasListView articles={articles} categories={categories} />;
}
