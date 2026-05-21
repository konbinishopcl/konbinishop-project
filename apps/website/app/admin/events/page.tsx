"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Ic } from "@/components/admin/icons";
import { ALL_EVENTS, CATS, STATS, STAT_LABEL, fmt } from "@/lib/admin-data";

type Sort = { k: string; d: "asc" | "desc" };
type Option = { v: string; l: string };

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [statFilter, setStatFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sort, setSort] = useState<Sort>({ k: "created", d: "desc" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const toggleSort = (k: string) => {
    setSort((s) => (s.k === k ? { k, d: s.d === "asc" ? "desc" : "asc" } : { k, d: "asc" }));
  };

  const filtered = useMemo(() => {
    let res = ALL_EVENTS;
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          e.producer.nm.toLowerCase().includes(q),
      );
    }
    if (statFilter !== "all") res = res.filter((e) => e.status === statFilter);
    if (catFilter !== "all") res = res.filter((e) => e.cat === catFilter);
    if (priceFilter === "free") res = res.filter((e) => e.price === 0);
    if (priceFilter === "paid") res = res.filter((e) => e.price > 0);

    res = [...res].sort((a, b) => {
      const dir = sort.d === "asc" ? 1 : -1;
      if (sort.k === "title") return a.title.localeCompare(b.title) * dir;
      if (sort.k === "price") return (a.price - b.price) * dir;
      if (sort.k === "sold") return (a.sold - b.sold) * dir;
      return a.id.localeCompare(b.id) * dir;
    });
    return res;
  }, [search, statFilter, catFilter, priceFilter, sort]);

  useEffect(() => {
    setPage(1);
  }, [search, statFilter, catFilter, priceFilter, dateFilter, perPage]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const pageStart = (page - 1) * perPage;
  const pageItems = filtered.slice(pageStart, pageStart + perPage);

  const toggleAll = () => {
    const ns = new Set(selected);
    if (pageItems.every((e) => selected.has(e.id))) {
      pageItems.forEach((e) => ns.delete(e.id));
    } else {
      pageItems.forEach((e) => ns.add(e.id));
    }
    setSelected(ns);
  };
  const toggleOne = (id: string) => {
    const ns = new Set(selected);
    if (ns.has(id)) ns.delete(id);
    else ns.add(id);
    setSelected(ns);
  };
  const allOn = pageItems.length > 0 && pageItems.every((e) => selected.has(e.id));

  const activeChips: { k: string; lbl: string; onX: () => void }[] = [];
  if (statFilter !== "all")
    activeChips.push({ k: "stat", lbl: STAT_LABEL[statFilter as keyof typeof STAT_LABEL], onX: () => setStatFilter("all") });
  if (catFilter !== "all") activeChips.push({ k: "cat", lbl: catFilter, onX: () => setCatFilter("all") });
  if (priceFilter !== "all")
    activeChips.push({ k: "price", lbl: priceFilter === "free" ? "Gratis" : "De pago", onX: () => setPriceFilter("all") });
  if (dateFilter !== "all") activeChips.push({ k: "date", lbl: dateFilter, onX: () => setDateFilter("all") });

  const pageNums = useMemo<(number | string)[]>(() => {
    const out: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) out.push(i);
    } else {
      out.push(1);
      if (page > 3) out.push("…");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) out.push(i);
      if (page < totalPages - 2) out.push("…");
      out.push(totalPages);
    }
    return out;
  }, [page, totalPages]);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">CATÁLOGO · イベント</div>
          <h1>
            Eventos <span style={{ color: "var(--accent)" }}>.</span>
          </h1>
          <div className="sub">
            Administra publicaciones, revisa solicitudes, edita información y controla la visibilidad
            pública.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn ghost sm">{Ic.dl} Exportar CSV</button>
          <button className="btn primary sm">{Ic.plus} Crear evento</button>
        </div>
      </div>

      <div className="filterbar">
        <div className="search-shell">
          {Ic.search}
          <input
            placeholder="Buscar por título, ID o productor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => setSearch("")}>
              {Ic.close}
            </button>
          )}
        </div>
        <FilterSelect
          label="Estado"
          value={statFilter}
          setValue={setStatFilter}
          options={[{ v: "all", l: "Todos" }, ...STATS.map((s) => ({ v: s, l: STAT_LABEL[s] }))]}
        />
        <FilterSelect
          label="Categoría"
          value={catFilter}
          setValue={setCatFilter}
          options={[{ v: "all", l: "Todas" }, ...CATS.map((c) => ({ v: c, l: c }))]}
        />
        <FilterSelect
          label="Precio"
          value={priceFilter}
          setValue={setPriceFilter}
          options={[
            { v: "all", l: "Todos" },
            { v: "free", l: "Gratuitos" },
            { v: "paid", l: "Pagados" },
          ]}
        />
        <FilterSelect
          label="Fecha"
          value={dateFilter}
          setValue={setDateFilter}
          options={[
            { v: "all", l: "Cualquiera" },
            { v: "hoy", l: "Hoy" },
            { v: "semana", l: "Esta semana" },
            { v: "mes", l: "Este mes" },
            { v: "futuros", l: "Próximos" },
          ]}
        />
        <button className="btn ghost sm" style={{ marginLeft: "auto" }}>{Ic.flt} Más filtros</button>
      </div>

      {activeChips.length > 0 && (
        <div className="chips">
          <span className="eyebrow" style={{ alignSelf: "center", marginRight: 4 }}>
            FILTROS ACTIVOS
          </span>
          {activeChips.map((c) => (
            <span key={c.k} className="chip">
              {c.lbl}
              <span className="x" onClick={c.onX}>{Ic.close}</span>
            </span>
          ))}
          <span
            className="chip-clear"
            onClick={() => {
              setStatFilter("all");
              setCatFilter("all");
              setPriceFilter("all");
              setDateFilter("all");
            }}
          >
            Limpiar todo
          </span>
        </div>
      )}

      <div className="table-wrap">
        {selected.size > 0 && (
          <div className="bulkbar">
            <div className="ct">
              <span className="n">{selected.size}</span> evento{selected.size !== 1 ? "s" : ""}{" "}
              seleccionado{selected.size !== 1 ? "s" : ""}
            </div>
            <div className="acts">
              <button className="btn ghost sm">{Ic.check} Aprobar</button>
              <button className="btn ghost sm">{Ic.x} Rechazar</button>
              <button className="btn ghost sm">{Ic.dl} Exportar</button>
              <button className="btn ghost sm" style={{ color: "var(--err)" }}>{Ic.trash} Archivar</button>
              <button className="btn ghost sm" onClick={() => setSelected(new Set())}>Cancelar</button>
            </div>
          </div>
        )}

        {pageItems.length === 0 ? (
          <div className="empty">
            <div className="ic">{Ic.search}</div>
            <h3>Sin resultados</h3>
            <p>
              No encontramos eventos con esos filtros. Prueba limpiar la búsqueda o cambiar la
              categoría.
            </p>
          </div>
        ) : (
          <table className="evt">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <div className={`ck ${allOn ? "on" : ""}`} onClick={toggleAll}>
                    {allOn && Ic.check}
                  </div>
                </th>
                <SortTh k="title" cur={sort} onClick={toggleSort}>Evento</SortTh>
                <th>Productor</th>
                <SortTh k="date" cur={sort} onClick={toggleSort}>Fecha &amp; venue</SortTh>
                <SortTh k="price" cur={sort} onClick={toggleSort}>Precio</SortTh>
                <SortTh k="sold" cur={sort} onClick={toggleSort}>Ventas</SortTh>
                <th>Estado</th>
                <th style={{ textAlign: "right" }} />
              </tr>
            </thead>
            <tbody>
              {pageItems.map((e) => {
                const sel = selected.has(e.id);
                const pct = e.stock === 0 ? 0 : Math.round((e.sold / e.stock) * 100);
                return (
                  <tr key={e.id}>
                    <td>
                      <div className={`ck ${sel ? "on" : ""}`} onClick={() => toggleOne(e.id)}>
                        {sel && Ic.check}
                      </div>
                    </td>
                    <td>
                      <div className="cell-evt">
                        <div className="thumb"><div className={`poster-art ${e.art}`} /></div>
                        <div>
                          <div className="ti">
                            {e.title}
                            {e.featured && (
                              <span className="pill accent" style={{ marginLeft: 8, padding: "2px 7px", fontSize: 9.5 }}>
                                ★ DESTACADO
                              </span>
                            )}
                          </div>
                          <div className="mt">
                            <span className="id">{e.id}</span> · {e.cat.toUpperCase()} · {e.ja}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="cell-prod">
                        <div className="nm">{e.producer.nm}</div>
                        <div className="em">{e.producer.em}</div>
                      </div>
                    </td>
                    <td>
                      <div className="cell-date">
                        <div className="d">{e.date}</div>
                        <div className="t">{e.time} · {e.venue}</div>
                      </div>
                    </td>
                    <td>
                      <div className="cell-price">
                        {e.price === 0 ? (
                          <span className="free">Gratis</span>
                        ) : (
                          <>
                            ${fmt(e.price)} <span style={{ color: "var(--ink-3)" }}>CLP</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="cell-sales">
                        <div>
                          {fmt(e.sold)} <span style={{ color: "var(--ink-3)" }}>/ {fmt(e.stock)}</span>
                        </div>
                        <div className="pct">{pct}% vendido</div>
                        <div className="bar">
                          <div
                            className="fill"
                            style={{
                              width: `${pct}%`,
                              background: pct > 80 ? "var(--ok)" : pct > 40 ? "var(--accent)" : "var(--warn)",
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={`stat ${e.status}`}>
                        <span className="dot" />
                        {STAT_LABEL[e.status]}
                      </div>
                    </td>
                    <td>
                      <div className="row-acts" style={{ position: "relative" }}>
                        <button title="Ver">{Ic.eye}</button>
                        <button title="Editar">{Ic.edit}</button>
                        <button title="Más" onClick={() => setOpenMenu(openMenu === e.id ? null : e.id)}>
                          {Ic.dots}
                        </button>
                        {openMenu === e.id && (
                          <div className="menu-pop" onMouseLeave={() => setOpenMenu(null)}>
                            <button>{Ic.eye} Ver en sitio público</button>
                            <button>{Ic.edit} Editar publicación</button>
                            {e.status === "rev" && (
                              <>
                                <div className="sep" />
                                <button style={{ color: "var(--ok)" }}>{Ic.check} Aprobar y publicar</button>
                                <button style={{ color: "var(--err)" }}>{Ic.x} Rechazar</button>
                              </>
                            )}
                            <button>★ {e.featured ? "Quitar destacado" : "Marcar destacado"}</button>
                            <button>{Ic.dl} Duplicar</button>
                            <div className="sep" />
                            <button className="danger">{Ic.trash} Archivar</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div className="pag">
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <div className="info">
              Mostrando <strong>{total === 0 ? 0 : pageStart + 1}</strong>–
              <strong>{Math.min(pageStart + perPage, total)}</strong> de <strong>{total}</strong>{" "}
              resultados
            </div>
            <div className="per-page">
              Por página:
              <select value={perPage} onChange={(e) => setPerPage(+e.target.value)}>
                <option>10</option>
                <option>20</option>
                <option>50</option>
                <option>100</option>
              </select>
            </div>
          </div>
          <div className="nums">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>{Ic.chevL}</button>
            {pageNums.map((n, i) =>
              n === "…" ? (
                <span key={i} className="ell">…</span>
              ) : (
                <button key={i} className={n === page ? "on" : ""} onClick={() => setPage(n as number)}>
                  {n}
                </button>
              ),
            )}
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>{Ic.chevR}</button>
          </div>
        </div>
      </div>
    </>
  );
}

function SortTh({
  k,
  cur,
  onClick,
  children,
}: {
  k: string;
  cur: Sort;
  onClick: (k: string) => void;
  children: React.ReactNode;
}) {
  const sorted = cur.k === k;
  return (
    <th className={`sortable ${sorted ? "sorted" : ""}`} onClick={() => onClick(k)}>
      {children}
      <span className="arr">{sorted ? (cur.d === "asc" ? "↑" : "↓") : "↕"}</span>
    </th>
  );
}

function FilterSelect({
  label,
  value,
  setValue,
  options,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  options: Option[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const curr = options.find((o) => o.v === value) || options[0];
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className={`select ${value !== "all" ? "on" : ""}`} onClick={() => setOpen((o) => !o)}>
        <span style={{ color: "inherit", opacity: 0.75 }}>{label}:</span>
        <span className="v">{curr.l}</span>
        {Ic.chevD}
      </button>
      {open && (
        <div className="menu-pop" style={{ left: 0, right: "auto", minWidth: 180 }}>
          {options.map((o) => (
            <button
              key={o.v}
              onClick={() => {
                setValue(o.v);
                setOpen(false);
              }}
              style={value === o.v ? { background: "var(--surface-2)", color: "var(--ink)" } : {}}
            >
              {value === o.v && <span style={{ color: "var(--accent)" }}>{Ic.check}</span>}
              <span style={{ marginLeft: value === o.v ? 0 : 19 }}>{o.l}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
