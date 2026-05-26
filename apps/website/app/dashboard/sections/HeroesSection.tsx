"use client";
import { useState } from "react";

// ── Mock data ─────────────────────────────────────────────────────────────────

const EVENTS = [
  { id: 1, title: "Ado: World Tour Hibana", cat: "Conciertos", art: "pa-1", date: "8 ABR 2025", price: 65 },
  { id: 2, title: "Multitude", cat: "Conciertos", art: "pa-2", date: "8 ABR 2025", price: 80 },
  { id: 3, title: "Demon Slayer: Infinity Castle", cat: "Cine", art: "pa-3", date: "8 ABR 2025", price: 9.99 },
  { id: 4, title: "Super Japan Expo 2025", cat: "Convenciones", art: "pa-4", date: "9–12 MAY 2025", price: 25 },
  { id: 5, title: "My Hero Academia: You're Next", cat: "Cine", art: "pa-5", date: "8 ABR 2025", price: 9.99 },
  { id: 6, title: "Solo Leveling: ReAwakening", cat: "Cine", art: "pa-6", date: "8 ABR 2025", price: 9.99 },
];

type ModalState =
  | { type: "approve"; item: (typeof EVENTS)[0] }
  | { type: "reject"; item: (typeof EVENTS)[0] }
  | { type: "transfer"; item: (typeof EVENTS)[0] }
  | { type: "ban"; item: (typeof EVENTS)[0] }
  | null;

// ── Shared modals ──────────────────────────────────────────────────────────────

function AdminApproveModal({ kind, onClose, onApprove }: { kind: string; onClose: () => void; onApprove: (tags: string) => void }) {
  const [tags, setTags] = useState("anime, cosplay, santiago, evento");
  const [aiBusy, setAiBusy] = useState(false);
  const regenAI = () => {
    setAiBusy(true);
    setTimeout(() => {
      setTags("anime, japón, otaku, santiago, evento, " + (Math.random() > 0.5 ? "convención" : "concierto"));
      setAiBusy(false);
    }, 700);
  };
  return (
    <div className="confirm-bg" onClick={onClose}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <h3 className="h">Aprobar {kind}</h3>
        <p className="p">Al aprobar, el contenido pasa a ser público en Konbini. La IA sugirió los siguientes tags — puedes editarlos antes de confirmar.</p>
        <div className="field" style={{ margin: 0 }}>
          <label>Tags (separados por coma)</label>
          <div style={{ position: "relative" }}>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} style={{ paddingRight: 44 }} />
            <button
              className="icon-btn"
              onClick={regenAI}
              title="Regenerar con IA"
              style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }}
            >
              <span style={{ animation: aiBusy ? "spin 1s linear infinite" : "none" }}>✦</span>
            </button>
          </div>
          <div className="help">Los tags ayudan a categorizar el contenido. Se generan automáticamente con IA.</div>
        </div>
        <div className="row-act" style={{ marginTop: 22 }}>
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn primary" style={{ background: "var(--ok)" }} onClick={() => { onApprove(tags); onClose(); }}>
            ✓ Aprobar y publicar
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminRejectModal({ kind, onClose, onReject }: { kind: string; onClose: () => void; onReject: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  const presets = [
    "Imagen no cumple con las dimensiones mínimas",
    "Contenido duplicado o spam",
    "Información incompleta o engañosa",
    "Categoría incorrecta",
    "Otro motivo",
  ];
  return (
    <div className="confirm-bg" onClick={onClose}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="danger-ic">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
          </svg>
        </div>
        <h3 className="h">Rechazar {kind}</h3>
        <p className="p">El organizador recibirá un mensaje con el motivo. Sé claro para que pueda corregir y reenviar.</p>
        <div className="field" style={{ margin: 0 }}>
          <label>Motivo común</label>
          <select onChange={(e) => setReason(e.target.value)} value={reason}>
            <option value="">Selecciona un motivo o escribe abajo</option>
            {presets.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label>Mensaje al organizador</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explica al organizador por qué se rechaza..."
            style={{ minHeight: 100 }}
          />
        </div>
        <div className="row-act" style={{ marginTop: 14 }}>
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn primary"
            style={{ background: "var(--err)" }}
            onClick={() => { onReject(reason); onClose(); }}
            disabled={!reason.trim()}
          >
            ✕ Rechazar y notificar
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminTransferModal({ onClose, onTransfer }: { onClose: () => void; onTransfer: (dest: { nm: string } | null) => void }) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<{ ch: string; nm: string; hd: string; type: string; pal: string[] } | null>(null);
  const matches = [
    { ch: "C", nm: "Cinépolis Chile", hd: "@cinepolis", type: "org", pal: ["#a25cff", "#5b39ff"] },
    { ch: "K", nm: "Konbini Editorial", hd: "@konbini-ed", type: "org", pal: ["#ff5b8a", "#ff2a59"] },
    { ch: "MP", nm: "María Pérez", hd: "maria.perez@email.cl", type: "user", pal: ["#3bbf8a", "#1e8a5b"] },
    { ch: "JR", nm: "José Ramírez", hd: "jr@email.cl", type: "user", pal: ["#3b9eff", "#2a5bff"] },
  ].filter((m) => !q || m.nm.toLowerCase().includes(q.toLowerCase()) || m.hd.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="confirm-bg" onClick={onClose}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <h3 className="h">Transferir a otra cuenta</h3>
        <p className="p">Busca al destinatario por nombre, handle o email. La transferencia se aplica inmediatamente.</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--ink-3)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input autoFocus placeholder="Buscar cuenta..." value={q} onChange={(e) => setQ(e.target.value)} style={{ background: "none", border: "none", outline: "none", flex: 1, fontSize: 13, color: "var(--ink)" }} />
        </div>
        <div style={{ maxHeight: 280, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 10, padding: 4 }}>
          {matches.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>Sin resultados</div>
          ) : matches.map((m) => (
            <div
              key={m.hd}
              onClick={() => setPicked(m)}
              style={{ display: "flex", gap: 12, alignItems: "center", padding: 10, borderRadius: 8, cursor: "pointer", background: picked?.hd === m.hd ? "var(--surface-2)" : "transparent" }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 999, background: `linear-gradient(135deg, ${m.pal[0]}, ${m.pal[1]})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{m.ch}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{m.nm}</div>
                <div style={{ color: "var(--ink-3)", fontSize: 11, fontFamily: "var(--font-mono)" }}>{m.hd}</div>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".1em", color: "var(--ink-3)", padding: "3px 7px", borderRadius: 4, background: "var(--surface-2)" }}>
                {m.type === "org" ? "ORG" : "USUARIO"}
              </span>
            </div>
          ))}
        </div>
        <div className="row-act" style={{ marginTop: 18 }}>
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn dark" onClick={() => { onTransfer(picked); onClose(); }} disabled={!picked}>
            Transferir a {picked?.nm || "..."}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  danger = false,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  typeToConfirm,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  danger?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  typeToConfirm?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [typed, setTyped] = useState("");
  const ok = !typeToConfirm || typed.trim().toUpperCase() === typeToConfirm.toUpperCase();
  return (
    <div className="confirm-bg" onClick={onClose}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
        {danger && (
          <div className="danger-ic">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
          </div>
        )}
        <h3 className="h">{title}</h3>
        <p className="p">{message}</p>
        {typeToConfirm && (
          <>
            <p className="p" style={{ marginBottom: 8, fontSize: 12, color: "var(--ink-3)" }}>
              Para confirmar, escribe <strong style={{ color: "var(--err)" }}>{typeToConfirm}</strong> abajo:
            </p>
            <input className="danger-input" value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
          </>
        )}
        <div className="row-act">
          <button className="btn ghost" onClick={onClose}>{cancelLabel}</button>
          <button
            className={`btn ${danger ? "primary" : "dark"}`}
            style={danger ? { background: "var(--err)", color: "#fff" } : undefined}
            onClick={ok ? onConfirm : undefined}
            disabled={!ok}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────

const STATUSES = ["Todos", "Pendiente", "Activo", "Rechazado", "Expirado"];

export default function HeroesSection() {
  const [activeStatus, setActiveStatus] = useState("Todos");
  const [modal, setModal] = useState<ModalState>(null);
  const close = () => setModal(null);

  const items = EVENTS.map((e, i) => ({
    ...e,
    status: i === 0 || i === 4 ? "Pendiente" : i === 5 ? "Rechazado" : "Activo",
  }));

  const filtered = activeStatus === "Todos" ? items : items.filter((e) => e.status === activeStatus);

  return (
    <>
      {/* Filter chips + occupancy badge */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        {STATUSES.map((s) => (
          <button key={s} className={`sel ${activeStatus === s ? "on" : ""}`} onClick={() => setActiveStatus(s)}>
            {s}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", padding: "9px 14px", borderRadius: 999, background: "color-mix(in oklab, var(--accent) 12%, transparent)", color: "var(--accent)", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-mono)", letterSpacing: ".08em" }}>
          OCUPACIÓN · 3 / 5
        </div>
      </div>

      {/* Table */}
      <div className="panel" style={{ padding: 0 }}>
        <table className="a-table">
          <thead>
            <tr>
              <th>PORTADA</th>
              <th>ORGANIZADOR</th>
              <th>FECHA</th>
              <th>PRECIO</th>
              <th>ESTADO</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id}>
                {/* PORTADA: thumb + title + category */}
                <td>
                  <div className="cell-evt">
                    <div className="thumb-sm"><div className={`pic poster-art ${e.art}`} /></div>
                    <div>
                      <div className="ti">{e.title}</div>
                      <div className="su">{e.cat}</div>
                    </div>
                  </div>
                </td>

                {/* ORGANIZADOR */}
                <td>
                  <div style={{ fontSize: 13 }}>
                    Cinépolis Chile
                    <br />
                    <span style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 11 }}>@cinepolis</span>
                  </div>
                </td>

                {/* FECHA */}
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{e.date}</td>

                {/* PRECIO */}
                <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                  ${(e.price * 1000).toLocaleString("es-CL")}
                </td>

                {/* ESTADO */}
                <td>
                  <span className={`stat-pill ${e.status === "Pendiente" ? "rev" : e.status === "Rechazado" ? "rej" : e.status === "Expirado" ? "exp" : "pub"}`}>
                    <span className="dot" />{e.status}
                  </span>
                </td>

                {/* ACCIONES */}
                <td>
                  <div className="row-act">
                    {e.status === "Pendiente" && (
                      <>
                        <button className="ok" onClick={() => setModal({ type: "approve", item: e })}>✓ Aprobar</button>
                        <button className="bad" onClick={() => setModal({ type: "reject", item: e })}>✕ Rechazar</button>
                      </>
                    )}
                    {e.status === "Activo" && (
                      <>
                        <button onClick={() => {}}>Editar</button>
                        <button className="bad" onClick={() => setModal({ type: "ban", item: e })}>Banear</button>
                        <button onClick={() => setModal({ type: "transfer", item: e })}>Transferir</button>
                      </>
                    )}
                    {e.status === "Rechazado" && (
                      <>
                        <button onClick={() => setModal({ type: "approve", item: e })}>Re-revisar</button>
                        <button onClick={() => setModal({ type: "transfer", item: e })}>Transferir</button>
                      </>
                    )}
                    {e.status === "Expirado" && (
                      <button onClick={() => setModal({ type: "transfer", item: e })}>Transferir</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {modal?.type === "approve" && (
        <AdminApproveModal kind="portada" onClose={close} onApprove={() => {}} />
      )}
      {modal?.type === "reject" && (
        <AdminRejectModal kind="portada" onClose={close} onReject={() => {}} />
      )}
      {modal?.type === "transfer" && (
        <AdminTransferModal onClose={close} onTransfer={() => {}} />
      )}
      {modal?.type === "ban" && (
        <ConfirmDialog
          danger
          title="¿Banear portada?"
          message="La portada dejará de ser pública inmediatamente. El organizador será notificado. Puedes restaurarla después si fue un error."
          typeToConfirm="BANEAR"
          confirmLabel="Sí, banear"
          onConfirm={close}
          onClose={close}
        />
      )}
    </>
  );
}
