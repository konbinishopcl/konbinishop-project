"use client";
import { useState } from "react";

// ── pageWindows ────────────────────────────────────────────────────────────────

export function pageWindows(current: number, total: number): (number | "…")[] {
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

// ── useClientPagination ────────────────────────────────────────────────────────

export const DEFAULT_PER_PAGE_OPTIONS = [20, 50, 100] as const;

export function useClientPagination<T>(items: T[], defaultPerPage = 20) {
  const [page, setPage]       = useState(1);
  const [perPage, setPerPage] = useState(defaultPerPage);

  const total      = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage   = Math.min(page, totalPages);
  const from       = total === 0 ? 0 : (safePage - 1) * perPage + 1;
  const to         = Math.min(safePage * perPage, total);
  const paginated  = items.slice((safePage - 1) * perPage, safePage * perPage);

  function changePerPage(ps: number) { setPerPage(ps); setPage(1); }
  function goPage(p: number)         { setPage(Math.max(1, Math.min(p, totalPages))); }

  return { page: safePage, goPage, perPage, changePerPage, total, totalPages, from, to, paginated };
}

// ── TablePagination ────────────────────────────────────────────────────────────

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

interface TablePaginationProps {
  page:             number;
  totalPages:       number;
  total:            number;
  from:             number;
  to:               number;
  perPage:          number;
  perPageOptions?:  number[];
  noun?:            string;
  onPageChange:     (page: number) => void;
  onPerPageChange:  (perPage: number) => void;
}

export function TablePagination({
  page,
  totalPages,
  total,
  from,
  to,
  perPage,
  perPageOptions = [20, 50, 100],
  noun = "resultado",
  onPageChange,
  onPerPageChange,
}: TablePaginationProps) {
  if (total === 0) return null;

  return (
    <div className="pag-bar">
      <div className="pag-info">
        <span>
          Mostrando{" "}
          <strong style={{ color: "var(--ink)" }}>{from}–{to}</strong>
          {" "}de{" "}
          <strong style={{ color: "var(--ink)" }}>{total}</strong>
          {" "}{noun}{total !== 1 ? "s" : ""}
        </span>
        <span style={{ color: "var(--line)" }}>·</span>
        <span className="ips">
          <span>Mostrar</span>
          <select value={perPage} onChange={(e) => onPerPageChange(Number(e.target.value))}>
            {perPageOptions.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <span>por página</span>
        </span>
      </div>
      <div className="pag-pages">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1} title="Anterior">
          <ChevL />
        </button>
        {pageWindows(page, totalPages).map((p, i) =>
          p === "…" ? (
            <span key={`ell-${i}`} className="ell">…</span>
          ) : (
            <button key={p} className={page === p ? "on" : ""} onClick={() => onPageChange(p)}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages} title="Siguiente">
          <ChevR />
        </button>
      </div>
    </div>
  );
}
