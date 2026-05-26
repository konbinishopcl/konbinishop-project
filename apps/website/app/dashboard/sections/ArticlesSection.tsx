"use client";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";

type ArticleStatus = "DRAFT" | "PUBLISHED" | "REJECTED" | "BANNED";

type Article = {
  id: number;
  title: string;
  slug: string;
  content: string;
  status: ArticleStatus;
  category: string;
  author: string;
  authorEmail: string;
  submittedAt: string;
};

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

const MOCK_ARTICLES: Article[] = [
  {
    id: 1,
    title: "Guía completa de festivales de verano en Chile",
    slug: "guia-festivales-verano-chile",
    content:
      "## Festivales de verano\n\nEste verano promete ser increíble con una serie de festivales que se realizarán a lo largo del país. Desde Arica hasta Punta Arenas, la cultura y la música estarán presentes.\n\n### Norte\n\nEn el norte del país, el Festival del Desierto se realizará en enero con artistas nacionales e internacionales.",
    status: "DRAFT",
    category: "Cultura",
    author: "María Pérez",
    authorEmail: "maria@ejemplo.cl",
    submittedAt: "2026-05-20T10:30:00Z",
  },
  {
    id: 2,
    title: "10 spots imperdibles de street food en Santiago",
    slug: "street-food-santiago",
    content:
      "# Street food en Santiago\n\nLa escena culinaria callejera de Santiago ha crecido exponencialmente en los últimos años. Aquí te presentamos los 10 mejores lugares donde puedes disfrutar de comida de calle de calidad.\n\n## Barrio Italia\n\nEl barrio Italia se ha convertido en el epicentro del street food capitalino.",
    status: "PUBLISHED",
    category: "Gastronomía",
    author: "Carlos Muñoz",
    authorEmail: "carlos@foodblog.cl",
    submittedAt: "2026-05-18T14:15:00Z",
  },
  {
    id: 3,
    title: "Cómo organizar tu primer evento cultural independiente",
    slug: "organizar-evento-cultural-independiente",
    content:
      "Organizar un evento cultural puede parecer abrumador, pero con la planificación correcta es completamente posible. En este artículo te explicamos paso a paso cómo hacerlo.\n\n**Presupuesto inicial:** Lo primero es definir un presupuesto realista considerando venue, equipamiento, artistas y promoción.",
    status: "REJECTED",
    category: "Guías",
    author: "Javiera Lagos",
    authorEmail: "javiera@cultura.cl",
    submittedAt: "2026-05-15T09:00:00Z",
  },
  {
    id: 4,
    title: "El auge de los festivales de música electrónica en Latinoamérica",
    slug: "festivales-electronica-latinoamerica",
    content:
      "La música electrónica ha tomado por asalto los festivales de toda Latinoamérica. Con propuestas que van desde el techno underground hasta el house más comercial, la escena no para de crecer.\n\n> La cultura rave ha encontrado en Chile un ecosistema perfecto para desarrollarse.\n\nArtistas locales como [Valentina Luz](https://ejemplo.cl) lideran este movimiento.",
    status: "BANNED",
    category: "Música",
    author: "Diego Soto",
    authorEmail: "diego@rave.cl",
    submittedAt: "2026-05-10T16:45:00Z",
  },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Toolbar helpers ─────────────────────────────────────────────────────────

type TextareaRef = React.RefObject<HTMLTextAreaElement | null>;

function wrapSelection(
  ref: TextareaRef,
  getValue: () => string,
  setValue: (v: string) => void,
  before: string,
  after: string,
) {
  const el = ref.current;
  if (!el) return;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const text = getValue();
  const selected = text.slice(start, end) || "texto";
  const newText = text.slice(0, start) + before + selected + after + text.slice(end);
  setValue(newText);
  setTimeout(() => {
    el.focus();
    el.setSelectionRange(start + before.length, start + before.length + selected.length);
  }, 0);
}

function prependLine(
  ref: TextareaRef,
  getValue: () => string,
  setValue: (v: string) => void,
  prefix: string,
) {
  const el = ref.current;
  if (!el) return;
  const start = el.selectionStart;
  const text = getValue();
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const newText = text.slice(0, lineStart) + prefix + text.slice(lineStart);
  setValue(newText);
  setTimeout(() => {
    el.focus();
    el.setSelectionRange(start + prefix.length, start + prefix.length);
  }, 0);
}

function ToolbarBtn({
  label,
  title,
  onClick,
}: {
  label: string;
  title?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title ?? label}
      onClick={onClick}
      style={{
        height: 28,
        padding: "0 8px",
        borderRadius: 6,
        background: "var(--surface-2)",
        border: "1px solid var(--line)",
        fontSize: 12,
        fontWeight: 700,
        color: "var(--ink-2)",
        cursor: "pointer",
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
  onSave: (updated: Partial<Article> & { id: number }) => void;
}) {
  const [content, setContent] = useState(initial.content);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wrap = (before: string, after: string) =>
    wrapSelection(textareaRef, () => content, setContent, before, after);
  const prepend = (prefix: string) =>
    prependLine(textareaRef, () => content, setContent, prefix);

  const handleAiSuggest = () => {
    setAiLoading(true);
    toast.info("IA analizando artículo…");
    setTimeout(() => {
      const suggested =
        content
          .replace(/\s+/g, " ")
          .trim()
          .replace(/([.!?]) ([A-ZÁÉÍÓÚ])/g, "$1\n\n$2") + "\n\n*Revisado y mejorado por IA.*";
      setAiSuggestion(suggested);
      setAiLoading(false);
      toast.success("Sugerencia lista");
    }, 1500);
  };

  const handleAcceptSuggestion = () => {
    if (aiSuggestion !== null) setContent(aiSuggestion);
    setAiSuggestion(null);
    toast.success("Sugerencia aplicada");
  };

  const handleSaveDraft = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/articles/${initial.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!r.ok) throw new Error("Error al guardar el borrador");
      onSave({ id: initial.id, content });
      toast.success("Borrador guardado");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/articles/${initial.id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Error al aprobar el artículo");
      onSave({ id: initial.id, content, status: "PUBLISHED" });
      toast.success("Artículo aprobado y publicado");
      onClose();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo aprobar");
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
          maxWidth: aiSuggestion !== null ? 880 : 700,
          width: "95vw",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
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

        {/* Article meta */}
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--ink-3)",
            marginBottom: 14,
          }}
        >
          {initial.title} · {initial.author} · {initial.category}
        </div>

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
          <ToolbarBtn label="B" title="Negrita" onClick={() => wrap("**", "**")} />
          <ToolbarBtn label="I" title="Cursiva" onClick={() => wrap("*", "*")} />
          <ToolbarBtn label="H1" title="Encabezado 1" onClick={() => prepend("# ")} />
          <ToolbarBtn label="H2" title="Encabezado 2" onClick={() => prepend("## ")} />
          <ToolbarBtn label="≡" title="Lista" onClick={() => prepend("- ")} />
          <ToolbarBtn label='"' title="Cita" onClick={() => prepend("> ")} />
          <ToolbarBtn
            label="🔗"
            title="Link"
            onClick={() => wrap("[", "](url)")}
          />
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

        {/* Content area — normal or side-by-side diff */}
        {aiSuggestion !== null ? (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}
          >
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
                  minHeight: 280,
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
                  minHeight: 280,
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
                Aceptar
              </button>
              <button
                className="btn ghost"
                onClick={() => setAiSuggestion(null)}
                style={{ fontSize: 13 }}
              >
                Descartar
              </button>
            </div>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Contenido del artículo en Markdown…"
            style={{
              width: "100%",
              minHeight: 320,
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

        {/* Action bar */}
        <div className="modal-acts" style={{ flexWrap: "wrap", gap: 8 }}>
          <button className="btn primary" onClick={handleApprove} disabled={busy}>
            {busy ? "Aprobando…" : "Aprobar"}
          </button>
          <button className="btn ghost" onClick={handleSaveDraft} disabled={busy}>
            {busy ? "Guardando…" : "Guardar borrador"}
          </button>
          <button
            className="btn ghost"
            onClick={onClose}
            disabled={busy}
            style={{ marginLeft: "auto" }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reject modal ────────────────────────────────────────────────────────────
function RejectModal({
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

  const handleReject = async () => {
    if (reason.trim().length < 3) {
      toast.error("El motivo debe tener al menos 3 caracteres.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`/api/articles/${article.id}/reject`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!r.ok) throw new Error("Error al rechazar el artículo");
      onDone(article.id);
      toast.success("Artículo rechazado");
      onClose();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo rechazar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="confirm-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="confirm-card">
        <h3>Rechazar artículo</h3>
        <p>Indica el motivo. El autor lo verá en su panel.</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej: El contenido no cumple con las normas de la plataforma…"
        />
        <div className="modal-acts">
          <button
            className="btn"
            onClick={handleReject}
            disabled={busy}
            style={{ flex: 1, background: "var(--err)", color: "#fff" }}
          >
            {busy ? "Rechazando…" : "Rechazar artículo"}
          </button>
          <button className="btn ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Ban modal ───────────────────────────────────────────────────────────────
function BanModal({
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

// ── Transfer modal ──────────────────────────────────────────────────────────
type MockUser = { id: number; name: string; email: string; handle: string };

const MOCK_USERS: MockUser[] = [
  { id: 10, name: "Ana Rodríguez", email: "ana@konbini.cl", handle: "ana_rod" },
  { id: 11, name: "Pedro Castillo", email: "pedro@konbini.cl", handle: "pcastillo" },
  { id: 12, name: "Sofía Vargas", email: "sofia@konbini.cl", handle: "sofiavargas" },
  { id: 13, name: "Tomás Herrera", email: "tomas@konbini.cl", handle: "tomasherrera" },
  { id: 14, name: "Valentina Cruz", email: "vcruz@konbini.cl", handle: "vcruz" },
];

function TransferModal({
  article,
  token,
  onClose,
  onDone,
}: {
  article: Article;
  token: string;
  onClose: () => void;
  onDone: (id: number, newAuthor: string) => void;
}) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<MockUser | null>(null);
  const [busy, setBusy] = useState(false);

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const lower = q.toLowerCase();
    return MOCK_USERS.filter(
      (u) =>
        u.name.toLowerCase().includes(lower) ||
        u.email.toLowerCase().includes(lower) ||
        u.handle.toLowerCase().includes(lower),
    ).slice(0, 5);
  }, [q]);

  const handleTransfer = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/articles/${article.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ authorId: selected.id }),
      });
      if (!r.ok) throw new Error("No se pudo transferir el artículo");
      onDone(article.id, selected.name);
      toast.success(`Artículo transferido a ${selected.name}`);
      onClose();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo transferir");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="confirm-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="confirm-card" style={{ maxWidth: 460 }}>
        <h3>Transferir artículo</h3>
        <p>Busca el usuario destino por nombre, email o handle.</p>
        <div className="search-shell" style={{ marginBottom: 10 }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--ink-3)", flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSelected(null);
            }}
            placeholder="nombre, email o @handle"
          />
        </div>
        {results.length > 0 && (
          <div
            style={{
              border: "1px solid var(--line)",
              borderRadius: 10,
              overflow: "hidden",
              marginBottom: 14,
            }}
          >
            {results.map((u) => {
              const isSelected = selected?.id === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => setSelected(u)}
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 2,
                    padding: "10px 14px",
                    background: isSelected
                      ? "color-mix(in oklab, var(--accent) 12%, transparent)"
                      : "var(--surface)",
                    cursor: "pointer",
                    textAlign: "left",
                    border: "none",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                    {u.name}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                      color: "var(--ink-3)",
                    }}
                  >
                    {u.email} · @{u.handle}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {selected && (
          <p style={{ marginBottom: 14, fontSize: 13, color: "var(--ok)" }}>
            Seleccionado: <strong>{selected.name}</strong>
          </p>
        )}
        <div className="modal-acts">
          <button
            className="btn primary"
            onClick={handleTransfer}
            disabled={busy || !selected}
            style={{ flex: 1 }}
          >
            {busy ? "Transfiriendo…" : "Confirmar transferencia"}
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
  const [articles, setArticles] = useState<Article[]>(MOCK_ARTICLES);
  const [busyId, setBusyId] = useState<number | null>(null);

  // Modal state
  const [editorTarget, setEditorTarget] = useState<Article | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Article | null>(null);
  const [banTarget, setBanTarget] = useState<Article | null>(null);
  const [transferTarget, setTransferTarget] = useState<Article | null>(null);

  const patch = (id: number, fields: Partial<Article>) =>
    setArticles((list) => list.map((x) => (x.id === id ? { ...x, ...fields } : x)));

  const handleReReview = async (a: Article) => {
    if (!token) return;
    setBusyId(a.id);
    try {
      const r = await fetch(`/api/articles/${a.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DRAFT" }),
      });
      if (!r.ok) throw new Error("No se pudo enviar a revisión");
      patch(a.id, { status: "DRAFT" });
      toast.success("Artículo enviado de vuelta a revisión");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo re-revisar");
    } finally {
      setBusyId(null);
    }
  };

  const handleRestore = async (a: Article) => {
    if (!token) return;
    setBusyId(a.id);
    try {
      const r = await fetch(`/api/articles/${a.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DRAFT" }),
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
      <div className="table-wrap">
        {articles.length === 0 ? (
          <div className="empty">
            <div className="ic">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <h3>Sin artículos</h3>
            <p>No hay artículos en el sistema.</p>
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
              {articles.map((a) => {
                const isBusy = busyId === a.id;
                return (
                  <tr key={a.id}>
                    {/* Título */}
                    <td>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13.5,
                          lineHeight: 1.3,
                          marginBottom: 3,
                        }}
                      >
                        {a.title}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 10.5,
                          color: "var(--ink-3)",
                        }}
                      >
                        #{a.id} · /{a.slug}
                      </div>
                    </td>
                    {/* Autor */}
                    <td>
                      <div className="cell-prod">
                        <div className="nm">{a.author}</div>
                        <div className="em">{a.authorEmail}</div>
                      </div>
                    </td>
                    {/* Categoría */}
                    <td>{a.category}</td>
                    {/* Fecha */}
                    <td>
                      <div className="cell-date">
                        <div className="d">{formatDate(a.submittedAt)}</div>
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
                        {/* En revisión */}
                        {a.status === "DRAFT" && (
                          <>
                            <button
                              onClick={() => setEditorTarget(a)}
                              disabled={isBusy}
                            >
                              Editar
                            </button>
                            <button
                              className="bad"
                              onClick={() => setRejectTarget(a)}
                              disabled={isBusy}
                            >
                              Rechazar
                            </button>
                          </>
                        )}
                        {/* Publicado */}
                        {a.status === "PUBLISHED" && (
                          <>
                            <button
                              onClick={() => setEditorTarget(a)}
                              disabled={isBusy}
                            >
                              Editar
                            </button>
                            <button
                              className="bad"
                              onClick={() => setBanTarget(a)}
                              disabled={isBusy}
                            >
                              Banear
                            </button>
                          </>
                        )}
                        {/* Rechazado */}
                        {a.status === "REJECTED" && (
                          <button onClick={() => handleReReview(a)} disabled={isBusy}>
                            Re-revisar
                          </button>
                        )}
                        {/* Baneado */}
                        {a.status === "BANNED" && (
                          <button className="ok" onClick={() => handleRestore(a)} disabled={isBusy}>
                            Restaurar
                          </button>
                        )}
                        {/* Siempre: Transferir */}
                        <button onClick={() => setTransferTarget(a)} disabled={isBusy}>
                          Transferir
                        </button>
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

      {/* Reject modal */}
      {rejectTarget && token && (
        <RejectModal
          article={rejectTarget}
          token={token}
          onClose={() => setRejectTarget(null)}
          onDone={(id) => patch(id, { status: "REJECTED" })}
        />
      )}

      {/* Ban modal */}
      {banTarget && token && (
        <BanModal
          article={banTarget}
          token={token}
          onClose={() => setBanTarget(null)}
          onDone={(id) => patch(id, { status: "BANNED" })}
        />
      )}

      {/* Transfer modal */}
      {transferTarget && token && (
        <TransferModal
          article={transferTarget}
          token={token}
          onClose={() => setTransferTarget(null)}
          onDone={(id, newAuthor) => patch(id, { author: newAuthor })}
        />
      )}
    </>
  );
}
