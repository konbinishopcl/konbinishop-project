"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { api, ApiContactMessage } from "@/lib/api";
import { TablePagination, useClientPagination } from "@/components/TablePagination";

const MESES = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
}

function initials(nm: string): string {
  return nm.split(" ").map((w) => w[0]).slice(0, 2).join("");
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="confirm-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-acts">
          <button onClick={onClose}>Cancelar</button>
          <button className="btn dark" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default function InboxSection({ kind = "contact" }: { kind?: "contact" | "photo" | "creators" }) {
  const { token } = useUser();
  const [msgs, setMsgs] = useState<ApiContactMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"Todos" | "No leídos">("Todos");
  const [openItem, setOpenItem] = useState<ApiContactMessage | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ApiContactMessage | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.contactAll(token);
      setMsgs(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error cargando mensajes");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (kind !== "contact") {
    return (
      <div className="panel" style={{ padding: 24, textAlign: "center", color: "var(--ink-3)" }}>
        <p>Bandeja de entrada para este servicio disponible próximamente.</p>
        <p style={{ fontSize: 12, marginTop: 6 }}>Los mensajes de este tipo se gestionan en la sección <strong>CRM</strong>.</p>
      </div>
    );
  }

  const visible = filter === "No leídos" ? msgs.filter((m) => !m.read) : msgs;
  const { page, goPage, perPage, changePerPage, total: pTotal, totalPages, from, to, paginated: paginatedMsgs } = useClientPagination(visible);

  async function handleOpen(item: ApiContactMessage) {
    setOpenItem(item);
    if (!item.read && token) {
      setMsgs((prev) => prev.map((m) => m.id === item.id ? { ...m, read: true } : m));
      try {
        await api.contactMarkRead(item.id, token);
      } catch {
        // revert optimistic update silently
        setMsgs((prev) => prev.map((m) => m.id === item.id ? { ...m, read: false } : m));
      }
    }
  }

  async function handleDelete() {
    if (!confirmDelete || !token) return;
    const target = confirmDelete;
    setConfirmDelete(null);
    try {
      await api.contactRemove(target.id, token);
      setMsgs((prev) => prev.filter((m) => m.id !== target.id));
      toast.success("Mensaje eliminado");
      if (openItem?.id === target.id) setOpenItem(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error eliminando mensaje");
    }
  }

  if (loading && msgs.length === 0) {
    return <div className="panel" style={{ padding: 24 }}>Cargando mensajes…</div>;
  }

  return (
    <>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        {(["Todos", "No leídos"] as const).map((f) => (
          <button key={f} className={`sel${filter === f ? " on" : ""}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <table className="a-table">
          <thead>
            <tr>
              <th>CONTACTO</th>
              <th>ASUNTO</th>
              <th>FECHA</th>
              <th>ESTADO</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--ink-3)", padding: 24 }}>
                  {filter === "No leídos" ? "No hay mensajes sin leer." : "No hay mensajes."}
                </td>
              </tr>
            )}
            {paginatedMsgs.map((m) => (
              <tr key={m.id}>
                <td>
                  <div className="cell-evt">
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 999,
                        background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      {initials(m.name)}
                    </div>
                    <div>
                      <div className="ti">{m.name}</div>
                      <div className="su">{m.email}</div>
                    </div>
                  </div>
                </td>
                <td>{m.subject}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{formatShortDate(m.createdAt)}</td>
                <td>
                  <span className={`stat-pill ${m.read ? "pub" : "rev"}`}>
                    <span className="dot" />
                    {m.read ? "Leído" : "No leído"}
                  </span>
                </td>
                <td>
                  <div className="row-act">
                    <button onClick={() => handleOpen(m)}>Abrir</button>
                    <button onClick={() => setConfirmDelete(m)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TablePagination
        page={page} totalPages={totalPages} total={pTotal} from={from} to={to}
        perPage={perPage} noun="mensaje"
        onPageChange={goPage} onPerPageChange={changePerPage}
      />

      {/* Open item modal */}
      {openItem && (
        <div className="confirm-bg" onClick={() => setOpenItem(null)}>
          <div
            className="confirm-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 560 }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 15,
                    flexShrink: 0,
                  }}
                >
                  {initials(openItem.name)}
                </div>
                <div>
                  <h3 className="h" style={{ margin: 0 }}>{openItem.name}</h3>
                  <a
                    href={`mailto:${openItem.email}`}
                    style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: 12 }}
                  >
                    {openItem.email}
                  </a>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setOpenItem(null)}>✕</button>
            </div>

            {/* Content box */}
            <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".15em", color: "var(--ink-3)", marginBottom: 4 }}>
                ASUNTO
              </div>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>{openItem.subject}</div>
              <div style={{ color: "var(--ink-2)", fontSize: 14, lineHeight: 1.55 }}>{openItem.message}</div>
            </div>

            {/* Footer */}
            <div className="row-act" style={{ justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  window.location.href = `mailto:${openItem.email}`;
                  setOpenItem(null);
                }}
              >
                ✉ Responder por email
              </button>
              <button
                className="btn dark"
                style={{ padding: "6px 14px", fontSize: 12 }}
                onClick={() => setOpenItem(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <ConfirmDialog
          title="¿Eliminar mensaje?"
          message={`El mensaje de "${confirmDelete.name}" será eliminado permanentemente.`}
          confirmLabel="Sí, eliminar"
          onConfirm={handleDelete}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}
