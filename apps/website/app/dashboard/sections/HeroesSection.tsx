"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { imageUrl } from "@/lib/api";

type Hero = {
  id: number;
  title: string;
  titleAccent?: string | null;
  lead?: string | null;
  image?: string | null;
  link?: string | null;
  status?: string;
  expirationDate?: string | null;
  days?: number | null;
  amount?: number | null;
};

export default function HeroesSection() {
  const { token } = useUser();
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch("/api/heroes/admin", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Error al cargar portadas");
        const data = await r.json();
        setHeroes(Array.isArray(data) ? data : (data.items ?? []));
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Error al cargar portadas"))
      .finally(() => setLoading(false));
  }, [token]);

  const approve = async (id: number) => {
    if (!token) return;
    try {
      const r = await fetch(`/api/heroes/${id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Error al aprobar");
      setHeroes((list) => list.map((h) => (h.id === id ? { ...h, status: "ACTIVE" } : h)));
      toast.success("Portada aprobada");
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
      const r = await fetch(`/api/heroes/${id}/reject`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!r.ok) throw new Error("Error al rechazar");
      setHeroes((list) => list.map((h) => (h.id === id ? { ...h, status: "REJECTED" } : h)));
      toast.success("Portada rechazada");
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
        <h2>Portadas</h2>
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
          OCUPACIÓN · {heroes.length} / 5
        </span>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="empty">
            <h3>Cargando portadas…</h3>
          </div>
        ) : heroes.length === 0 ? (
          <div className="empty">
            <h3>Sin portadas</h3>
            <p>No hay portadas activas.</p>
          </div>
        ) : (
          <table className="evt">
            <thead>
              <tr>
                <th>Portada</th>
                <th>Días</th>
                <th>Monto</th>
                <th>Expiración</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {heroes.map((h) => {
                const thumb = imageUrl(h.image);
                return (
                  <tr key={h.id}>
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
                          <div className="ti">{h.title}</div>
                          {h.titleAccent && (
                            <div className="mt">{h.titleAccent}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                      {h.days ?? "—"}d
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 500 }}>
                      {h.amount ? `$${h.amount.toLocaleString("es-CL")}` : "—"}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                      {h.expirationDate
                        ? new Date(h.expirationDate).toLocaleDateString("es-CL")
                        : "—"}
                    </td>
                    <td>
                      <div className={`stat ${statusClass(h.status)}`}>
                        <span className="dot" />
                        {statusLabel(h.status)}
                      </div>
                    </td>
                    <td>
                      <div className="row-acts">
                        {h.status !== "ACTIVE" && (
                          <button
                            style={{ color: "var(--ok)" }}
                            onClick={() => approve(h.id)}
                          >
                            ✓ Aprobar
                          </button>
                        )}
                        {h.status !== "REJECTED" && (
                          <button
                            style={{ color: "var(--err)" }}
                            onClick={() => reject(h.id)}
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
