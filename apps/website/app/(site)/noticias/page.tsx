import type { Metadata } from "next";
import { api } from "@/lib/api";
import { NoticiasHubView } from "./NoticiasHubView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Noticias — Konbini",
  description: "Cobertura editorial de anime, manga, cine, gaming y cultura otaku chilena.",
};

async function fetchArticles() {
  const base = process.env.API_URL || "http://localhost:3333/api";
  const headers: Record<string, string> = {};
  const key = process.env.API_KEY;
  if (key) headers["X-API-Key"] = key;
  try {
    const res = await fetch(`${base}/articles?pageSize=50`, { headers, cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

export default async function NoticiasPage() {
  const [articles, categories] = await Promise.all([
    fetchArticles(),
    api.articleCategories().catch(() => []),
  ]);

  return (
    <NoticiasHubView articles={articles} categories={categories} />
  );
}
