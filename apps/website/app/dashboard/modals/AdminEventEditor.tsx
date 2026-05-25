"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { api, type CreateEventInput } from "@/lib/api";

type EventEditorMode = "create" | "edit";

interface EventEditorInitial {
  title?: string;
  company?: string;
  description?: string;
  address?: string;
  categoryIds?: number[];
}

interface AdminEventEditorProps {
  mode: EventEditorMode;
  initial?: EventEditorInitial;
  onClose?: () => void;
  onSaved?: () => void;
}

export function AdminEventEditor({
  mode,
  initial,
  onClose,
  onSaved,
}: AdminEventEditorProps) {
  const { token } = useUser();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Partial<CreateEventInput>>({
    title: initial?.title ?? "",
    company: initial?.company ?? "",
    description: initial?.description ?? "",
    address: initial?.address ?? "",
  });

  const set = (key: keyof CreateEventInput, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("No autenticado");
      return;
    }
    if (!form.title?.trim() || !form.description?.trim() || !form.address?.trim()) {
      toast.error("Título, descripción y dirección son requeridos");
      return;
    }
    setBusy(true);
    try {
      const payload: CreateEventInput = {
        title: form.title!.trim(),
        company: form.company?.trim(),
        description: form.description!.trim(),
        address: form.address!.trim(),
      };
      await api.createEvent(payload, token);
      toast.success(mode === "create" ? "Evento creado" : "Evento actualizado");
      onSaved?.();
      onClose?.();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al guardar");
    } finally {
      setBusy(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--surface-2)",
    border: "1px solid var(--line)",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    color: "var(--ink)",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    color: "var(--ink-3)",
    fontFamily: "var(--font-mono)",
    letterSpacing: ".1em",
    marginBottom: 6,
  };

  return (
    <div className="confirm-bg" onClick={onClose}>
      <div
        className="confirm-card"
        style={{ maxWidth: 600 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 20 }}>
          {mode === "create" ? "Crear evento" : "Editar evento"}
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>TÍTULO</label>
              <input
                style={inputStyle}
                value={form.title ?? ""}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Nombre del evento"
                required
              />
            </div>
            <div>
              <label style={labelStyle}>ORGANIZACIÓN</label>
              <input
                style={inputStyle}
                value={form.company ?? ""}
                onChange={(e) => set("company", e.target.value)}
                placeholder="Nombre del organizador o empresa"
              />
            </div>
            <div>
              <label style={labelStyle}>DESCRIPCIÓN</label>
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                value={form.description ?? ""}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Describe el evento…"
                required
              />
            </div>
            <div>
              <label style={labelStyle}>DIRECCIÓN</label>
              <input
                style={inputStyle}
                value={form.address ?? ""}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Av. Ejemplo 123, Santiago"
                required
              />
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>FECHA</label>
                <input
                  type="date"
                  style={inputStyle}
                  placeholder="Fecha del evento"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>HORA</label>
                <input
                  type="time"
                  style={inputStyle}
                  placeholder="Hora del evento"
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>URL DE ENTRADAS</label>
              <input
                style={inputStyle}
                value={form.ticketUrl ?? ""}
                onChange={(e) => set("ticketUrl", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="modal-acts" style={{ marginTop: 24 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 20px",
                borderRadius: 999,
                background: "var(--surface)",
                border: "1px solid var(--line)",
                color: "var(--ink)",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy}
              style={{
                padding: "10px 20px",
                borderRadius: 999,
                background: "var(--accent)",
                color: "var(--accent-ink)",
                fontSize: 13,
                fontWeight: 600,
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? "Guardando…" : mode === "create" ? "Crear evento" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
