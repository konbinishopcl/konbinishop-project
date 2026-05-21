import type { Metadata } from "next";
import { EventCard } from "@/components/EventCard";
import { Ic } from "@/components/icons";
import { api, toEventItem } from "@/lib/api";
import type { EventItem } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  { params }: { params: Promise<{ cat: string }> },
): Promise<Metadata> {
  const { cat } = await params;
  try {
    const categories = await api.categories();
    const name = categories.find((c) => c.slug === cat)?.name ?? cat;
    const description = `Explora eventos de ${name} en Konbini — anime, conciertos, ferias y conventions en Chile.`;
    return {
      title: name,
      description,
      openGraph: { title: `${name} · Konbini`, description },
    };
  } catch {
    return { title: "Categoría" };
  }
}

// Chips de filtro — placeholder visual; los filtros reales son trabajo de Phase 5.
const CHIPS = ["Todos", "Hoy", "Esta semana", "Este mes", "Gratis", "Destacados"];

export default async function CategoryPage({ params }: { params: Promise<{ cat: string }> }) {
  const { cat } = await params;

  let events: EventItem[] = [];
  let name = "Categoría";
  try {
    const [categories, list] = await Promise.all([
      api.categories(),
      api.events({ category: cat, pageSize: 60 }),
    ]);
    name = categories.find((c) => c.slug === cat)?.name ?? cat;
    events = list.items.map(toEventItem);
  } catch {
    // API no disponible.
  }

  return (
    <main className="container">
      <div style={{ margin: "32px 0 12px" }}>
        <div className="eyebrow">CATEGORÍA · カテゴリ</div>
        <h1 className="display" style={{ fontSize: 64, margin: "12px 0 6px" }}>
          {name}
          <span style={{ color: "var(--accent)" }}>.</span>
        </h1>
        <p style={{ color: "var(--ink-2)", margin: 0, maxWidth: "50ch" }}>
          {events.length} {events.length === 1 ? "evento disponible" : "eventos disponibles"} ·
          explora y encuentra tu próximo panorama.
        </p>
      </div>

      <div className="chip-row">
        {CHIPS.map((f, i) => (
          <button key={f} className={`chip ${i === 0 ? "on" : ""}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="filter-bar">
        <div className="left">
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: ".15em" }}>
            MOSTRANDO
          </span>
          <strong style={{ fontSize: 14 }}>{events.length} resultados</strong>
        </div>
        <div className="right">
          <div className="field-inline">{Ic.cal} Cualquier fecha</div>
          <div className="field-inline">{Ic.pin} Chile</div>
          <div className="field-inline">Ordenar: Relevancia</div>
        </div>
      </div>

      {events.length > 0 ? (
        <div className="card-grid cols-4" style={{ margin: "24px 0 60px" }}>
          {events.map((e) => (
            <EventCard key={e.id} e={e} />
          ))}
        </div>
      ) : (
        <p style={{ color: "var(--ink-3)", margin: "40px 0 80px" }}>
          No hay eventos publicados en esta categoría todavía.
        </p>
      )}
    </main>
  );
}
