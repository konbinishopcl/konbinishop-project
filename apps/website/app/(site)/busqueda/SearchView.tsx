"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { EventCard } from "@/components/EventCard";
import { Ic } from "@/components/icons";
import { api, toEventItem, type ApiEventCategory, type ApiRegion } from "@/lib/api";
import type { EventItem } from "@/lib/data";

type Props = {
  initialResults: EventItem[];
  initialCategories: ApiEventCategory[];
  initialRegions: ApiRegion[];
};

export function SearchView({ initialResults, initialCategories, initialRegions }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const region = params.get("region") ?? "";

  const [text, setText] = useState(q);
  const [tab, setTab] = useState<"all" | "events">("all");
  const [results, setResults] = useState<EventItem[]>(initialResults);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ApiEventCategory[]>(initialCategories);
  const [regions, setRegions] = useState<ApiRegion[]>(initialRegions);
  // Rastrear si es el primer render (ya tenemos datos SSR).
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setText(q);
  }, [q]);

  // Cargar catálogos solo si el server no los proveyó (fallo de API en SSR).
  useEffect(() => {
    if (categories.length === 0) api.eventCategories().then(setCategories).catch(() => {});
    if (regions.length === 0) api.regions().then(setRegions).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch cuando cambian los filtros en el cliente (navegación con URL).
  useEffect(() => {
    if (!hydrated) {
      setHydrated(true);
      return; // primer render: ya tenemos datos SSR, no re-fetch.
    }
    setLoading(true);
    api
      .events({ q: q || undefined, eventCategory: category || undefined, region: region || undefined, pageSize: 60 })
      .then((r) => setResults(r.items.map(toEventItem)))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, category, region]);

  const pushParams = (next: { q?: string; category?: string; region?: string }) => {
    const merged = { q, category, region, ...next };
    const sp = new URLSearchParams();
    if (merged.q) sp.set("q", merged.q);
    if (merged.category) sp.set("category", merged.category);
    if (merged.region) sp.set("region", merged.region);
    const qs = sp.toString();
    router.push(qs ? `/busqueda?${qs}` : "/busqueda");
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    pushParams({ q: text.trim() });
  };

  // Filtrar por tab (solo eventos en esta implementación — sin artículos por ahora)
  const list = tab === "events" ? results : results;
  const hasFilters = Boolean(q || category || region);

  return (
    <main className="container search-shell">
      <div className="eyebrow">BUSCAR · 検索</div>
      <h1>¿Qué buscas?</h1>

      {/* Search input bar */}
      <form onSubmit={onSubmit}>
        <div className="search-input">
          {Ic.search}
          <input
            autoFocus
            placeholder="Animes, conciertos, conventions, artículos…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {text && (
            <button
              type="button"
              className="icon-btn"
              onClick={() => { setText(""); pushParams({ q: "" }); }}
              style={{ padding: "2px 6px", fontSize: 12 }}
            >
              ✕
            </button>
          )}
        </div>
      </form>

      {/* Filtros adicionales */}
      {(categories.length > 0 || regions.length > 0) && (
        <div className="row" style={{ gap: 10, flexWrap: "wrap", margin: "0 0 18px" }}>
          {categories.length > 0 && (
            <select
              value={category}
              onChange={(e) => pushParams({ category: e.target.value })}
              style={{ flex: "0 0 auto" }}
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name ?? c.slug}
                </option>
              ))}
            </select>
          )}
          {regions.length > 0 && (
            <select
              value={region}
              onChange={(e) => pushParams({ region: e.target.value })}
              style={{ flex: "0 0 auto" }}
            >
              <option value="">Todas las regiones</option>
              {regions.map((r) => (
                <option key={r.id} value={r.slug}>
                  {r.name}
                </option>
              ))}
            </select>
          )}
          {hasFilters && (
            <button
              className="sel"
              style={{ color: "var(--accent)" }}
              onClick={() => { setText(""); router.push("/busqueda"); }}
            >
              ✕ Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="search-tabs">
        <button className={tab === "all" ? "on" : ""} onClick={() => setTab("all")}>
          Todo <span className="ct">{list.length}</span>
        </button>
        <button className={tab === "events" ? "on" : ""} onClick={() => setTab("events")}>
          Eventos <span className="ct">{results.length}</span>
        </button>
      </div>

      {/* Resultados */}
      {loading ? (
        <div style={{ color: "var(--ink-3)", padding: "48px 0", textAlign: "center" }}>
          Buscando…
        </div>
      ) : list.length === 0 ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "var(--ink-3)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🍙</div>
          <div style={{ fontSize: 18, color: "var(--ink-2)", marginBottom: 6 }}>
            {q ? `No encontramos nada para "${q}"` : "No encontramos eventos publicados"}
          </div>
          <div style={{ fontSize: 14 }}>
            {hasFilters ? "Prueba con otra palabra o quita algún filtro." : "Prueba con otra búsqueda o explora por categoría."}
          </div>
        </div>
      ) : (
        <>
          <p style={{ color: "var(--ink-2)", margin: "0 0 16px", fontSize: 14 }}>
            {list.length} {list.length === 1 ? "resultado" : "resultados"}
            {q && <> para <strong>{q}</strong></>}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 60 }}>
            {list.map((e) => (
              <Link key={e.id} className="search-row" href={`/evento/${e.slug ?? e.id}`}>
                <div className="thumb">
                  <div
                    className="pic"
                    style={{ backgroundImage: `url(${e.image})` }}
                  />
                </div>
                <div className="info">
                  <span className="badge ev">EVENTO</span>
                  <div className="t">{e.title}</div>
                  <div className="m">
                    {[e.cat, e.date, e.place].filter(Boolean).join(" · ")}
                  </div>
                </div>
                {Ic.arrow}
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
