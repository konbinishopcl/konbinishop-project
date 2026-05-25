"use client";

import { useState } from "react";
import Link from "next/link";
import { EventCard } from "@/components/EventCard";
import { Ic } from "@/components/icons";
import type { ApiCategory } from "@/lib/api";
import type { EventItem } from "@/lib/data";

type Props = {
  category: ApiCategory;
  allCategories: ApiCategory[];
  items: EventItem[];
};

// Opciones de ordenado
const SORT_OPTIONS = ["Relevancia", "Más recientes", "Precio: menor", "Precio: mayor"];

export function CategoryView({ category, allCategories, items }: Props) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("Relevancia");
  const [openPop, setOpenPop] = useState<string | null>(null);
  const [filterPrice, setFilterPrice] = useState("Todos");
  const [filterQuick, setFilterQuick] = useState<string | null>(null);

  // Filtrar items
  let filtered = [...items];
  if (filterPrice === "Gratis") filtered = filtered.filter((e) => e.price === 0);
  if (filterPrice === "De pago") filtered = filtered.filter((e) => e.price > 0);

  // Ordenar
  if (sort === "Precio: menor") filtered.sort((a, b) => a.price - b.price);
  if (sort === "Precio: mayor") filtered.sort((a, b) => b.price - a.price);

  const clearFilters = () => {
    setFilterPrice("Todos");
    setFilterQuick(null);
  };

  const activeCount = (filterPrice !== "Todos" ? 1 : 0) + (filterQuick ? 1 : 0);

  return (
    <main className="container">
      <div style={{ margin: "32px 0 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div className="eyebrow">CATEGORÍA · カテゴリ</div>
          <h1 className="display" style={{ fontSize: 64, margin: "12px 0 6px" }}>
            {category.name ?? category.slug}
            <span style={{ color: "var(--accent)" }}>.</span>
          </h1>
          <p style={{ color: "var(--ink-2)", margin: 0, maxWidth: "50ch" }}>
            <strong style={{ color: "var(--ink)" }}>{filtered.length} {filtered.length === 1 ? "evento" : "eventos"}</strong>
            {" "}· explora y compra tu entrada en segundos.
          </p>
        </div>
        {category.description && (
          <div className="jp" style={{ fontSize: 80, color: "var(--ink-3)", opacity: 0.3, lineHeight: 0.9, fontWeight: 900 }}>
            カテゴリ
          </div>
        )}
      </div>

      {/* Sticky filter bar */}
      <div className="fbar-sticky">
        <div className="fbar-inner">
          <div className="group">
            {["Hoy", "Esta semana"].map((f) => (
              <button
                key={f}
                className={`sel ${filterQuick === f ? "on" : ""}`}
                onClick={() => setFilterQuick(filterQuick === f ? null : f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="vline" />

          <div className="group">
            {/* Precio */}
            <div style={{ position: "relative" }}>
              <button
                className={`sel ${openPop === "price" ? "on" : ""} ${filterPrice !== "Todos" ? "on" : ""}`}
                onClick={() => setOpenPop(openPop === "price" ? null : "price")}
              >
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, marginRight: 6 }}>$</span>
                <strong style={{ fontWeight: 600 }}>{filterPrice}</strong> {Ic.chev}
              </button>
              {openPop === "price" && (
                <div className="menu" style={{ top: 44, left: 0, minWidth: 180 }} onMouseLeave={() => setOpenPop(null)}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".15em", color: "var(--ink-3)", textTransform: "uppercase", padding: "8px 12px 4px" }}>Precio</div>
                  {["Todos", "Gratis", "De pago"].map((o) => (
                    <button
                      key={o}
                      onClick={() => { setFilterPrice(o); setOpenPop(null); }}
                      style={filterPrice === o ? { background: "var(--surface-2)", color: "var(--ink)" } : undefined}
                    >
                      {filterPrice === o && <span style={{ color: "var(--accent)", marginRight: 4 }}>✓</span>}
                      {o}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {activeCount > 0 && (
              <button className="sel" style={{ color: "var(--accent)" }} onClick={clearFilters}>
                ✕ Limpiar ({activeCount})
              </button>
            )}
          </div>

          {/* Vista + Ordenar */}
          <div className="group" style={{ marginLeft: "auto" }}>
            <div style={{ display: "inline-flex", border: "1px solid var(--line)", borderRadius: 999, padding: 3, background: "var(--surface)" }}>
              <button
                className={`sel ${view === "grid" ? "on" : ""}`}
                onClick={() => setView("grid")}
                title="Grilla"
                style={{ border: 0, padding: "6px 10px" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
              </button>
              <button
                className={`sel ${view === "list" ? "on" : ""}`}
                onClick={() => setView("list")}
                title="Lista"
                style={{ border: 0, padding: "6px 10px" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
              </button>
            </div>

            {/* Sort */}
            <div style={{ position: "relative" }}>
              <button
                className={`sel ${openPop === "sort" ? "on" : ""}`}
                onClick={() => setOpenPop(openPop === "sort" ? null : "sort")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginRight: 6 }}><path d="M3 6h13M3 12h9M3 18h5M17 8V4l3 3M17 16v4l3-3"/></svg>
                <strong style={{ fontWeight: 600 }}>{sort}</strong> {Ic.chev}
              </button>
              {openPop === "sort" && (
                <div className="menu" style={{ top: 44, right: 0, left: "auto", minWidth: 200 }} onMouseLeave={() => setOpenPop(null)}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".15em", color: "var(--ink-3)", textTransform: "uppercase", padding: "8px 12px 4px" }}>Ordenar</div>
                  {SORT_OPTIONS.map((o) => (
                    <button
                      key={o}
                      onClick={() => { setSort(o); setOpenPop(null); }}
                      style={sort === o ? { background: "var(--surface-2)", color: "var(--ink)" } : undefined}
                    >
                      {sort === o && <span style={{ color: "var(--accent)", marginRight: 4 }}>✓</span>}
                      {o}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      {filtered.length === 0 ? (
        <div className="acc-empty" style={{ margin: "40px 0 60px" }}>
          <div className="ic">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          </div>
          <h3>No hay eventos con esos filtros</h3>
          <p>Prueba ampliando los filtros o quitando alguno.</p>
          {activeCount > 0 && (
            <button className="btn ghost" onClick={clearFilters}>Limpiar filtros</button>
          )}
        </div>
      ) : view === "grid" ? (
        <div className="card-grid" style={{ margin: "8px 0 60px" }}>
          {filtered.map((e) => (
            <EventCard key={e.id} e={e} />
          ))}
        </div>
      ) : (
        <div className="list-grid" style={{ margin: "8px 0 60px" }}>
          {filtered.map((e) => (
            <Link key={e.id} className="list-row" href={`/evento/${e.slug ?? e.id}`}>
              <div className="l-img">
                <div
                  className="pic"
                  style={{ backgroundImage: `url(${e.image})` }}
                />
                <span className="cat-tag">{(e.cat ?? "").toUpperCase()}</span>
              </div>
              <div className="l-info">
                <div className="l-date">{e.date}</div>
                <h3 className="l-title">{e.title}</h3>
                <div className="l-place">
                  {Ic.pin}
                  <span>{e.place}</span>
                </div>
              </div>
              <div className="l-price">
                {e.price === 0 ? "Gratis" : `$${e.price.toLocaleString("es-CL")}`}
                <span className="px">CLP</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Otras categorías */}
      {allCategories.length > 1 && (
        <div style={{ margin: "0 0 60px" }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>TAMBIÉN TE PUEDE INTERESAR</div>
          <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
            {allCategories
              .filter((c) => c.slug !== category.slug)
              .map((c) => (
                <Link key={c.id} className="pill" href={`/categoria/${c.slug}`}>
                  {c.name ?? c.slug}
                </Link>
              ))}
          </div>
        </div>
      )}
    </main>
  );
}
