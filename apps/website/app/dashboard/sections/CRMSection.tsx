"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";

type CRMStage = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST";

type CRMLead = {
  id: number;
  name: string;
  email?: string;
  company?: string;
  stage: CRMStage;
  type?: string;
};

const STAGES: { id: CRMStage; label: string; color: string }[] = [
  { id: "NEW", label: "Nuevo", color: "var(--ink-3)" },
  { id: "CONTACTED", label: "Contactado", color: "var(--accent-3)" },
  { id: "QUALIFIED", label: "Calificado", color: "var(--accent-2)" },
  { id: "PROPOSAL", label: "Propuesta", color: "var(--accent)" },
  { id: "WON", label: "Ganado", color: "var(--ok)" },
  { id: "LOST", label: "Perdido", color: "var(--err)" },
];

const MOCK_LEADS: CRMLead[] = [
  { id: 1, name: "Anime Events CL", email: "info@animeevents.cl", stage: "NEW", type: "Evento" },
  { id: 2, name: "Jorge Maturana", email: "jm@email.cl", stage: "CONTACTED", type: "Fotografía" },
  { id: 3, name: "CineClub Santiago", email: "admin@cineclub.cl", stage: "QUALIFIED", type: "Evento", company: "CineClub Santiago" },
  { id: 4, name: "K-Pop Fest", email: "kpop@fest.cl", stage: "PROPOSAL", type: "Evento" },
  { id: 5, name: "María Pérez", email: "maria@email.cl", stage: "WON", type: "Fotografía" },
  { id: 6, name: "Cosplay Atelier", email: "info@cosplay.cl", stage: "LOST", type: "Aviso" },
];

export default function CRMSection() {
  const { token } = useUser();
  const [leads, setLeads] = useState<CRMLead[]>(MOCK_LEADS);

  useEffect(() => {
    if (!token) return;
    fetch("/api/crm", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (!r.ok) return;
        const data = await r.json();
        const items: CRMLead[] = Array.isArray(data) ? data : (data.items ?? []);
        if (items.length > 0) setLeads(items);
      })
      .catch(() => {/* use mock */});
  }, [token]);

  const moveStage = async (lead: CRMLead, newStage: CRMStage) => {
    if (!token) return;
    const prev = lead.stage;
    setLeads((list) => list.map((l) => (l.id === lead.id ? { ...l, stage: newStage } : l)));
    try {
      const r = await fetch(`/api/crm/${lead.id}/stage`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      if (!r.ok) throw new Error();
      toast.success(`Movido a ${STAGES.find((s) => s.id === newStage)?.label}`);
    } catch {
      setLeads((list) => list.map((l) => (l.id === lead.id ? { ...l, stage: prev } : l)));
      toast.error("No se pudo mover");
    }
  };

  return (
    <>
      <div className="section-head" style={{ marginBottom: 20 }}>
        <h2>CRM</h2>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
          {leads.length} LEADS
        </span>
      </div>
      <div className="kanban">
        {STAGES.map((st) => {
          const stLeads = leads.filter((l) => l.stage === st.id);
          return (
            <div key={st.id} className="kanban-col">
              <div className="k-head">
                <span style={{ color: st.color }}>{st.label}</span>
                <span className="k-count">{stLeads.length}</span>
              </div>
              <div className="k-body">
                {stLeads.map((lead) => (
                  <div key={lead.id} className="k-card">
                    <div className="k-title">{lead.name}</div>
                    {lead.email && <div className="k-meta">{lead.email}</div>}
                    {lead.type && (
                      <div
                        style={{
                          marginTop: 6,
                          display: "inline-block",
                          fontFamily: "var(--font-mono)",
                          fontSize: 9,
                          padding: "2px 7px",
                          borderRadius: 999,
                          background: "var(--surface-2)",
                          border: "1px solid var(--line)",
                          color: "var(--ink-3)",
                          letterSpacing: ".06em",
                        }}
                      >
                        {lead.type.toUpperCase()}
                      </div>
                    )}
                    <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {STAGES.filter((s) => s.id !== st.id)
                        .slice(0, 3)
                        .map((s) => (
                          <button
                            key={s.id}
                            style={{
                              fontSize: 10,
                              padding: "3px 8px",
                              borderRadius: 999,
                              background: "var(--surface-2)",
                              border: "1px solid var(--line)",
                              color: "var(--ink-3)",
                              cursor: "pointer",
                            }}
                            onClick={() => moveStage(lead, s.id)}
                          >
                            → {s.label}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
                {stLeads.length === 0 && (
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
    </>
  );
}
