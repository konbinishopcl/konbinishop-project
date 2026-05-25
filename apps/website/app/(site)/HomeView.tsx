"use client";

import { HeroCarousel } from "@/components/HeroCarousel";
import { Rail } from "@/components/Rail";
import type { ApiCategory, HeroSlide } from "@/lib/api";
import type { EventItem } from "@/lib/data";

type Props = {
  items: EventItem[];
  categories: ApiCategory[];
  slides: HeroSlide[];
};

export function HomeView({ items, categories, slides }: Props) {
  const byCategory = (slug: string) => items.filter((e) => e.catSlug === slug);

  const todayLabel = new Date().toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    timeZone: "America/Santiago",
  }).toUpperCase();

  // Eventos con fecha exacta de hoy (formato "8 ABR 2026" vs today)
  const today = items.filter((e) => {
    if (!e.date || e.date === "Fecha por confirmar") return false;
    return e.date.includes(todayLabel.split(" ")[0]);
  });

  return (
    <main className="container">
      <HeroCarousel slides={slides} />

      {today.length > 0 && (
        <Rail
          title="Hoy"
          jp="今日"
          items={today.slice(0, 12)}
          hrefSeeAll="/busqueda"
        />
      )}

      {items.length > 0 && today.length === 0 && (
        <Rail
          title="Destacados"
          jp="注目の作品"
          items={items.slice(0, 12)}
          hrefSeeAll="/busqueda"
        />
      )}

      {categories.map((cat) => {
        const catItems = byCategory(cat.slug);
        if (catItems.length === 0) return null;
        return (
          <Rail
            key={cat.id}
            title={cat.name ?? cat.slug}
            jp=""
            items={catItems.slice(0, 12)}
            hrefSeeAll={`/categoria/${cat.slug}`}
          />
        );
      })}
    </main>
  );
}
