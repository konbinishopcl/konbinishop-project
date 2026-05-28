"use client";
import { useState } from "react";
import Link from "next/link";
import type { ApiArticleCategory } from "@/lib/api";

const ChevL = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ArrowR = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

interface Props {
  categories: ApiArticleCategory[];
}

export function NoticiasCategoriasView({ categories }: Props) {
  const [q, setQ] = useState("");

  const filtered = categories
    .filter((c) =>
      !q.trim() ||
      (c.name ?? c.slug).toLowerCase().includes(q.toLowerCase()) ||
      (c.nameJa ?? "").toLowerCase().includes(q.toLowerCase())
    )
    .sort((a, b) => (a.name ?? a.slug).localeCompare(b.name ?? b.slug, "es"));

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
      <div style={{ margin: "8px 0 36px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div className="eyebrow">NOTICIAS · カテゴリ</div>
          <h1
            className="display"
            style={{ fontSize: "clamp(48px,6vw,80px)", margin: "12px 0 8px", letterSpacing: "-.035em", lineHeight: 0.95 }}
          >
            Categorías<span style={{ color: "var(--accent)" }}>.</span>
          </h1>
          <p style={{ color: "var(--ink-2)", margin: 0, maxWidth: "62ch", fontSize: 16 }}>
            <strong style={{ color: "var(--ink)" }}>{categories.length} secciones editoriales</strong>
            {" "}· cada artículo se cataloga en una categoría al ser publicado.
          </p>
        </div>
      </div>

      {/* ── SEARCH BAR ─────────────────────────────────────────────── */}
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
              placeholder="Buscar categoría…"
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
            <span
              className="sel"
              style={{ background: "transparent", border: 0, color: "var(--ink-3)" }}
            >
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* ── GRID ───────────────────────────────────────────────────── */}
      {filtered.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 14,
            marginTop: 8,
          }}
        >
          {filtered.map((c) => (
            <Link
              key={c.slug}
              href={`/noticias/categorias/${c.slug}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  alignItems: "stretch",
                  padding: "20px 22px",
                  borderRadius: 18,
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  cursor: "pointer",
                  transition: "transform .15s, border-color .15s",
                  height: "100%",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.transform = "translateY(-3px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = "var(--line)";
                  e.currentTarget.style.transform = "";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: 22,
                      letterSpacing: "-.015em",
                    }}
                  >
                    {c.name ?? c.slug}
                  </span>
                  {c.nameJa && (
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--ink-3)",
                        letterSpacing: ".06em",
                      }}
                    >
                      {c.nameJa}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "auto",
                    paddingTop: 4,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--ink-3)",
                      letterSpacing: ".1em",
                    }}
                  >
                    {c._count?.articles ?? 0} artículos
                  </span>
                  <span style={{ color: "var(--accent)" }}>
                    <ArrowR />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="acc-empty" style={{ margin: "40px 0 60px" }}>
          <div className="ic">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
          </div>
          <h3>Sin categorías que coincidan con &ldquo;{q}&rdquo;</h3>
          <button className="btn ghost" onClick={() => setQ("")}>
            Limpiar búsqueda
          </button>
        </div>
      )}
    </main>
  );
}
