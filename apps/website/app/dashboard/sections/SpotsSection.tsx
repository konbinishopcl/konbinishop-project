"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { imageUrl } from "@/lib/api";

type Spot = {
  id: number;
  title: string;
  description?: string | null;
  image?: string | null;
  link?: string | null;
  status?: string;
  expirationDate?: string | null;
};

export default function SpotsSection() {
  const { token } = useUser();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch("/api/spots/admin", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Error al cargar avisos");
        const data = await r.json();
        setSpots(Array.isArray(data) ? data : (data.items ?? []));
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Error al cargar avisos"))
      .finally(() => setLoading(false));
  }, [token]);

  const approve = async (id: number) => {
    if (!token) return;
    try {
      const r = await fetch(`/api/spots/${id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Error al aprobar");
      setSpots((list) => list.map((s) => (s.id === id ? { ...s, status: "ACTIVE" } : s)));
      toast.success("Aviso aprobado");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error");
    }
  };

  const reject = async (id: number) => {
    if (!token) return;
    const reason = window.prompt("Motivo del rechazo:");
    if (!reason || reason.trim().length < 3) {
      toast.error("Motivo mínimo 3 caracteres");
      return;
    }
    try {
      const r = await fetch(`/api/spots/${id}/reject`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!r.ok) throw new Error("Error al rechazar");
      setSpots((list) => list.map((s) => (s.id === id ? { ...s, status: "REJECTED" } : s)));
      toast.success("Aviso rechazado");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error");
    }
  };

  const statusClass = (s?: string) =>
    s === "ACTIVE" ? "pub" : s === "REJECTED" ? "rej" : "rev";
  const statusLabel = (s?: string) =>
    s === "ACTIVE" ? "Activo" : s === "REJECTED" ? "Rechazado" : "Pendiente";

  return (
    <>
      <div className="section-head">
        <h2>Avisos</h2>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            padding: "4px 12px",
            borderRadius: 999,
            background: "color-mix(in oklab, var(--accent) 12%, transparent)",
            color: "var(--accent)",
          }}
        >
          OCUPACIÓN · {spots.length} / 12
        </span>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="empty">
            <h3>Cargando avisos…</h3>
          </div>
        ) : spots.length === 0 ? (
          <div className="empty">
            <h3>Sin avisos</h3>
            <p>No hay avisos registrados todavía.</p>
          </div>
        ) : (
          <table className="evt">
            <thead>
              <tr>
                <th>Aviso</th>
                <th>Link</th>
                <th>Expiración</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {spots.map((s) => {
                const thumb = imageUrl(s.image);
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="cell-evt">
                        <div className="thumb">
                          {thumb && (
                            <img
                              src={thumb}
                              alt=""
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          )}
                        </div>
                        <div>
                          <div className="ti">{s.title}</div>
                          <div className="mt">{s.description ?? ""}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {s.link ? (
                        <a
                          href={s.link}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--accent)" }}
                        >
                          {s.link.slice(0, 32)}…
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                      {s.expirationDate
                        ? new Date(s.expirationDate).toLocaleDateString("es-CL")
                        : "—"}
                    </td>
                    <td>
                      <div className={`stat ${statusClass(s.status)}`}>
                        <span className="dot" />
                        {statusLabel(s.status)}
                      </div>
                    </td>
                    <td>
                      <div className="row-acts">
                        {s.status !== "ACTIVE" && (
                          <button
                            style={{ color: "var(--ok)" }}
                            onClick={() => approve(s.id)}
                          >
                            ✓ Aprobar
                          </button>
                        )}
                        {s.status !== "REJECTED" && (
                          <button
                            style={{ color: "var(--err)" }}
                            onClick={() => reject(s.id)}
                          >
                            ✕ Rechazar
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
    </>
  );
}
