import { HeroBlock } from "@/components/HeroBlock";
import { Rail } from "@/components/Rail";
import { api, toEventItem, toHeroSlide, type ApiCategory, type HeroSlide } from "@/lib/api";
import type { EventItem } from "@/lib/data";

// Datos en vivo desde la API; no se prerenderiza en build.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  let events: EventItem[] = [];
  let heroSlides: HeroSlide[] = [];
  let categories: ApiCategory[] = [];
  try {
    const [list, cats, heroes] = await Promise.all([
      api.events({ pageSize: 60 }),
      api.categories(),
      api.heroes(),
    ]);
    events = list.items.map(toEventItem);
    heroSlides = heroes.map(toHeroSlide);
    categories = cats;
  } catch {
    // API no disponible — la home se muestra sin contenido.
  }

  const destacados = events.slice(0, 6);

  return (
    <main className="container">
      <HeroBlock slides={heroSlides} />

      {destacados.length > 0 && (
        <Rail title="Destacados" jp="注目の作品" items={destacados} hrefSeeAll="/busqueda" />
      )}

      {categories.map((c) => {
        const items = events.filter((e) => e.catSlug === c.slug).slice(0, 4);
        return items.length > 0 ? (
          <Rail key={c.id} title={c.name ?? "Categoría"} items={items} hrefSeeAll={`/categoria/${c.slug}`} />
        ) : null;
      })}
    </main>
  );
}
