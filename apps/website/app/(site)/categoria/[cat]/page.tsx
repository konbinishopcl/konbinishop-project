"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { EventCard } from "@/components/EventCard";
import { Ic } from "@/components/icons";
import { CATEGORIES, EVENTS } from "@/lib/data";

export default function CategoryPage() {
  const params = useParams<{ cat: string }>();
  const cat = params.cat || "cine";
  const meta = CATEGORIES.find((c) => c.id === cat) || CATEGORIES[1];
  const [filter, setFilter] = useState("todos");
  const filters = ["todos", "hoy", "esta semana", "este mes", "gratis", "destacados"];

  const items = EVENTS.filter((e) => e.cat.toLowerCase() === meta.label.toLowerCase());
  const allItems = items.length ? [...items, ...items, ...items].slice(0, 12) : EVENTS.slice(0, 12);

  return (
    <main className="container">
      <div
        style={{
          margin: "32px 0 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "end",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div className="eyebrow">CATEGORÍA · カテゴリ</div>
          <h1 className="display" style={{ fontSize: 64, margin: "12px 0 6px" }}>
            {meta.label}
            <span style={{ color: "var(--accent)" }}>.</span>
          </h1>
          <p style={{ color: "var(--ink-2)", margin: 0, maxWidth: "50ch" }}>
            {allItems.length} eventos disponibles · explora y compra tu entrada en segundos.
          </p>
        </div>
        <div
          className="jp"
          style={{ fontSize: 80, color: "var(--ink-3)", opacity: 0.3, lineHeight: 0.9, fontWeight: 900 }}
        >
          {meta.ja}
        </div>
      </div>

      <div className="chip-row">
        {filters.map((f) => (
          <button key={f} className={`chip ${filter === f ? "on" : ""}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="filter-bar">
        <div className="left">
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: ".15em" }}>
            MOSTRANDO
          </span>
          <strong style={{ fontSize: 14 }}>{allItems.length} resultados</strong>
        </div>
        <div className="right">
          <div className="field-inline">{Ic.cal} Cualquier fecha</div>
          <div className="field-inline">{Ic.pin} Santiago, CL</div>
          <div className="field-inline">Ordenar: Relevancia</div>
        </div>
      </div>

      <div className="card-grid cols-4" style={{ margin: "24px 0 60px" }}>
        {allItems.map((e, i) => (
          <EventCard key={`${e.id}-${i}`} e={e} />
        ))}
      </div>
    </main>
  );
}
