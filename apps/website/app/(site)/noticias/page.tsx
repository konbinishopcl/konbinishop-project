import type { Metadata } from "next";
import { NoticiasListView } from "./NoticiasListView";

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
  tags: { id: number; name: string; slug: string }[];
  // Evento vinculado (solo en vista detalle, undefined en lista)
  events?: ApiArticleEvent[];
};

async function fetchArticles(): Promise<ApiArticle[]> {
  const base =
    typeof window === "undefined"
      ? process.env.API_URL || "http://localhost:3333/api"
      : "/api";
  try {
    const headers: Record<string, string> = {};
    const key = process.env.API_KEY;
    if (key) headers["X-API-Key"] = key;
    const res = await fetch(`${base}/articles?pageSize=24`, {
      headers,
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

export default async function NoticiasPage() {
  const articles = await fetchArticles();
  return <NoticiasListView articles={articles} />;
}
