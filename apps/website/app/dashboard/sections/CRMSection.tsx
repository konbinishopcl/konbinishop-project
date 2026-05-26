"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";

type PipelineStage =
  | "Nuevo"
  | "Contactado"
  | "En negociación"
  | "Cerrado ganado"
  | "Cerrado perdido";

const PIPELINE_STAGES: PipelineStage[] = [
  "Nuevo",
  "Contactado",
  "En negociación",
  "Cerrado ganado",
  "Cerrado perdido",
];

const STAGE_STYLE: Record<PipelineStage, { color: string; bg: string }> = {
  Nuevo:             { color: "var(--ink-3)",  bg: "var(--surface-2)" },
  Contactado:        { color: "#eab308",        bg: "color-mix(in oklab, #eab308 12%, transparent)" },
  "En negociación":  { color: "var(--accent)", bg: "color-mix(in oklab, var(--accent) 12%, transparent)" },
  "Cerrado ganado":  { color: "var(--ok)",     bg: "color-mix(in oklab, var(--ok) 12%, transparent)" },
  "Cerrado perdido": { color: "var(--err)",    bg: "color-mix(in oklab, var(--err) 12%, transparent)" },
};

type LeadType = "Contacto" | "Fotografía" | "Creadores";

const TYPE_COLOR: Record<LeadType, string> = {
  Contacto:  "#6366f1",
  Fotografía: "#f43f5e",
  Creadores: "#22c55e",
};

type CRMLead = {
  id: number;
  name: string;
  email?: string;
  company?: string;
  event?: string;
  eventDate?: string;
  location?: string;
  services?: string;
  stage: PipelineStage;
  type: LeadType;
  requestDate: string;
  lastMoved: string;
  originalData?: Record<string, string>;
};

type Note = { text: string; timestamp: string; author: string };

type ModalState = {
  lead: CRMLead;
  targetStage: PipelineStage;
  motivo: string;
  notes: Note[];
  noteInput: string;
};

const MOCK_LEADS: CRMLead[] = [
  {
    id: 1,
    name: "Anime Events CL",
    email: "info@animeevents.cl",
    event: "AniCon Santiago 2025",
    eventDate: "15 JUN 2025",
    stage: "Nuevo",
    type: "Contacto",
    requestDate: "10 MAY 2025",
    lastMoved: "10 MAY 2025",
  },
  {
    id: 2,
    name: "Cosplay Atelier",
    email: "info@cosplay.cl",
    company: "Cosplay Atelier",
    event: "AniCon Santiago 2025",
    location: "Centro Cultural Gabriela Mistral",
    services: "Cobertura completa, Edición básica",
    stage: "Nuevo",
    type: "Fotografía",
    requestDate: "8 MAY 2025",
    lastMoved: "8 MAY 2025",
  },
  {
    id: 3,
    name: "K-Pop Fest",
    email: "admin@kpopfest.cl",
    event: "K-Pop Summer Fest",
    stage: "Contactado",
    type: "Contacto",
    requestDate: "2 MAY 2025",
    lastMoved: "7 MAY 2025",
  },
  {
    id: 4,
    name: "Jorge Maturana",
    email: "jm@email.cl",
    event: "FanExpo Chile",
    location: "Espacio Riesco",
    services: "Reels para Instagram/TikTok, Video resumen",
    stage: "Contactado",
    type: "Creadores",
    requestDate: "5 MAY 2025",
    lastMoved: "9 MAY 2025",
  },
  {
    id: 5,
    name: "CineClub Santiago",
    email: "admin@cineclub.cl",
    company: "CineClub Santiago",
    event: "Noche de Cine Asiático",
    services: "Aftermovie, Cobertura en vivo",
    stage: "En negociación",
    type: "Creadores",
    requestDate: "25 ABR 2025",
    lastMoved: "5 MAY 2025",
  },
  {
    id: 6,
    name: "Konbini Ediciones",
    email: "info@konbini-ed.cl",
    event: "Lanzamiento Manga Vol.12",
    stage: "En negociación",
    type: "Contacto",
    requestDate: "20 ABR 2025",
    lastMoved: "3 MAY 2025",
  },
  {
    id: 7,
    name: "María Pérez",
    email: "maria@email.cl",
    event: "Boda Temática Anime",
    location: "Casa de Eventos El Peumo",
    services: "Cobertura completa, Galería digital privada",
    stage: "Cerrado ganado",
    type: "Fotografía",
    requestDate: "10 ABR 2025",
    lastMoved: "28 ABR 2025",
  },
  {
    id: 8,
    name: "AnimeShop CL",
    email: "tienda@animeshop.cl",
    company: "AnimeShop CL",
    event: "Opening Tienda Providencia",
    services: "Reels para Instagram/TikTok",
    stage: "Cerrado ganado",
    type: "Creadores",
    requestDate: "5 ABR 2025",
    lastMoved: "22 ABR 2025",
  },
  {
    id: 9,
    name: "Rodrigo Silva",
    email: "rsilva@email.cl",
    event: "GamingFest 2025",
    location: "Movistar Arena",
    services: "Entrega en 48 horas",
    stage: "Cerrado perdido",
    type: "Fotografía",
    requestDate: "1 ABR 2025",
    lastMoved: "15 ABR 2025",
  },
];

function TypeBadge({ type }: { type: LeadType }) {
  const color = TYPE_COLOR[type];
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: "var(--font-mono)",
        fontSize: 9,
        padding: "2px 7px",
        borderRadius: 999,
        background: `color-mix(in oklab, ${color} 14%, transparent)`,
        border: `1px solid color-mix(in oklab, ${color} 40%, transparent)`,
        color,
        letterSpacing: ".06em",
        textTransform: "uppercase",
      }}
    >
      {type}
    </span>
  );
}

function StageDot({ stage }: { stage: PipelineStage }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: STAGE_STYLE[stage].color,
        flexShrink: 0,
      }}
    />
  );
}

export default function CRMSection() {
  const { token } = useUser();
  const [leads, setLeads] = useState<CRMLead[]>(MOCK_LEADS);
  const [modal, setModal] = useState<ModalState | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch("/api/crm", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (!r.ok) return;
        const data = await r.json();
        const items: CRMLead[] = Array.isArray(data) ? data : (data.items ?? []);
        if (items.length > 0) setLeads(items);
      })
      .catch(() => {/* usa mock */});
  }, [token]);

  function openModal(lead: CRMLead) {
    setModal({ lead, targetStage: lead.stage, motivo: "", notes: [], noteInput: "" });
  }

  function closeModal() {
    setModal(null);
  }

  function addNote() {
    if (!modal || !modal.noteInput.trim()) return;
    const note: Note = {
      text: modal.noteInput.trim(),
      timestamp: new Date().toLocaleString("es-CL"),
      author: "Admin",
    };
    setModal((m) => m ? { ...m, notes: [...m.notes, note], noteInput: "" } : m);
  }

  function saveModal() {
    if (!modal) return;
    const { lead, targetStage, motivo } = modal;
    if (targetStage === "Cerrado perdido" && !motivo.trim()) {
      toast.error("Debes ingresar el motivo de cierre.");
      return;
    }
    const today = new Date().toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });
    setLeads((list) =>
      list.map((l) => l.id === lead.id ? { ...l, stage: targetStage, lastMoved: today } : l),
    );
    toast.success(`${lead.name} movido a ${targetStage}`);
    closeModal();
  }

  const canSave =
    modal && (modal.targetStage !== "Cerrado perdido" || modal.motivo.trim().length > 0);

  return (
    <>
      <div className="section-head" style={{ marginBottom: 20 }}>
        <h2>CRM</h2>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
          {leads.length} LEADS
        </span>
      </div>

      <div className="kanban">
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage);
          const { color } = STAGE_STYLE[stage];
          return (
            <div key={stage} className="kanban-col">
              <div className="k-head">
                <span style={{ color }}>{stage}</span>
                <span className="k-count">{stageLeads.length}</span>
              </div>
              <div className="k-body">
                {stageLeads.map((lead) => (
                  <div key={lead.id} className="k-card" onClick={() => openModal(lead)}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6, marginBottom: 4 }}>
                      <div className="k-title" style={{ margin: 0 }}>{lead.name}</div>
                      <StageDot stage={lead.stage} />
                    </div>
                    {lead.email && <div className="k-meta">{lead.email}</div>}
                    {(lead.company || lead.event) && (
                      <div className="k-meta" style={{ marginTop: 2 }}>{lead.company ?? lead.event}</div>
                    )}
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                      <TypeBadge type={lead.type} />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink-3)" }}>
                        {lead.requestDate}
                      </span>
                    </div>
                    <div style={{ marginTop: 4, fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink-3)" }}>
                      Último mov. {lead.lastMoved}
                    </div>
                  </div>
                ))}
                {stageLeads.length === 0 && (
                  <div
                    style={{
                      height: 54,
                      border: "1px dashed var(--line)",
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      color: "var(--ink-3)",
                    }}
                  >
                    Vacío
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <div className="confirm-bg" onClick={closeModal}>
          <div className="confirm-card" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: "0 0 6px" }}>{modal.lead.name}</h3>
                <TypeBadge type={modal.lead.type} />
              </div>
              <button
                onClick={closeModal}
                style={{ background: "none", color: "var(--ink-3)", cursor: "pointer", fontSize: 20, lineHeight: 1, flexShrink: 0 }}
              >
                ×
              </button>
            </div>

            {/* Request details */}
            <div
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--line)",
                borderRadius: 10,
                padding: "14px 16px",
                marginBottom: 16,
              }}
            >
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".15em", color: "var(--ink-3)", marginBottom: 10, textTransform: "uppercase" }}>
                Datos de la solicitud
              </div>
              <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 14px", fontSize: 13, margin: 0 }}>
                {modal.lead.email && (
                  <>
                    <dt style={{ color: "var(--ink-3)", fontSize: 11, fontFamily: "var(--font-mono)" }}>Email</dt>
                    <dd style={{ margin: 0 }}>{modal.lead.email}</dd>
                  </>
                )}
                {modal.lead.company && (
                  <>
                    <dt style={{ color: "var(--ink-3)", fontSize: 11, fontFamily: "var(--font-mono)" }}>Empresa</dt>
                    <dd style={{ margin: 0 }}>{modal.lead.company}</dd>
                  </>
                )}
                {modal.lead.event && (
                  <>
                    <dt style={{ color: "var(--ink-3)", fontSize: 11, fontFamily: "var(--font-mono)" }}>Evento</dt>
                    <dd style={{ margin: 0 }}>{modal.lead.event}</dd>
                  </>
                )}
                {modal.lead.eventDate && (
                  <>
                    <dt style={{ color: "var(--ink-3)", fontSize: 11, fontFamily: "var(--font-mono)" }}>Fecha evento</dt>
                    <dd style={{ margin: 0 }}>{modal.lead.eventDate}</dd>
                  </>
                )}
                {modal.lead.location && (
                  <>
                    <dt style={{ color: "var(--ink-3)", fontSize: 11, fontFamily: "var(--font-mono)" }}>Lugar</dt>
                    <dd style={{ margin: 0 }}>{modal.lead.location}</dd>
                  </>
                )}
                {modal.lead.services && (
                  <>
                    <dt style={{ color: "var(--ink-3)", fontSize: 11, fontFamily: "var(--font-mono)" }}>Servicios</dt>
                    <dd style={{ margin: 0 }}>{modal.lead.services}</dd>
                  </>
                )}
                <dt style={{ color: "var(--ink-3)", fontSize: 11, fontFamily: "var(--font-mono)" }}>Solicitud</dt>
                <dd style={{ margin: 0 }}>{modal.lead.requestDate}</dd>
                <dt style={{ color: "var(--ink-3)", fontSize: 11, fontFamily: "var(--font-mono)" }}>Etapa actual</dt>
                <dd style={{ margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <StageDot stage={modal.lead.stage} />
                  <span style={{ color: STAGE_STYLE[modal.lead.stage].color }}>{modal.lead.stage}</span>
                </dd>
              </dl>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".15em", color: "var(--ink-3)", marginBottom: 8, textTransform: "uppercase" }}>
                Notas internas
              </div>
              {modal.notes.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10, maxHeight: 140, overflowY: "auto" }}>
                  {modal.notes.map((n, i) => (
                    <div key={i} style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
                      <div style={{ color: "var(--ink-2)", lineHeight: 1.5 }}>{n.text}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)", marginTop: 4 }}>
                        {n.author} · {n.timestamp}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <textarea
                  placeholder="Agregar nota…"
                  value={modal.noteInput}
                  onChange={(e) => setModal((m) => m ? { ...m, noteInput: e.target.value } : m)}
                  style={{ flex: 1, minHeight: 64, resize: "vertical" }}
                />
                <button
                  className="btn ghost sm"
                  onClick={addNote}
                  style={{ alignSelf: "flex-end", flexShrink: 0 }}
                >
                  Agregar nota
                </button>
              </div>
            </div>

            {/* Move to stage — buttons */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".15em", color: "var(--ink-3)", marginBottom: 10, textTransform: "uppercase" }}>
                Mover a columna
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {PIPELINE_STAGES.map((s) => {
                  const st = STAGE_STYLE[s];
                  const isSelected = modal.targetStage === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setModal((m) => m ? { ...m, targetStage: s, motivo: "" } : m)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: isSelected ? 700 : 500,
                        cursor: "pointer",
                        background: isSelected ? st.bg : "var(--surface-2)",
                        color: isSelected ? st.color : "var(--ink-3)",
                        border: `1px solid ${isSelected ? st.color : "var(--line)"}`,
                        transition: "all .15s",
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Close reason */}
            {modal.targetStage === "Cerrado perdido" && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".15em", color: "var(--err)", marginBottom: 8, textTransform: "uppercase" }}>
                  Motivo de cierre (requerido)
                </label>
                <textarea
                  placeholder="Describe el motivo por el que se perdió este lead…"
                  value={modal.motivo}
                  onChange={(e) => setModal((m) => m ? { ...m, motivo: e.target.value } : m)}
                  style={{ minHeight: 72, resize: "vertical" }}
                />
              </div>
            )}

            <div className="modal-acts">
              <button className="btn ghost" onClick={closeModal}>Cancelar</button>
              <button
                className="btn primary"
                onClick={saveModal}
                disabled={!canSave}
                style={{ opacity: canSave ? 1 : 0.45, cursor: canSave ? "pointer" : "not-allowed" }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
