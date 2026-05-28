"use client";
import { useState } from "react";
import Link from "next/link";
import type { ApiArticleTag } from "@/lib/api";

const ChevL = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const SORT_OPTIONS = ["Más usados", "A-Z"] as const;

interface Props {
  tags: ApiArticleTag[];
}

export function NoticiasTagsView({ tags }: Props) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<string>("Más usados");

  let filtered = tags.filter(
    (t) => !q.trim() || t.name.toLowerCase().includes(q.toLowerCase())
  );

  if (sort === "A-Z") {
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name, "es"));
  }
  // "Más usados" = default API order (by usage)

  // Index-based font sizing for tag cloud since we don't have counts
  const sizeOf = (index: number, total: number) => {
    if (total <= 1) return 18;
    // Map index to font size: earlier items (index 0) = bigger, based on original order
    const ratio = 1 - index / total;
    return Math.round(14 + ratio * 20); // 14..34px
  };

  return (
    <main className="container">
      {/* ── BACK LINK ──────────────────────────────────────────────── */}
      <Link
        href="/noticias"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--ink-3)",
          fontSize: 13,
          marginTop: 24,
          marginBottom: 4,
        }}
      >
        <ChevL /> Volver a noticias
      </Link>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div style={{ margin: "8px 0 36px" }}>
        <div className="eyebrow">NOTICIAS · タグ</div>
        <h1
          className="display"
          style={{ fontSize: "clamp(48px,6vw,80px)", margin: "12px 0 8px", letterSpacing: "-.035em", lineHeight: 0.95 }}
        >
          Tags<span style={{ color: "var(--accent)" }}>.</span>
        </h1>
        <p style={{ color: "var(--ink-2)", margin: 0, maxWidth: "62ch", fontSize: 16 }}>
          <strong style={{ color: "var(--ink)" }}>{tags.length} tags activos</strong>
          {" "}· generados por IA al aprobar artículos. Hacer clic abre el archivo de noticias con ese tag.
        </p>
      </div>

      {/* ── SEARCH + SORT BAR ──────────────────────────────────────── */}
      <div className="fbar-sticky">
        <div className="fbar-inner" style={{ gap: 12 }}>
          <div
            className="search-input"
            style={{ padding: "8px 16px", margin: 0, flex: 1, minWidth: 280, background: "transparent", border: 0 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            <input
              placeholder="Buscar tag…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ padding: 0, background: "transparent" }}
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="icon-btn"
                style={{ width: 28, height: 28 }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="group" style={{ marginLeft: "auto" }}>
            {SORT_OPTIONS.map((s) => (
              <button
                key={s}
                className={`sel ${sort === s ? "on" : ""}`}
                onClick={() => setSort(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── TAG CLOUD ──────────────────────────────────────────────── */}
      {filtered.length > 0 ? (
        <section
          style={{
            padding: 36,
            border: "1px solid var(--line)",
            borderRadius: "var(--r-xl)",
            marginBottom: 32,
            marginTop: 8,
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: "14px 18px", alignItems: "baseline" }}>
            {filtered.map((t, i) => (
              <Link
                key={t.slug}
                href={`/noticias/tags/${t.slug}`}
                style={{
                  display: "inline-flex",
                  alignItems: "baseline",
                  gap: 2,
                  padding: "4px 0",
                  color: "var(--ink)",
                  textDecoration: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: sort === "A-Z" ? 18 : sizeOf(i, filtered.length),
                  letterSpacing: "-.01em",
                  lineHeight: 1.1,
                  transition: "color .12s, transform .12s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "var(--accent)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "var(--ink)";
                  e.currentTarget.style.transform = "";
                }}
              >
                <span style={{ color: "var(--accent)" }}>#</span>
                {t.name}
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <div className="acc-empty" style={{ margin: "40px 0 60px" }}>
          <div className="ic">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
          </div>
          <h3>Sin tags que coincidan con &ldquo;{q}&rdquo;</h3>
          <button className="btn ghost" onClick={() => setQ("")}>
            Limpiar búsqueda
          </button>
        </div>
      )}
    </main>
  );
}
