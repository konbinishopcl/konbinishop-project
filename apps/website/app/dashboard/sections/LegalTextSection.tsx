"use client";
import { useState } from "react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

type LegalItem = { id: number; title: string; content: string };

type ModalState =
  | { type: "create" }
  | { type: "edit"; item: LegalItem }
  | { type: "delete"; item: LegalItem }
  | null;

// ── Default content ───────────────────────────────────────────────────────────

const DEFAULTS: Record<string, LegalItem[]> = {
  terms: [
    { id: 1, title: "1. Aceptación de los términos", content: "Al acceder y utilizar Konbini, aceptas quedar vinculado por estos Términos y Condiciones." },
    { id: 2, title: "2. Uso del servicio", content: "Konbini es una plataforma para la publicación y descubrimiento de eventos de entretenimiento y cultura geek en Chile y Latinoamérica." },
    { id: 3, title: "3. Pagos y reembolsos", content: "Los pagos se procesan a través de pasarelas certificadas (WebPay y otras). Las publicaciones rechazadas no se cobran. Las publicaciones aprobadas no son reembolsables salvo error de Konbini." },
  ],
  privacy: [
    { id: 1, title: "1. Datos que recopilamos", content: "Email, nombre, país, y datos opcionales del perfil (avatar, bio, redes sociales). Para organizadores: nombre público y handle. Para pagos: el procesador maneja directamente los datos de tarjeta — Konbini nunca los almacena." },
    { id: 2, title: "2. Uso de los datos", content: "Utilizamos tus datos para gestionar tu cuenta, enviarte notificaciones relevantes y mejorar la plataforma." },
    { id: 3, title: "3. Cómo contactarnos", content: "Para ejercer tus derechos o reportar un incidente, escríbenos a privacidad@konbini.cl. Te responderemos en máximo 30 días hábiles según la ley." },
  ],
  cookies: [
    { id: 1, title: "1. ¿Qué son las cookies?", content: "Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas Konbini." },
    { id: 2, title: "2. Cookies que utilizamos", content: "Cookies esenciales (sesión, preferencias de tema), cookies analíticas (comportamiento anónimo de navegación)." },
    { id: 3, title: "3. Control de cookies", content: "Puedes desactivar las cookies no esenciales desde el banner de cookies o la configuración de tu navegador." },
  ],
};

// ── Inline form modal ─────────────────────────────────────────────────────────

function FormModal({ initial, onClose, onSave }: {
  initial?: LegalItem;
  onClose: () => void;
  onSave: (title: string, content: string) => void;
}) {
  const [title,   setTitle]   = useState(initial?.title   ?? "");
  const [content, setContent] = useState(initial?.content ?? "");

  return (
    <div className="confirm-bg" onClick={onClose}>
      <div className="confirm-card" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 16px" }}>{initial ? "Editar sección" : "Nueva sección"}</h3>
        <div className="field" style={{ marginBottom: 12 }}>
          <label>Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: 1. Aceptación de los términos"
          />
        </div>
        <div className="field" style={{ marginBottom: 18 }}>
          <label>Contenido</label>
          <textarea
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribe el contenido de esta sección..."
            style={{ resize: "vertical" }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn ghost sm" onClick={onClose}>Cancelar</button>
          <button
            className="btn primary sm"
            onClick={() => { if (title.trim()) { onSave(title.trim(), content.trim()); onClose(); } }}
            disabled={!title.trim()}
          >
            {initial ? "Guardar cambios" : "Agregar sección"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({ title, message, onConfirm, onClose }: {
  title: string; message: string; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <div className="confirm-bg" onClick={onClose}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 10px" }}>{title}</h3>
        <p style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 18 }}>{message}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn ghost sm" onClick={onClose}>Cancelar</button>
          <button
            className="btn sm"
            style={{ background: "var(--err)", color: "#fff" }}
            onClick={() => { onConfirm(); onClose(); }}
          >
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LegalTextSection({ kind }: { kind: "terms" | "privacy" | "cookies" }) {
  const [items, setItems]   = useState<LegalItem[]>(DEFAULTS[kind] ?? []);
  const [modal, setModal]   = useState<ModalState>(null);
  let   nextId              = Math.max(0, ...items.map((i) => i.id)) + 1;

  function add(title: string, content: string) {
    setItems((p) => [...p, { id: nextId++, title, content }]);
    toast.success("Sección agregada");
  }

  function edit(item: LegalItem, title: string, content: string) {
    setItems((p) => p.map((x) => x.id === item.id ? { ...x, title, content } : x));
    toast.success("Cambios guardados");
  }

  function remove(item: LegalItem) {
    setItems((p) => p.filter((x) => x.id !== item.id));
    toast.warning("Sección eliminada");
  }

  function move(i: number, dir: -1 | 1) {
    const next = [...items];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ color: "var(--ink-3)", fontSize: 13 }}>
          {items.length} sección{items.length !== 1 ? "es" : ""} · arrastra para reordenar
        </div>
        <button className="btn primary" onClick={() => setModal({ type: "create" })}>
          ＋ Nueva sección
        </button>
      </div>

      {items.map((item, i) => (
        <div key={item.id} className="panel" style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
              <button
                className="icon-btn"
                style={{ fontSize: 10, opacity: i === 0 ? 0.2 : 0.6 }}
                onClick={() => move(i, -1)}
                disabled={i === 0}
              >▲</button>
              <button
                className="icon-btn"
                style={{ fontSize: 10, opacity: i === items.length - 1 ? 0.2 : 0.6 }}
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
              >▼</button>
            </div>
            <div style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 11, marginTop: 4, minWidth: 24 }}>
              {String(i + 1).padStart(2, "0")}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{item.title}</div>
              <div style={{ color: "var(--ink-3)", fontSize: 13, lineHeight: 1.5 }}>{item.content}</div>
            </div>
            <div className="row-act">
              <button onClick={() => setModal({ type: "edit", item })}>Editar</button>
              <button className="bad" onClick={() => setModal({ type: "delete", item })}>Eliminar</button>
            </div>
          </div>
        </div>
      ))}

      {modal?.type === "create" && (
        <FormModal onClose={() => setModal(null)} onSave={add} />
      )}
      {modal?.type === "edit" && (
        <FormModal
          initial={modal.item}
          onClose={() => setModal(null)}
          onSave={(t, c) => edit(modal.item, t, c)}
        />
      )}
      {modal?.type === "delete" && (
        <ConfirmDialog
          title="¿Eliminar sección?"
          message={`"${modal.item.title}" se quitará del texto legal.`}
          onConfirm={() => remove(modal.item)}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
