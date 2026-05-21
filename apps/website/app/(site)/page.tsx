import { HeroBlock } from "@/components/HeroBlock";
import { Rail } from "@/components/Rail";
import { api, toEventItem, toHeroEvent, type ApiCategory, type HeroEvent } from "@/lib/api";
import type { EventItem } from "@/lib/data";

// Datos en vivo desde la API; no se prerenderiza en build.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  let events: EventItem[] = [];
  let heroEvents: HeroEvent[] = [];
  let categories: ApiCategory[] = [];
  try {
    const [list, cats] = await Promise.all([
      api.events({ pageSize: 60 }),
      api.categories(),
    ]);
    events = list.items.map(toEventItem);
    heroEvents = list.items.slice(0, 5).map(toHeroEvent);
    categories = cats;
  } catch {
    // API no disponible — la home se muestra sin contenido.
  }

  const destacados = events.slice(0, 6);

  return (
    <main className="container">
      <HeroBlock events={heroEvents} />

      {destacados.length > 0 && (
        <Rail title="Destacados" ja="注目の作品" items={destacados} />
      )}

      {categories.map((c) => {
        const items = events.filter((e) => e.catSlug === c.slug).slice(0, 6);
        return items.length > 0 ? (
          <Rail key={c.id} title={c.name ?? "Categoría"} ja="" items={items} landscape />
        ) : null;
      })}
    </main>
  );
}
