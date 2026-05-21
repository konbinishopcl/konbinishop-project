"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EventCard } from "@/components/EventCard";
import { Ic } from "@/components/icons";
import { api, toEventItem, type ApiCategory, type ApiRegion } from "@/lib/api";
import type { EventItem } from "@/lib/data";

type Props = {
  initialResults: EventItem[];
  initialCategories: ApiCategory[];
  initialRegions: ApiRegion[];
};

export function SearchView({ initialResults, initialCategories, initialRegions }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const region = params.get("region") ?? "";

  const [text, setText] = useState(q);
  const [results, setResults] = useState<EventItem[]>(initialResults);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ApiCategory[]>(initialCategories);
  const [regions, setRegions] = useState<ApiRegion[]>(initialRegions);
  // Rastrear si es el primer render (ya tenemos datos SSR).
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setText(q);
  }, [q]);

  // Cargar catálogos solo si el server no los proveyó (fallo de API en SSR).
  useEffect(() => {
    if (categories.length === 0) api.categories().then(setCategories).catch(() => {});
    if (regions.length === 0) api.regions().then(setRegions).catch(() => {});
  }, []);

  // Re-fetch cuando cambian los filtros en el cliente (navegación con URL).
  useEffect(() => {
    if (!hydrated) {
      setHydrated(true);
      return; // primer render: ya tenemos datos SSR, no re-fetch.
    }
    setLoading(true);
    api
      .events({ q: q || undefined, category: category || undefined, region: region || undefined, pageSize: 60 })
      .then((r) => setResults(r.items.map(toEventItem)))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
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

  const hasFilters = Boolean(q || category || region);

  return (
    <main className="container">
      <div style={{ margin: "32px 0 8px" }}>
        <div className="eyebrow">BÚSQUEDA · 検索</div>
        <h1 className="display" style={{ fontSize: 56, margin: "12px 0 6px" }}>
          Buscar eventos<span style={{ color: "var(--accent)" }}>.</span>
        </h1>
      </div>

      <form
        onSubmit={onSubmit}
        className="row"
        style={{ gap: 12, flexWrap: "wrap", margin: "16px 0 8px", alignItems: "stretch" }}
      >
        <input
          type="search"
          placeholder="Busca por nombre o descripción…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ flex: "1 1 280px" }}
        />
        <select value={category} onChange={(e) => pushParams({ category: e.target.value })}>
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name ?? c.slug}
            </option>
          ))}
        </select>
        <select value={region} onChange={(e) => pushParams({ region: e.target.value })}>
          <option value="">Todas las regiones</option>
          {regions.map((r) => (
            <option key={r.id} value={r.slug}>
              {r.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn dark">
          Buscar {Ic.arrow}
        </button>
      </form>

      {loading ? (
        <p style={{ color: "var(--ink-3)", margin: "40px 0 80px" }}>Buscando…</p>
      ) : results.length === 0 ? (
        <p style={{ color: "var(--ink-3)", margin: "40px 0 80px" }}>
          No encontramos eventos {hasFilters ? "con esos filtros" : "publicados"}. Prueba con
          otro término o quita algún filtro.
        </p>
      ) : (
        <>
          <p style={{ color: "var(--ink-2)", margin: "12px 0 0" }}>
            {results.length} {results.length === 1 ? "resultado" : "resultados"}
            {q && (
              <>
                {" "}
                para <strong>{q}</strong>
              </>
            )}
          </p>
          <div className="card-grid cols-4" style={{ margin: "20px 0 60px" }}>
            {results.map((e) => (
              <EventCard key={e.id} e={e} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
