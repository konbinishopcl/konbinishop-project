"use client";
import { useState } from "react";
import Link from "next/link";
import type { ApiArticleTag } from "@/lib/api";

function pageWindows(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [];
  const add = (p: number) => { if (!pages.includes(p)) pages.push(p); };
  add(1);
  if (current > 3) pages.push("…");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) add(p);
  if (current < total - 2) pages.push("…");
  add(total);
  return pages;
}

const ChevL = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ChevR = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const ArrowR = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const PER_PAGE_OPTIONS = [24, 48, 96] as const;
const SORT_OPTIONS = ["A-Z", "Más artículos"] as const;

interface Props {
  tags: ApiArticleTag[];
}

export function NoticiasTagsView({ tags }: Props) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<string>("A-Z");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(PER_PAGE_OPTIONS[0]);

  let filtered = tags.filter(
    (t) => !q.trim() || t.name.toLowerCase().includes(q.toLowerCase())
  );

  if (sort === "A-Z") {
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name, "es"));
  } else {
    filtered = [...filtered].sort((a, b) => (b._count?.articles ?? 0) - (a._count?.articles ?? 0));
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage);
  const from = total === 0 ? 0 : (safePage - 1) * perPage + 1;
  const to   = Math.min(safePage * perPage, total);

  function changeSort(s: string) { setSort(s); setPage(1); }
  function changeQ(v: string) { setQ(v); setPage(1); }

  return (
    <main className="container">
      {/* ── BACK ─────────────────────────────────────────────────── */}
      <Link
        href="/noticias"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink-3)", fontSize: 13, marginTop: 24, marginBottom: 4 }}
      >
        <ChevL /> Volver a noticias
      </Link>

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div style={{ margin: "8px 0 36px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div className="eyebrow">NOTICIAS · タグ</div>
          <h1
            className="display"
            style={{ fontSize: "clamp(48px,6vw,80px)", margin: "12px 0 8px", letterSpacing: "-.035em", lineHeight: 0.95 }}
          >
            Tags<span style={{ color: "var(--accent)" }}>.</span>
          </h1>
          <p style={{ color: "var(--ink-2)", margin: 0, maxWidth: "62ch", fontSize: 16 }}>
            <strong style={{ color: "var(--ink)" }}>{tags.length} tags activos</strong>
            {" "}· generados por IA al aprobar artículos.
          </p>
        </div>
      </div>

      {/* ── SEARCH + SORT BAR ───────────────────────────────────── */}
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
              onChange={(e) => changeQ(e.target.value)}
              style={{ padding: 0, background: "transparent" }}
            />
            {q && (
              <button onClick={() => changeQ("")} className="icon-btn" style={{ width: 28, height: 28 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="group" style={{ marginLeft: "auto" }}>
            {SORT_OPTIONS.map((s) => (
              <button key={s} className={`sel ${sort === s ? "on" : ""}`} onClick={() => changeSort(s)}>
                {s}
              </button>
            ))}
            <span className="sel" style={{ background: "transparent", border: 0, color: "var(--ink-3)" }}>
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* ── GRID 3 COLUMNAS ─────────────────────────────────────── */}
      {paginated.length > 0 ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 14,
              marginTop: 8,
            }}
          >
            {paginated.map((t) => (
              <Link key={t.slug} href={`/noticias/tags/${t.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
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
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, letterSpacing: "-.015em" }}>
                    <span style={{ color: "var(--accent)" }}>#</span>{t.name}
                  </span>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 4 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)", letterSpacing: ".1em" }}>
                      {t._count?.articles ?? 0} artículos
                    </span>
                    <span style={{ color: "var(--accent)" }}><ArrowR /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* ── PAGINACIÓN ──────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="pag-bar">
              <div className="pag-info">
                <span>
                  Mostrando{" "}
                  <strong style={{ color: "var(--ink)" }}>{from}–{to}</strong>
                  {" "}de{" "}
                  <strong style={{ color: "var(--ink)" }}>{total}</strong>
                  {" "}tag{total !== 1 ? "s" : ""}
                </span>
                <span style={{ color: "var(--line)" }}>·</span>
                <span className="ips">
                  <span>Mostrar</span>
                  <select
                    value={perPage}
                    onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                  >
                    {PER_PAGE_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <span>por página</span>
                </span>
              </div>
              <div className="pag-pages">
                <button onClick={() => setPage((p) => p - 1)} disabled={safePage <= 1} title="Anterior">
                  <ChevL />
                </button>
                {pageWindows(safePage, totalPages).map((p, i) =>
                  p === "…" ? (
                    <span key={`ell-${i}`} className="ell">…</span>
                  ) : (
                    <button
                      key={p}
                      className={p === safePage ? "on" : ""}
                      onClick={() => setPage(p as number)}
                    >
                      {p}
                    </button>
                  )
                )}
                <button onClick={() => setPage((p) => p + 1)} disabled={safePage >= totalPages} title="Siguiente">
                  <ChevR />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="acc-empty" style={{ margin: "40px 0 60px" }}>
          <div className="ic">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
          </div>
          <h3>Sin tags que coincidan con &ldquo;{q}&rdquo;</h3>
          <button className="btn ghost" onClick={() => changeQ("")}>Limpiar búsqueda</button>
        </div>
      )}
    </main>
  );
}
