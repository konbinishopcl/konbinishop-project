import { api, toEventItem, toHeroSlide } from "@/lib/api";
import { HomeView, type ApiSpot, type ApiArticle } from "./HomeView";

// Datos en vivo desde la API; no se prerenderiza en build.
export const dynamic = "force-dynamic";

async function fetchSpots(): Promise<ApiSpot[]> {
  const base =
    typeof window === "undefined"
      ? process.env.API_URL || "http://localhost:3333/api"
      : "/api";
  try {
    const headers: Record<string, string> = {};
    const key = process.env.API_KEY;
    if (key) headers["X-API-Key"] = key;
    const res = await fetch(`${base}/spots?isActive=true&pageSize=8`, {
      headers,
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? data ?? [];
  } catch {
    return [];
  }
}

async function fetchArticles(): Promise<ApiArticle[]> {
  const base =
    typeof window === "undefined"
      ? process.env.API_URL || "http://localhost:3333/api"
      : "/api";
  try {
    const headers: Record<string, string> = {};
    const key = process.env.API_KEY;
    if (key) headers["X-API-Key"] = key;
    const res = await fetch(`${base}/articles?pageSize=4`, {
      headers,
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  let items: ReturnType<typeof toEventItem>[] = [];
  let slides: ReturnType<typeof toHeroSlide>[] = [];
  let categories: Awaited<ReturnType<typeof api.categories>> = [];
  let spots: ApiSpot[] = [];
  let articles: ApiArticle[] = [];

  try {
    const [list, cats, heroes, fetchedSpots, fetchedArticles] = await Promise.all([
      api.events({ pageSize: 60 }),
      api.categories(),
      api.heroes(),
      fetchSpots(),
      fetchArticles(),
    ]);
    items = list.items.map(toEventItem);
    slides = heroes.map(toHeroSlide);
    categories = cats;
    spots = fetchedSpots;
    articles = fetchedArticles;
  } catch {
    // API no disponible — la home se muestra sin contenido.
  }

  return (
    <HomeView
      items={items}
      categories={categories}
      slides={slides}
      spots={spots}
      articles={articles}
    />
  );
}
