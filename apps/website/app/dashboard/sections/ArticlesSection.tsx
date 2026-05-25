"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";

type ArticleStatus = "DRAFT" | "PUBLISHED" | "REJECTED" | "BANNED";

type Article = {
  id: number;
  title: string;
  slug: string;
  content?: string | null;
  status: ArticleStatus;
  category?: { name: string } | null;
  author?: {
    firstname?: string | null;
    lastname?: string | null;
    email: string;
    handle?: string | null;
  } | null;
  createdAt?: string;
  rejectedReason?: string | null;
};

type StatusFilter = "all" | ArticleStatus;

const STATUS_LABEL: Record<ArticleStatus, string> = {
  DRAFT: "En revisión",
  PUBLISHED: "Publicado",
  REJECTED: "Rechazado",
  BANNED: "Baneado",
};

const STATUS_CLASS: Record<ArticleStatus, string> = {
  DRAFT: "rev",
  PUBLISHED: "pub",
  REJECTED: "rej",
  BANNED: "arc",
};

function authorName(a: Article): string {
  if (!a.author) return "—";
  return [a.author.firstname, a.author.lastname].filter(Boolean).join(" ") || a.author.email;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });
}

// ── Toolbar button ──────────────────────────────────────────────────────────
function ToolbarBtn({ label, title }: { label: string; title?: string }) {
  return (
    <button
      type="button"
      title={title ?? label}
      style={{
        height: 28,
        padding: "0 8px",
        borderRadius: 6,
        background: "var(--surface-2)",
        border: "1px solid var(--line)",
        fontSize: 12,
        fontWeight: 700,
        color: "var(--ink-2)",
        cursor: "default",
        fontFamily: "var(--font-mono)",
      }}
    >
      {label}
    </button>
  );
}

// ── Editor modal ────────────────────────────────────────────────────────────
function EditorModal({
  article: initial,
  token,
  onClose,
  onSave,
}: {
  article: Article;
  token: string;
  onClose: () => void;
  onSave: (updated: Article) => void;
}) {
  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content ?? "");
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleAiSuggest = () => {
    setAiLoading(true);
    toast.info("IA analizando artículo…");
    setTimeout(() => {
      setAiSuggestion(content.trim() + " [corregido por IA]");
      setAiLoading(false);
      toast.success("Sugerencia lista");
    }, 1500);
  };

  const handleAcceptSuggestion = () => {
    if (aiSuggestion !== null) setContent(aiSuggestion);
    setAiSuggestion(null);
    toast.success("Sugerencia aplicada");
  };

  const handleDiscardSuggestion = () => {
    setAiSuggestion(null);
  };

  const patchLocal = (fields: Partial<Article>): Article => ({
    ...initial,
    title,
    content,
    ...fields,
  });

  const handleApprove = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/articles/${initial.id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Error al aprobar el artículo");
      onSave(patchLocal({ status: "PUBLISHED" }));
      toast.success("Artículo aprobado y publicado");
      onClose();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo aprobar");
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (rejectReason.trim().length < 3) {
      toast.error("El motivo debe tener al menos 3 caracteres.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`/api/articles/${initial.id}/reject`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      if (!r.ok) throw new Error("Error al rechazar el artículo");
      onSave(patchLocal({ status: "REJECTED", rejectedReason: rejectReason.trim() }));
      toast.success("Artículo rechazado");
      onClose();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo rechazar");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveDraft = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/articles/${initial.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!r.ok) throw new Error("Error al guardar el borrador");
      onSave(patchLocal({}));
      toast.success("Borrador guardado");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="confirm-bg"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ alignItems: "flex-start", paddingTop: 40 }}
    >
      <div
        className="confirm-card"
        style={{
          maxWidth: aiSuggestion !== null ? 860 : 680,
          width: "95vw",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>
            {initial.status === "PUBLISHED" ? "Editar artículo" : "Revisar artículo"}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: "var(--ink-3)",
              lineHeight: 1,
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>

        {/* Title input */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: "100%",
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 15,
            fontWeight: 600,
            color: "var(--ink)",
            outline: "none",
            marginBottom: 14,
            boxSizing: "border-box",
          }}
          placeholder="Título del artículo"
        />

        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            marginBottom: 8,
            flexWrap: "wrap",
          }}
        >
          <ToolbarBtn label="B" title="Negrita" />
          <ToolbarBtn label="I" title="Cursiva" />
          <ToolbarBtn label="H1" title="Encabezado 1" />
          <ToolbarBtn label="H2" title="Encabezado 2" />
          <ToolbarBtn label="≡" title="Lista" />
          <ToolbarBtn label='"' title="Cita" />
          <span
            style={{
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              letterSpacing: ".12em",
              color: "var(--ink-3)",
              textTransform: "uppercase",
              padding: "0 4px",
            }}
          >
            MARKDOWN
          </span>
          <button
            type="button"
            onClick={handleAiSuggest}
            disabled={aiLoading || busy}
            title="Sugerencia IA"
            style={{
              marginLeft: "auto",
              height: 28,
              padding: "0 10px",
              borderRadius: 6,
              background: aiLoading
                ? "var(--surface-2)"
                : "color-mix(in oklab, var(--accent) 15%, transparent)",
              border: "1px solid color-mix(in oklab, var(--accent) 30%, transparent)",
              fontSize: 13,
              color: aiLoading ? "var(--ink-3)" : "var(--accent)",
              cursor: aiLoading ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontWeight: 600,
            }}
          >
            ✦ {aiLoading ? "Analizando…" : "Sugerir con IA"}
          </button>
        </div>

        {/* Content area — normal or side-by-side */}
        {aiSuggestion !== null ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "var(--ink-3)",
                  marginBottom: 6,
                }}
              >
                Original
              </div>
              <textarea
                value={content}
                readOnly
                style={{
                  width: "100%",
                  minHeight: 260,
                  background: "var(--surface-2)",
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "var(--ink-2)",
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "var(--accent)",
                  marginBottom: 6,
                }}
              >
                Sugerencia IA
              </div>
              <textarea
                value={aiSuggestion}
                readOnly
                style={{
                  width: "100%",
                  minHeight: 260,
                  background: "color-mix(in oklab, var(--accent) 6%, var(--surface))",
                  border: "1px solid color-mix(in oklab, var(--accent) 30%, transparent)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "var(--ink)",
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
              <button
                className="btn primary"
                onClick={handleAcceptSuggestion}
                style={{ fontSize: 13 }}
              >
                Aceptar sugerencia
              </button>
              <button
                className="btn ghost"
                onClick={handleDiscardSuggestion}
                style={{ fontSize: 13 }}
              >
                Descartar
              </button>
            </div>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Contenido del artículo en Markdown…"
            style={{
              width: "100%",
              minHeight: 300,
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 13,
              color: "var(--ink)",
              resize: "vertical",
              outline: "none",
              marginBottom: 14,
              boxSizing: "border-box",
            }}
          />
        )}

        {/* Reject reason sub-form */}
        {showReject && (
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                marginBottom: 6,
              }}
            >
              Motivo del rechazo
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Indica por qué se rechaza el artículo…"
              style={{ marginBottom: 8 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn"
                onClick={handleReject}
                disabled={busy}
                style={{ background: "var(--err)", color: "#fff", fontSize: 13 }}
              >
                {busy ? "Rechazando…" : "Confirmar rechazo"}
              </button>
              <button
                className="btn ghost"
                onClick={() => { setShowReject(false); setRejectReason(""); }}
                disabled={busy}
                style={{ fontSize: 13 }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Primary action bar */}
        {!showReject && (
          <div className="modal-acts" style={{ flexWrap: "wrap", gap: 8 }}>
            {initial.status !== "PUBLISHED" && (
              <button
                className="btn primary"
                onClick={handleApprove}
                disabled={busy}
              >
                {busy ? "Aprobando…" : "Aprobar"}
              </button>
            )}
            <button
              className="btn"
              onClick={() => setShowReject(true)}
              disabled={busy}
              style={{ background: "var(--err)", color: "#fff" }}
            >
              Rechazar
            </button>
            <button
              className="btn ghost"
              onClick={handleSaveDraft}
              disabled={busy}
            >
              {busy ? "Guardando…" : "Guardar borrador"}
            </button>
            <button className="btn ghost" onClick={onClose} disabled={busy} style={{ marginLeft: "auto" }}>
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Ban modal ───────────────────────────────────────────────────────────────
function BanArticleModal({
  article,
  token,
  onClose,
  onDone,
}: {
  article: Article;
  token: string;
  onClose: () => void;
  onDone: (id: number) => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const handleBan = async () => {
    if (reason.trim().length < 3) {
      toast.error("El motivo debe tener al menos 3 caracteres.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`/api/articles/${article.id}/ban`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!r.ok) throw new Error("No se pudo banear el artículo");
      onDone(article.id);
      toast.success("Artículo baneado");
      onClose();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo banear");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="confirm-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="confirm-card">
        <h3>Banear artículo</h3>
        <p>El artículo quedará oculto del sitio. Indica el motivo.</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej: Contenido inapropiado o que viola las normas…"
        />
        <div className="modal-acts">
          <button
            className="btn"
            onClick={handleBan}
            disabled={busy}
            style={{ flex: 1, background: "var(--err)", color: "#fff" }}
          >
            {busy ? "Baneando…" : "Banear artículo"}
          </button>
          <button className="btn ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main section ────────────────────────────────────────────────────────────
export default function ArticlesSection() {
  const { token } = useUser();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statFilter, setStatFilter] = useState<StatusFilter>("all");
  const [busyId, setBusyId] = useState<number | null>(null);

  // Modal state
  const [editorTarget, setEditorTarget] = useState<Article | null>(null);
  const [banTarget, setBanTarget] = useState<Article | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch("/api/articles/admin", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Error al cargar artículos");
        const data = await r.json();
        setArticles(Array.isArray(data) ? data : (data.items ?? []));
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Error al cargar artículos"))
      .finally(() => setLoading(false));
  }, [token]);

  const counts = {
    all: articles.length,
    DRAFT: articles.filter((a) => a.status === "DRAFT").length,
    PUBLISHED: articles.filter((a) => a.status === "PUBLISHED").length,
    REJECTED: articles.filter((a) => a.status === "REJECTED").length,
    BANNED: articles.filter((a) => a.status === "BANNED").length,
  };

  const filtered = useMemo(() => {
    let res = articles;
    if (statFilter !== "all") res = res.filter((a) => a.status === statFilter);
    if (search) {
      const q = search.toLowerCase();
      res = res.filter((a) => a.title.toLowerCase().includes(q));
    }
    return res;
  }, [articles, statFilter, search]);

  const patch = (id: number, fields: Partial<Article>) =>
    setArticles((list) => list.map((x) => (x.id === id ? { ...x, ...fields } : x)));

  const restore = async (a: Article) => {
    if (!token) return;
    setBusyId(a.id);
    try {
      const r = await fetch(`/api/articles/${a.id}/restore`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("No se pudo restaurar el artículo");
      patch(a.id, { status: "DRAFT" });
      toast.success("Artículo restaurado — vuelve a revisión");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo restaurar");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="filterbar">
        <div className="search-shell" style={{ flex: 1 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--ink-3)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            placeholder="Buscar artículo por título…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ background: "none", border: "none", color: "var(--ink-3)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0 }}
            >
              ×
            </button>
          )}
        </div>
        <select
          className="sel"
          value={statFilter}
          onChange={(e) => setStatFilter(e.target.value as StatusFilter)}
        >
          <option value="all">Todos ({counts.all})</option>
          <option value="DRAFT">En revisión ({counts.DRAFT})</option>
          <option value="PUBLISHED">Publicado ({counts.PUBLISHED})</option>
          <option value="REJECTED">Rechazado ({counts.REJECTED})</option>
          <option value="BANNED">Baneado ({counts.BANNED})</option>
        </select>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="empty">
            <h3>Cargando artículos…</h3>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="ic">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3>Sin resultados</h3>
            <p>No hay artículos con esos filtros.</p>
          </div>
        ) : (
          <table className="evt">
            <thead>
              <tr>
                <th>Título</th>
                <th>Autor / Organizador</th>
                <th>Categoría</th>
                <th>Fecha envío</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const isBusy = busyId === a.id;
                return (
                  <tr key={a.id}>
                    {/* Título */}
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.3, marginBottom: 3 }}>
                        {a.title}
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-3)" }}>
                        #{a.id} · /{a.slug}
                      </div>
                    </td>
                    {/* Autor */}
                    <td>
                      <div className="cell-prod">
                        <div className="nm">{authorName(a)}</div>
                        <div className="em">{a.author?.email ?? ""}</div>
                      </div>
                    </td>
                    {/* Categoría */}
                    <td>{a.category?.name ?? "—"}</td>
                    {/* Fecha */}
                    <td>
                      <div className="cell-date">
                        <div className="d">{formatDate(a.createdAt)}</div>
                      </div>
                    </td>
                    {/* Estado */}
                    <td>
                      <div className={`stat ${STATUS_CLASS[a.status]}`}>
                        <span className="dot" />
                        {STATUS_LABEL[a.status]}
                      </div>
                    </td>
                    {/* Acciones */}
                    <td>
                      <div className="row-acts">
                        {a.status === "DRAFT" && (
                          <button className="ok" onClick={() => setEditorTarget(a)} disabled={isBusy}>
                            Revisar
                          </button>
                        )}
                        {a.status === "PUBLISHED" && (
                          <>
                            <button onClick={() => setEditorTarget(a)} disabled={isBusy}>
                              Editar
                            </button>
                            <button className="bad" onClick={() => setBanTarget(a)} disabled={isBusy}>
                              Banear
                            </button>
                          </>
                        )}
                        {(a.status === "REJECTED" || a.status === "BANNED") && (
                          <button onClick={() => restore(a)} disabled={isBusy}>
                            Restaurar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Editor modal */}
      {editorTarget && token && (
        <EditorModal
          article={editorTarget}
          token={token}
          onClose={() => setEditorTarget(null)}
          onSave={(updated) => {
            patch(updated.id, updated);
            setEditorTarget(null);
          }}
        />
      )}

      {/* Ban modal */}
      {banTarget && token && (
        <BanArticleModal
          article={banTarget}
          token={token}
          onClose={() => setBanTarget(null)}
          onDone={(id) => patch(id, { status: "BANNED" })}
        />
      )}
    </>
  );
}
