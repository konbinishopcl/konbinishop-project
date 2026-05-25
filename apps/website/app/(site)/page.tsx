import { api, toEventItem, toHeroSlide } from "@/lib/api";
import { HomeView } from "./HomeView";

// Datos en vivo desde la API; no se prerenderiza en build.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  let items: ReturnType<typeof toEventItem>[] = [];
  let slides: ReturnType<typeof toHeroSlide>[] = [];
  let categories: Awaited<ReturnType<typeof api.categories>> = [];

  try {
    const [list, cats, heroes] = await Promise.all([
      api.events({ pageSize: 60 }),
      api.categories(),
      api.heroes(),
    ]);
    items = list.items.map(toEventItem);
    slides = heroes.map(toHeroSlide);
    categories = cats;
  } catch {
    // API no disponible — la home se muestra sin contenido.
  }

  return <HomeView items={items} categories={categories} slides={slides} />;
}
