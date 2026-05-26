"use client";
import { useState } from "react";
import { toast } from "sonner";

type PipelineStage =
  | "Nuevo"
  | "Contactado"
  | "En negociación"
  | "Cerrado ganado"
  | "Cerrado perdido";

const STAGE_STYLE: Record<PipelineStage, { color: string; bg: string }> = {
  Nuevo:             { color: "var(--accent)",  bg: "color-mix(in oklab, var(--accent) 12%, transparent)" },
  Contactado:        { color: "#eab308",         bg: "color-mix(in oklab, #eab308 12%, transparent)" },
  "En negociación":  { color: "#f97316",         bg: "color-mix(in oklab, #f97316 12%, transparent)" },
  "Cerrado ganado":  { color: "var(--ok)",      bg: "color-mix(in oklab, var(--ok) 12%, transparent)" },
  "Cerrado perdido": { color: "var(--ink-3)",   bg: "var(--surface-2)" },
};

function StagePill({ stage }: { stage: PipelineStage }) {
  const { color, bg } = STAGE_STYLE[stage];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontFamily: "var(--font-mono)",
        letterSpacing: ".05em",
        fontWeight: 600,
        background: bg,
        color,
        border: `1px solid ${color}`,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
      {stage}
    </span>
  );
}

// ── Contact mock data ─────────────────────────────────────────────────────────

type ContactMessage = {
  id: number;
  name: string;
  email: string;
  subject: string;
  text: string;
  date: string;
  stage: PipelineStage;
  read: boolean;
  archived: boolean;
};

const MOCK_CONTACT: ContactMessage[] = [
  {
    id: 1,
    name: "Valentina Rojas",
    email: "vrojas@email.cl",
    subject: "Consulta sobre publicación de evento",
    text: "Hola, quisiera saber cómo puedo publicar un evento de cosplay en vuestra plataforma. Tenemos un evento para agosto y nos gustaría saber los requisitos y costos.",
    date: "23 MAY 2026",
    stage: "Nuevo",
    read: false,
    archived: false,
  },
  {
    id: 2,
    name: "Felipe Morales",
    email: "fmorales@anime.cl",
    subject: "Problema con mi suscripción",
    text: "Tengo un problema con mi suscripción. Al intentar publicar un evento me dice que no tengo créditos pero acabo de renovar el plan. Por favor necesito solución urgente.",
    date: "22 MAY 2026",
    stage: "Contactado",
    read: true,
    archived: false,
  },
  {
    id: 3,
    name: "Camila Fernández",
    email: "cfernandez@gmail.com",
    subject: "Alianza comercial",
    text: "Somos una empresa de eventos especializados en cultura japonesa y queremos explorar una alianza comercial con Konbini. ¿Con quién podríamos hablar al respecto?",
    date: "20 MAY 2026",
    stage: "En negociación",
    read: true,
    archived: false,
  },
  {
    id: 4,
    name: "Rodrigo Pinto",
    email: "rpinto@mail.com",
    subject: "Sugerencia de mejora",
    text: "Me gustaría sugerir que agreguen filtros por ciudad en la búsqueda de eventos. Sería muy útil para quienes estamos fuera de Santiago.",
    date: "18 MAY 2026",
    stage: "Cerrado ganado",
    read: true,
    archived: false,
  },
];

// ── Photography mock data ─────────────────────────────────────────────────────

type PhotoMessage = {
  id: number;
  organizerName: string;
  eventName: string;
  eventDate: string;
  location: string;
  services: string[];
  email: string;
  stage: PipelineStage;
  archived: boolean;
};

const MOCK_PHOTO: PhotoMessage[] = [
  {
    id: 1,
    organizerName: "Cosplay Atelier",
    eventName: "AniCon Santiago 2025",
    eventDate: "15 JUN 2026",
    location: "Centro Cultural Gabriela Mistral",
    services: ["Cobertura completa del evento", "Galería digital privada"],
    email: "info@cosplay.cl",
    stage: "Nuevo",
    archived: false,
  },
  {
    id: 2,
    organizerName: "K-Pop Fest Chile",
    eventName: "K-Pop Summer Fest",
    eventDate: "22 JUL 2026",
    location: "Movistar Arena, Santiago",
    services: ["Sesión previa al evento", "Edición básica incluida", "Entrega en 48 horas"],
    email: "admin@kpopfest.cl",
    stage: "Contactado",
    archived: false,
  },
  {
    id: 3,
    organizerName: "Gaming League CL",
    eventName: "GamingFest 2026",
    eventDate: "3 AGO 2026",
    location: "Espacio Riesco, Las Condes",
    services: ["Cobertura completa del evento", "Galería digital privada", "Edición básica incluida"],
    email: "contacto@gamingleague.cl",
    stage: "En negociación",
    archived: false,
  },
  {
    id: 4,
    organizerName: "FanExpo Chile",
    eventName: "FanExpo Temuco",
    eventDate: "10 SEP 2026",
    location: "Centro de Eventos Temuco",
    services: ["Cobertura completa del evento"],
    email: "hola@fanexpochile.cl",
    stage: "Cerrado perdido",
    archived: false,
  },
];

// ── Creators mock data ────────────────────────────────────────────────────────

type CreatorsMessage = {
  id: number;
  organizerName: string;
  eventName: string;
  eventDate: string;
  services: string[];
  email: string;
  stage: PipelineStage;
  archived: boolean;
};

const MOCK_CREATORS: CreatorsMessage[] = [
  {
    id: 1,
    organizerName: "CineClub Santiago",
    eventName: "Noche de Cine Asiático",
    eventDate: "20 JUN 2026",
    services: ["Reels para Instagram/TikTok", "Aftermovie (1-3 min)"],
    email: "admin@cineclub.cl",
    stage: "Nuevo",
    archived: false,
  },
  {
    id: 2,
    organizerName: "AnimeShop CL",
    eventName: "Opening Tienda Providencia",
    eventDate: "5 JUL 2026",
    services: ["Reels para Instagram/TikTok", "Cobertura en vivo (stories)"],
    email: "tienda@animeshop.cl",
    stage: "Contactado",
    archived: false,
  },
  {
    id: 3,
    organizerName: "Konbini Ediciones",
    eventName: "Lanzamiento Manga Vol.12",
    eventDate: "18 JUL 2026",
    services: ["Video resumen", "Fotografía básica"],
    email: "info@konbini-ed.cl",
    stage: "En negociación",
    archived: false,
  },
  {
    id: 4,
    organizerName: "Retro Games CL",
    eventName: "Retro Gaming Convention",
    eventDate: "2 AGO 2026",
    services: ["Aftermovie (1-3 min)", "Fotografía básica"],
    email: "hola@retrogames.cl",
    stage: "Cerrado ganado",
    archived: false,
  },
];

const KIND_LABELS: Record<string, string> = {
  contact:  "Contacto",
  photo:    "Fotografía",
  creators: "Creadores",
};

// ── Contact row ───────────────────────────────────────────────────────────────

function ContactRow({
  msg,
  expanded,
  onExpand,
  onToggleRead,
  onArchive,
}: {
  msg: ContactMessage;
  expanded: boolean;
  onExpand: () => void;
  onToggleRead: () => void;
  onArchive: () => void;
}) {
  return (
    <div
      className="inbox-row"
      style={{
        display: "block",
        borderColor: expanded ? "var(--accent)" : undefined,
        opacity: msg.archived ? 0.45 : 1,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14, alignItems: "center" }}>
        <div onClick={onExpand} style={{ cursor: "pointer", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            {!msg.read && (
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  flexShrink: 0,
                }}
              />
            )}
            <span className="i-name">{msg.name}</span>
            <span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
              {msg.email}
            </span>
          </div>
          <div className="i-msg" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <strong style={{ marginRight: 6 }}>{msg.subject}</strong>
            {!expanded && msg.text.slice(0, 80)}{!expanded && msg.text.length > 80 ? "…" : ""}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
          <span className="i-time">{msg.date}</span>
          <StagePill stage={msg.stage} />
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6, margin: "0 0 14px" }}>
            {msg.text}
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              style={{
                padding: "5px 12px",
                borderRadius: 6,
                background: "var(--surface-2)",
                border: "1px solid var(--line)",
                fontSize: 12,
                color: "var(--ink-2)",
                cursor: "pointer",
              }}
              onClick={onExpand}
            >
              Cerrar
            </button>
            <button
              style={{
                padding: "5px 12px",
                borderRadius: 6,
                background: "var(--surface-2)",
                border: "1px solid var(--line)",
                fontSize: 12,
                color: "var(--ink-2)",
                cursor: "pointer",
              }}
              onClick={onToggleRead}
            >
              {msg.read ? "Marcar no leído" : "Marcar leído"}
            </button>
            <button
              style={{
                padding: "5px 12px",
                borderRadius: 6,
                background: "var(--surface-2)",
                border: "1px solid var(--line)",
                fontSize: 12,
                color: "var(--err)",
                cursor: "pointer",
              }}
              onClick={onArchive}
            >
              Archivar
            </button>
          </div>
        </div>
      )}

      {/* Actions when collapsed */}
      {!expanded && (
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              background: "transparent",
              border: "1px solid var(--line)",
              fontSize: 11,
              color: "var(--ink-3)",
              cursor: "pointer",
            }}
            onClick={onExpand}
          >
            Ver detalle
          </button>
          <button
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              background: "transparent",
              border: "1px solid var(--line)",
              fontSize: 11,
              color: "var(--ink-3)",
              cursor: "pointer",
            }}
            onClick={onToggleRead}
          >
            {msg.read ? "Marcar no leído" : "Marcar leído"}
          </button>
          <button
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              background: "transparent",
              border: "1px solid var(--line)",
              fontSize: 11,
              color: "var(--err)",
              cursor: "pointer",
            }}
            onClick={onArchive}
          >
            Archivar
          </button>
        </div>
      )}
    </div>
  );
}

// ── Photo row ─────────────────────────────────────────────────────────────────

function PhotoRow({
  msg,
  expanded,
  onExpand,
  onArchive,
}: {
  msg: PhotoMessage;
  expanded: boolean;
  onExpand: () => void;
  onArchive: () => void;
}) {
  return (
    <div
      className="inbox-row"
      style={{
        display: "block",
        borderColor: expanded ? "var(--accent)" : undefined,
        opacity: msg.archived ? 0.45 : 1,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14, alignItems: "flex-start" }}>
        <div onClick={onExpand} style={{ cursor: "pointer", minWidth: 0 }}>
          <div className="i-name" style={{ marginBottom: 3 }}>{msg.organizerName}</div>
          <div className="i-msg">
            <strong>{msg.eventName}</strong>
            {" · "}
            <span style={{ color: "var(--ink-3)" }}>{msg.eventDate}</span>
            {" · "}
            <span style={{ color: "var(--ink-3)" }}>{msg.location}</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
            {msg.services.join(", ")}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
            {msg.email}
          </span>
          <StagePill stage={msg.stage} />
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 16px", fontSize: 13, margin: "0 0 14px" }}>
            <dt style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".1em" }}>ORGANIZADOR</dt>
            <dd style={{ margin: 0 }}>{msg.organizerName}</dd>
            <dt style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".1em" }}>EVENTO</dt>
            <dd style={{ margin: 0 }}>{msg.eventName}</dd>
            <dt style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".1em" }}>FECHA</dt>
            <dd style={{ margin: 0 }}>{msg.eventDate}</dd>
            <dt style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".1em" }}>LUGAR</dt>
            <dd style={{ margin: 0 }}>{msg.location}</dd>
            <dt style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".1em" }}>SERVICIOS</dt>
            <dd style={{ margin: 0 }}>{msg.services.join(", ")}</dd>
            <dt style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".1em" }}>EMAIL</dt>
            <dd style={{ margin: 0 }}>{msg.email}</dd>
          </dl>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              style={{ padding: "5px 12px", borderRadius: 6, background: "var(--surface-2)", border: "1px solid var(--line)", fontSize: 12, color: "var(--ink-2)", cursor: "pointer" }}
              onClick={onExpand}
            >
              Cerrar
            </button>
            <button
              style={{ padding: "5px 12px", borderRadius: 6, background: "var(--surface-2)", border: "1px solid var(--line)", fontSize: 12, color: "var(--err)", cursor: "pointer" }}
              onClick={onArchive}
            >
              Archivar
            </button>
          </div>
        </div>
      )}

      {!expanded && (
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button
            style={{ padding: "4px 10px", borderRadius: 6, background: "transparent", border: "1px solid var(--line)", fontSize: 11, color: "var(--ink-3)", cursor: "pointer" }}
            onClick={onExpand}
          >
            Ver detalle
          </button>
          <button
            style={{ padding: "4px 10px", borderRadius: 6, background: "transparent", border: "1px solid var(--line)", fontSize: 11, color: "var(--err)", cursor: "pointer" }}
            onClick={onArchive}
          >
            Archivar
          </button>
        </div>
      )}
    </div>
  );
}

// ── Creators row ──────────────────────────────────────────────────────────────

function CreatorsRow({
  msg,
  expanded,
  onExpand,
  onArchive,
}: {
  msg: CreatorsMessage;
  expanded: boolean;
  onExpand: () => void;
  onArchive: () => void;
}) {
  return (
    <div
      className="inbox-row"
      style={{
        display: "block",
        borderColor: expanded ? "var(--accent)" : undefined,
        opacity: msg.archived ? 0.45 : 1,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14, alignItems: "flex-start" }}>
        <div onClick={onExpand} style={{ cursor: "pointer", minWidth: 0 }}>
          <div className="i-name" style={{ marginBottom: 3 }}>{msg.organizerName}</div>
          <div className="i-msg">
            <strong>{msg.eventName}</strong>
            {" · "}
            <span style={{ color: "var(--ink-3)" }}>{msg.eventDate}</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
            {msg.services.join(", ")}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
            {msg.email}
          </span>
          <StagePill stage={msg.stage} />
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 16px", fontSize: 13, margin: "0 0 14px" }}>
            <dt style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".1em" }}>ORGANIZADOR</dt>
            <dd style={{ margin: 0 }}>{msg.organizerName}</dd>
            <dt style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".1em" }}>EVENTO</dt>
            <dd style={{ margin: 0 }}>{msg.eventName}</dd>
            <dt style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".1em" }}>FECHA</dt>
            <dd style={{ margin: 0 }}>{msg.eventDate}</dd>
            <dt style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".1em" }}>SERVICIOS</dt>
            <dd style={{ margin: 0 }}>{msg.services.join(", ")}</dd>
            <dt style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".1em" }}>EMAIL</dt>
            <dd style={{ margin: 0 }}>{msg.email}</dd>
          </dl>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              style={{ padding: "5px 12px", borderRadius: 6, background: "var(--surface-2)", border: "1px solid var(--line)", fontSize: 12, color: "var(--ink-2)", cursor: "pointer" }}
              onClick={onExpand}
            >
              Cerrar
            </button>
            <button
              style={{ padding: "5px 12px", borderRadius: 6, background: "var(--surface-2)", border: "1px solid var(--line)", fontSize: 12, color: "var(--err)", cursor: "pointer" }}
              onClick={onArchive}
            >
              Archivar
            </button>
          </div>
        </div>
      )}

      {!expanded && (
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button
            style={{ padding: "4px 10px", borderRadius: 6, background: "transparent", border: "1px solid var(--line)", fontSize: 11, color: "var(--ink-3)", cursor: "pointer" }}
            onClick={onExpand}
          >
            Ver detalle
          </button>
          <button
            style={{ padding: "4px 10px", borderRadius: 6, background: "transparent", border: "1px solid var(--line)", fontSize: 11, color: "var(--err)", cursor: "pointer" }}
            onClick={onArchive}
          >
            Archivar
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function InboxSection({ kind = "contact" }: { kind?: "contact" | "photo" | "creators" }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Contact state
  const [contacts, setContacts] = useState<ContactMessage[]>(MOCK_CONTACT);

  // Photo state
  const [photos, setPhotos] = useState<PhotoMessage[]>(MOCK_PHOTO);

  // Creators state
  const [creators, setCreators] = useState<CreatorsMessage[]>(MOCK_CREATORS);

  const toggleExpand = (id: number) =>
    setExpandedId((prev) => (prev === id ? null : id));

  // ── Contact handlers ──
  const toggleRead = (id: number) => {
    setContacts((list) =>
      list.map((m) => (m.id === id ? { ...m, read: !m.read } : m)),
    );
  };
  const archiveContact = (id: number) => {
    setContacts((list) =>
      list.map((m) => (m.id === id ? { ...m, archived: true } : m)),
    );
    toast.success("Mensaje archivado");
  };

  // ── Photo handlers ──
  const archivePhoto = (id: number) => {
    setPhotos((list) =>
      list.map((m) => (m.id === id ? { ...m, archived: true } : m)),
    );
    toast.success("Solicitud archivada");
  };

  // ── Creators handlers ──
  const archiveCreator = (id: number) => {
    setCreators((list) =>
      list.map((m) => (m.id === id ? { ...m, archived: true } : m)),
    );
    toast.success("Solicitud archivada");
  };

  const label = KIND_LABELS[kind] ?? "Bandeja";

  if (kind === "contact") {
    const visible = contacts.filter((m) => !m.archived);
    return (
      <>
        <div className="section-head">
          <h2>{label}</h2>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
            {visible.length} MENSAJES
          </span>
        </div>
        {visible.length === 0 ? (
          <div className="empty">
            <h3>Bandeja vacía</h3>
            <p>No hay mensajes de contacto.</p>
          </div>
        ) : (
          <div className="inbox-list">
            {visible.map((m) => (
              <ContactRow
                key={m.id}
                msg={m}
                expanded={expandedId === m.id}
                onExpand={() => toggleExpand(m.id)}
                onToggleRead={() => toggleRead(m.id)}
                onArchive={() => archiveContact(m.id)}
              />
            ))}
          </div>
        )}
      </>
    );
  }

  if (kind === "photo") {
    const visible = photos.filter((m) => !m.archived);
    return (
      <>
        <div className="section-head">
          <h2>{label}</h2>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
            {visible.length} SOLICITUDES
          </span>
        </div>
        {visible.length === 0 ? (
          <div className="empty">
            <h3>Bandeja vacía</h3>
            <p>No hay solicitudes de fotografía.</p>
          </div>
        ) : (
          <div className="inbox-list">
            {visible.map((m) => (
              <PhotoRow
                key={m.id}
                msg={m}
                expanded={expandedId === m.id}
                onExpand={() => toggleExpand(m.id)}
                onArchive={() => archivePhoto(m.id)}
              />
            ))}
          </div>
        )}
      </>
    );
  }

  // kind === "creators"
  const visible = creators.filter((m) => !m.archived);
  return (
    <>
      <div className="section-head">
        <h2>{label}</h2>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
          {visible.length} SOLICITUDES
        </span>
      </div>
      {visible.length === 0 ? (
        <div className="empty">
          <h3>Bandeja vacía</h3>
          <p>No hay solicitudes de creadores.</p>
        </div>
      ) : (
        <div className="inbox-list">
          {visible.map((m) => (
            <CreatorsRow
              key={m.id}
              msg={m}
              expanded={expandedId === m.id}
              onExpand={() => toggleExpand(m.id)}
              onArchive={() => archiveCreator(m.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}
