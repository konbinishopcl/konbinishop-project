"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { api, type ApiCrmEntry, type ApiCrmNote, type CrmStage, type CrmType } from "@/lib/api";

// ── Stage config ───────────────────────────────────────────────────────────────

const STAGE_CONFIG: { stage: CrmStage; label: string }[] = [
  { stage: "NEW",         label: "Nuevo" },
  { stage: "CONTACTED",   label: "Contactado" },
  { stage: "NEGOTIATING", label: "En negociación" },
  { stage: "WON",         label: "Cerrado ganado" },
  { stage: "LOST",        label: "Cerrado perdido" },
];

// ── Type badge mapping ─────────────────────────────────────────────────────────

const TYPE_TAG: Record<CrmType, { cls: string; label: string }> = {
  CONTACT:     { cls: "contact", label: "Contacto" },
  PHOTOGRAPHY: { cls: "foto",    label: "Fotografía" },
  CONTENT:     { cls: "creat",   label: "Creadores" },
};

// ── Date helper ────────────────────────────────────────────────────────────────

const MESES = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function getInitials(name: string): string {
  return name.split(/\s+/).filter(Boolean).map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "?";
}

// ── CRM Detail Modal ───────────────────────────────────────────────────────────

function CRMDetailModal({
  entry,
  notes,
  notesLoading,
  noteContent,
  addingNote,
  selectedStage,
  stageReason,
  savingStage,
  onClose,
  onNoteContentChange,
  onAddNote,
  onStageChange,
  onStageReasonChange,
  onSaveStage,
}: {
  entry: ApiCrmEntry;
  notes: ApiCrmNote[];
  notesLoading: boolean;
  noteContent: string;
  addingNote: boolean;
  selectedStage: CrmStage | "";
  stageReason: string;
  savingStage: boolean;
  onClose: () => void;
  onNoteContentChange: (v: string) => void;
  onAddNote: () => void;
  onStageChange: (v: CrmStage | "") => void;
  onStageReasonChange: (v: string) => void;
  onSaveStage: () => void;
}) {
  const initials = getInitials(entry.contactName);
  const saveDisabled =
    savingStage ||
    !selectedStage ||
    (selectedStage === "LOST" && !stageReason.trim());

  return (
    <div className="confirm-bg" onClick={onClose}>
      <div
        className="confirm-card"
        style={{ maxWidth: 580, width: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 999, flexShrink: 0,
            background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 14,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{entry.contactName}</h3>
            <a
              href={`mailto:${entry.contactEmail}`}
              style={{ fontSize: 13, color: "var(--ink-2)", fontFamily: "var(--font-mono)", wordBreak: "break-all" }}
            >
              {entry.contactEmail}
            </a>
          </div>
          <button
            className="btn ghost sm"
            style={{ flexShrink: 0 }}
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Notes section */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "var(--ink-2)", margin: "0 0 10px" }}>
            Notas
          </p>

          {notesLoading ? (
            <p style={{ fontSize: 13, color: "var(--ink-2)" }}>Cargando notas…</p>
          ) : notes.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--ink-2)" }}>Sin notas aún.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
              {notes.map((n) => (
                <div
                  key={n.id}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                    gap: 10, padding: "8px 10px", background: "var(--surface-2, #f5f5f5)",
                    borderRadius: 6, fontSize: 13,
                  }}
                >
                  <span style={{ flex: 1 }}>{n.content}</span>
                  <span style={{ fontSize: 11, color: "var(--ink-2)", flexShrink: 0, fontFamily: "var(--font-mono)" }}>
                    {formatFullDate(n.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            <textarea
              rows={2}
              value={noteContent}
              onChange={(e) => onNoteContentChange(e.target.value)}
              placeholder="Escribe una nota…"
              style={{
                width: "100%", resize: "vertical", padding: "8px 10px", fontSize: 13,
                border: "1px solid var(--border, #ddd)", borderRadius: 6,
                fontFamily: "inherit", boxSizing: "border-box",
              }}
            />
            <button
              className="btn dark sm"
              disabled={addingNote || !noteContent.trim()}
              onClick={onAddNote}
              style={{ alignSelf: "flex-end" }}
            >
              {addingNote ? "Agregando…" : "Agregar nota"}
            </button>
          </div>
        </div>

        {/* Stage section */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "var(--ink-2)", margin: "0 0 10px" }}>
            Etapa
          </p>
          <select
            value={selectedStage}
            onChange={(e) => onStageChange(e.target.value as CrmStage | "")}
            style={{
              width: "100%", padding: "8px 10px", fontSize: 13,
              border: "1px solid var(--border, #ddd)", borderRadius: 6, marginBottom: 8,
            }}
          >
            {STAGE_CONFIG.map(({ stage, label }) => (
              <option key={stage} value={stage}>{label}</option>
            ))}
          </select>

          {selectedStage === "LOST" && (
            <input
              type="text"
              value={stageReason}
              onChange={(e) => onStageReasonChange(e.target.value)}
              placeholder="Motivo del cierre (obligatorio)"
              style={{
                width: "100%", padding: "8px 10px", fontSize: 13,
                border: "1px solid var(--border, #ddd)", borderRadius: 6,
                marginBottom: 8, boxSizing: "border-box",
              }}
            />
          )}

          <button
            className="btn dark sm"
            disabled={saveDisabled}
            onClick={onSaveStage}
            style={{ marginTop: 4 }}
          >
            {savingStage ? "Guardando…" : "Guardar etapa"}
          </button>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="btn ghost sm" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// ── CRMSection ─────────────────────────────────────────────────────────────────

export default function CRMSection() {
  const { token } = useUser();

  const [entries, setEntries] = useState<ApiCrmEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalEntry, setModalEntry] = useState<ApiCrmEntry | null>(null);
  const [notes, setNotes] = useState<ApiCrmNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [selectedStage, setSelectedStage] = useState<CrmStage | "">("");
  const [stageReason, setStageReason] = useState("");
  const [savingStage, setSavingStage] = useState(false);

  // ── Load ───────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.crmAll(token);
      setEntries(res.items);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error cargando CRM");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // ── Kanban grouping ────────────────────────────────────────────────────────

  const grouped = STAGE_CONFIG.map(({ stage, label }) => ({
    stage,
    label,
    cards: entries.filter((e) => e.stage === stage),
  }));

  // ── Modal handlers ─────────────────────────────────────────────────────────

  async function openModal(entry: ApiCrmEntry) {
    setModalEntry(entry);
    setSelectedStage(entry.stage);
    setStageReason("");
    setNoteContent("");
    setNotesLoading(true);
    try {
      const ns = await api.crmNotes(entry.id, token!);
      setNotes(ns);
    } catch {
      toast.error("No se pudieron cargar las notas");
      setNotes([]);
    } finally {
      setNotesLoading(false);
    }
  }

  function closeModal() {
    setModalEntry(null);
    setNotes([]);
    setNoteContent("");
    setSelectedStage("");
    setStageReason("");
  }

  async function handleAddNote() {
    if (!noteContent.trim() || !modalEntry || !token) return;
    setAddingNote(true);
    try {
      const n = await api.crmAddNote(modalEntry.id, noteContent.trim(), token);
      setNotes((prev) => [...prev, n]);
      setNoteContent("");
      toast.success("Nota agregada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al agregar nota");
    } finally {
      setAddingNote(false);
    }
  }

  async function handleSaveStage() {
    if (!modalEntry || !token || !selectedStage) return;
    if (selectedStage === "LOST" && !stageReason.trim()) return;
    setSavingStage(true);
    try {
      const updated = await api.crmSetStage(
        modalEntry.id,
        selectedStage,
        token,
        selectedStage === "LOST" ? stageReason.trim() : undefined,
      );
      setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setModalEntry(updated);
      toast.success(`Etapa actualizada: ${STAGE_CONFIG.find((s) => s.stage === updated.stage)?.label}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar etapa");
    } finally {
      setSavingStage(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading && entries.length === 0) {
    return (
      <div className="kanban">
        <p style={{ padding: 24, color: "var(--ink-2)" }}>Cargando CRM…</p>
      </div>
    );
  }

  return (
    <>
      <div className="kanban">
        {grouped.map(({ stage, label, cards }) => (
          <div key={stage} className="kanban-col">
            <div className="ch">
              <span className="nm">{label}</span>
              <span className="ct">{cards.length}</span>
            </div>
            {cards.map((c) => (
              <div
                key={c.id}
                className="kan-card"
                onClick={() => openModal(c)}
                style={{ cursor: "pointer" }}
              >
                <div className="ts">
                  <span className={`tag ${TYPE_TAG[c.type].cls}`}>{TYPE_TAG[c.type].label}</span>
                </div>
                <div className="nm">{c.contactName}</div>
                <div className="ev">{c.contactEmail}</div>
                <div className="ts2">{formatShortDate(c.createdAt)}</div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {modalEntry && (
        <CRMDetailModal
          entry={modalEntry}
          notes={notes}
          notesLoading={notesLoading}
          noteContent={noteContent}
          addingNote={addingNote}
          selectedStage={selectedStage}
          stageReason={stageReason}
          savingStage={savingStage}
          onClose={closeModal}
          onNoteContentChange={setNoteContent}
          onAddNote={handleAddNote}
          onStageChange={setSelectedStage}
          onStageReasonChange={setStageReason}
          onSaveStage={handleSaveStage}
        />
      )}
    </>
  );
}
