"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";

type Setting = { key: string; value: string; label: string; description?: string };

const DEFAULT_SETTINGS: Setting[] = [
  {
    key: "site_name",
    value: "Konbini",
    label: "Nombre del sitio",
    description: "Nombre que aparece en el título del navegador y emails.",
  },
  {
    key: "site_email",
    value: "hola@konbini.cl",
    label: "Email de contacto",
    description: "Dirección de email para consultas y notificaciones.",
  },
  {
    key: "approval_required",
    value: "true",
    label: "Requiere aprobación",
    description: "Los eventos requieren aprobación antes de publicarse.",
  },
  {
    key: "max_events_per_user",
    value: "10",
    label: "Límite eventos por usuario",
    description: "Número máximo de eventos que un organizador puede tener activos.",
  },
  {
    key: "hero_price_per_day",
    value: "15000",
    label: "Precio portada (CLP/día)",
    description: "Precio en CLP por día de portada en el home.",
  },
  {
    key: "spot_price_per_day",
    value: "8000",
    label: "Precio aviso (CLP/día)",
    description: "Precio en CLP por día de aviso publicitario.",
  },
];

export default function SettingsSection() {
  const { token } = useUser();
  const [settings, setSettings] = useState<Setting[]>(DEFAULT_SETTINGS);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch("/api/settings", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) return;
        const data: Array<{ key: string; value: string }> = await r.json();
        if (Array.isArray(data) && data.length > 0) {
          setSettings((prev) =>
            prev.map((s) => {
              const found = data.find((d) => d.key === s.key);
              return found ? { ...s, value: found.value } : s;
            }),
          );
        }
      })
      .catch(() => {/* use defaults */});
  }, [token]);

  const startEdit = (s: Setting) => {
    setEditing(s.key);
    setEditValue(s.value);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditValue("");
  };

  const saveSetting = async (key: string) => {
    if (!token) return;
    setBusy(true);
    try {
      const r = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [key]: editValue }),
      });
      if (!r.ok) throw new Error("Error al guardar");
      setSettings((list) => list.map((s) => (s.key === key ? { ...s, value: editValue } : s)));
      toast.success("Configuración guardada");
      cancelEdit();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al guardar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="section-head">
        <h2>Configuración</h2>
      </div>

      <div className="settings-form">
        {settings.map((s) => (
          <div key={s.key} className="settings-row">
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{s.label}</div>
              {s.description && (
                <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{s.description}</div>
              )}
            </div>
            {editing === s.key ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveSetting(s.key);
                    if (e.key === "Escape") cancelEdit();
                  }}
                  autoFocus
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--accent)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: "var(--ink)",
                    outline: "none",
                    width: 200,
                  }}
                />
                <button
                  onClick={() => saveSetting(s.key)}
                  disabled={busy}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: "var(--accent)",
                    color: "var(--accent-ink)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {busy ? "…" : "Guardar"}
                </button>
                <button
                  onClick={cancelEdit}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: "var(--surface-2)",
                    border: "1px solid var(--line)",
                    color: "var(--ink-2)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    color: "var(--ink)",
                    background: "var(--surface-2)",
                    border: "1px solid var(--line)",
                    padding: "6px 12px",
                    borderRadius: 8,
                    minWidth: 120,
                    textAlign: "center",
                  }}
                >
                  {s.value}
                </span>
                <button
                  onClick={() => startEdit(s)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    color: "var(--ink-2)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Editar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
