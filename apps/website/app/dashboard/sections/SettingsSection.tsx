"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { AdminFormModal } from "@/app/dashboard/modals/AdminFormModal";

// ── Types ─────────────────────────────────────────────────────────────────────

type ServiceItem = { name: string };

type ModalState =
  | { type: "createFoto" }
  | { type: "editFoto"; item: ServiceItem }
  | { type: "deleteFoto"; item: ServiceItem }
  | { type: "createCreat" }
  | { type: "editCreat"; item: ServiceItem }
  | { type: "deleteCreat"; item: ServiceItem }
  | { type: "legal"; key: string; label: string; content: string }
  | null;

// ── Default services ──────────────────────────────────────────────────────────

const DEFAULT_FOTO: ServiceItem[] = [
  { name: "Cobertura completa del evento" },
  { name: "Sesión previa al evento" },
  { name: "Entrega en 48 horas" },
  { name: "Retoque profesional" },
];

const DEFAULT_CREAT: ServiceItem[] = [
  { name: "Reels para Instagram / TikTok" },
  { name: "Aftermovie" },
  { name: "Cobertura en vivo (stories)" },
  { name: "Video resumen 60s" },
];

// ── Legal texts ───────────────────────────────────────────────────────────────

const LEGAL_TEXTS = [
  { key: "legal_terms",   label: "Editar Términos y condiciones" },
  { key: "legal_privacy", label: "Editar Política de privacidad" },
  { key: "legal_cookies", label: "Editar Política de cookies" },
];

// ── Inline ConfirmDialog ──────────────────────────────────────────────────────

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
    <div className="confirm-bg" onClick={onClose}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 18 }}>{message}</p>
        <div className="modal-acts">
          <button
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
            onClick={onConfirm}
            style={{
              padding: "10px 20px",
              borderRadius: 999,
              background: "var(--err)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SettingsSection() {
  const { token } = useUser();

  // Numeric values
  const [avisos, setAvisos] = useState({
    aviso_price_per_day: "8000",
    aviso_max_slots:     "12",
    aviso_min_days:      "10",
    aviso_max_days:      "30",
  });
  const [portadas, setPortadas] = useState({
    portada_price_per_day: "15000",
    portada_max_slots:     "5",
    portada_min_days:      "10",
    portada_max_days:      "30",
  });
  const [busyAvisos,   setBusyAvisos]   = useState(false);
  const [busyPortadas, setBusyPortadas] = useState(false);

  // Services
  const [fotoServices,  setFotoServices]  = useState<ServiceItem[]>(DEFAULT_FOTO);
  const [creatServices, setCreatServices] = useState<ServiceItem[]>(DEFAULT_CREAT);

  // Legal
  const [legalValues, setLegalValues] = useState<Record<string, string>>({});
  const [busyLegal,   setBusyLegal]   = useState(false);

  // Modal
  const [modal, setModal] = useState<ModalState>(null);
  const closeModal = () => setModal(null);

  // Service form input
  const [svcInput, setSvcInput] = useState("");

  // Load settings on mount
  useEffect(() => {
    if (!token) return;
    fetch("/api/settings", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (!r.ok) return;
        const data: Array<{ key: string; value: string }> = await r.json();
        if (!Array.isArray(data)) return;
        const avisosPatch: Record<string, string> = {};
        const portadasPatch: Record<string, string> = {};
        const legalPatch: Record<string, string> = {};
        data.forEach(({ key, value }) => {
          if (key in avisos)   avisosPatch[key]   = value;
          if (key in portadas) portadasPatch[key] = value;
          if (LEGAL_TEXTS.some((t) => t.key === key)) legalPatch[key] = value;
        });
        if (Object.keys(avisosPatch).length)   setAvisos((p) => ({ ...p, ...avisosPatch }));
        if (Object.keys(portadasPatch).length) setPortadas((p) => ({ ...p, ...portadasPatch }));
        if (Object.keys(legalPatch).length)    setLegalValues((p) => ({ ...p, ...legalPatch }));
      })
      .catch(() => {/* use defaults */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Save handlers
  async function saveBlock(
    body: Record<string, string>,
    setBusy: (b: boolean) => void,
    successMsg: string,
  ) {
    if (!token) return;
    setBusy(true);
    try {
      const r = await fetch("/api/settings", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("Error al guardar");
      toast.success(successMsg);
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al guardar");
    } finally {
      setBusy(false);
    }
  }

  async function saveLegal(key: string, content: string) {
    if (!token) return;
    setBusyLegal(true);
    try {
      const r = await fetch("/api/settings", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: content }),
      });
      if (!r.ok) throw new Error("Error al guardar");
      toast.success("Texto legal guardado");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al guardar");
    } finally {
      setBusyLegal(false);
    }
  }

  // Service CRUD
  function openCreateFoto() { setSvcInput(""); setModal({ type: "createFoto" }); }
  function openEditFoto(item: ServiceItem) { setSvcInput(item.name); setModal({ type: "editFoto", item }); }
  function openDeleteFoto(item: ServiceItem) { setModal({ type: "deleteFoto", item }); }
  function openCreateCreat() { setSvcInput(""); setModal({ type: "createCreat" }); }
  function openEditCreat(item: ServiceItem) { setSvcInput(item.name); setModal({ type: "editCreat", item }); }
  function openDeleteCreat(item: ServiceItem) { setModal({ type: "deleteCreat", item }); }

  function handleSaveService() {
    const nm = svcInput.trim();
    if (!nm) return;
    if (modal?.type === "createFoto") {
      setFotoServices((p) => [...p, { name: nm }]);
      toast.success("Servicio creado");
    } else if (modal?.type === "editFoto" && modal.item) {
      setFotoServices((p) => p.map((s) => s.name === modal.item.name ? { name: nm } : s));
      toast.success("Servicio actualizado");
    } else if (modal?.type === "createCreat") {
      setCreatServices((p) => [...p, { name: nm }]);
      toast.success("Servicio creado");
    } else if (modal?.type === "editCreat" && modal.item) {
      setCreatServices((p) => p.map((s) => s.name === modal.item.name ? { name: nm } : s));
      toast.success("Servicio actualizado");
    }
    closeModal();
  }

  function handleDeleteService() {
    if (modal?.type === "deleteFoto" && modal.item) {
      setFotoServices((p) => p.filter((s) => s.name !== modal.item.name));
      toast.success("Servicio eliminado");
    } else if (modal?.type === "deleteCreat" && modal.item) {
      setCreatServices((p) => p.filter((s) => s.name !== modal.item.name));
      toast.success("Servicio eliminado");
    }
    closeModal();
  }

  const isServiceModal =
    modal?.type === "createFoto" ||
    modal?.type === "editFoto" ||
    modal?.type === "createCreat" ||
    modal?.type === "editCreat";

  const isDeleteModal =
    modal?.type === "deleteFoto" ||
    modal?.type === "deleteCreat";

  return (
    <>
      {/* Panel: Precios y límites de Avisos */}
      <div className="panel">
        <div className="ph">
          <h3>Precios y límites de Avisos</h3>
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Precio por día (CLP)</label>
            <input
              type="number"
              value={avisos.aviso_price_per_day}
              onChange={(e) => setAvisos((p) => ({ ...p, aviso_price_per_day: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Cupo máximo simultáneo</label>
            <input
              type="number"
              value={avisos.aviso_max_slots}
              onChange={(e) => setAvisos((p) => ({ ...p, aviso_max_slots: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Días mínimos</label>
            <input
              type="number"
              value={avisos.aviso_min_days}
              onChange={(e) => setAvisos((p) => ({ ...p, aviso_min_days: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Días máximos</label>
            <input
              type="number"
              value={avisos.aviso_max_days}
              onChange={(e) => setAvisos((p) => ({ ...p, aviso_max_days: e.target.value }))}
            />
          </div>
        </div>
        <button
          className="btn dark"
          onClick={() => saveBlock(avisos, setBusyAvisos, "Configuración de avisos guardada")}
          disabled={busyAvisos}
        >
          {busyAvisos ? "Guardando…" : "Guardar"}
        </button>
      </div>

      {/* Panel: Precios y límites de Portadas */}
      <div className="panel">
        <div className="ph">
          <h3>Precios y límites de Portadas</h3>
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Precio por día (CLP)</label>
            <input
              type="number"
              value={portadas.portada_price_per_day}
              onChange={(e) => setPortadas((p) => ({ ...p, portada_price_per_day: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Cupo máximo simultáneo</label>
            <input
              type="number"
              value={portadas.portada_max_slots}
              onChange={(e) => setPortadas((p) => ({ ...p, portada_max_slots: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Días mínimos</label>
            <input
              type="number"
              value={portadas.portada_min_days}
              onChange={(e) => setPortadas((p) => ({ ...p, portada_min_days: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Días máximos</label>
            <input
              type="number"
              value={portadas.portada_max_days}
              onChange={(e) => setPortadas((p) => ({ ...p, portada_max_days: e.target.value }))}
            />
          </div>
        </div>
        <button
          className="btn dark"
          onClick={() => saveBlock(portadas, setBusyPortadas, "Configuración de portadas guardada")}
          disabled={busyPortadas}
        >
          {busyPortadas ? "Guardando…" : "Guardar"}
        </button>
      </div>

      {/* Panel: Servicios de fotografía */}
      <div className="panel">
        <div className="ph">
          <h3>Servicios de fotografía</h3>
          <button
            className="btn ghost"
            style={{ padding: "8px 14px", fontSize: 12 }}
            onClick={openCreateFoto}
          >
            ＋ Agregar
          </button>
        </div>
        <div style={{ color: "var(--ink-3)", fontSize: 13, marginBottom: 10 }}>
          Opciones que ve el organizador en el formulario de /fotografia.
        </div>
        {fotoServices.map((s) => (
          <div key={s.name} className="acc-list-row" style={{ padding: "10px 0" }}>
            <div className="main">
              <div className="t">{s.name}</div>
            </div>
            <div className="row-act">
              <button
                className="sel"
                style={{ padding: "6px 10px", fontSize: 12 }}
                onClick={() => openEditFoto(s)}
              >
                Editar
              </button>
              <button
                className="sel bad"
                style={{ padding: "6px 10px", fontSize: 12, color: "var(--err)" }}
                onClick={() => openDeleteFoto(s)}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Panel: Servicios de creadores de contenido */}
      <div className="panel">
        <div className="ph">
          <h3>Servicios de creadores de contenido</h3>
          <button
            className="btn ghost"
            style={{ padding: "8px 14px", fontSize: 12 }}
            onClick={openCreateCreat}
          >
            ＋ Agregar
          </button>
        </div>
        <div style={{ color: "var(--ink-3)", fontSize: 13, marginBottom: 10 }}>
          Opciones que ve el organizador en /creadores.
        </div>
        {creatServices.map((s) => (
          <div key={s.name} className="acc-list-row" style={{ padding: "10px 0" }}>
            <div className="main">
              <div className="t">{s.name}</div>
            </div>
            <div className="row-act">
              <button
                className="sel"
                style={{ padding: "6px 10px", fontSize: 12 }}
                onClick={() => openEditCreat(s)}
              >
                Editar
              </button>
              <button
                className="sel bad"
                style={{ padding: "6px 10px", fontSize: 12, color: "var(--err)" }}
                onClick={() => openDeleteCreat(s)}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Panel: Textos legales */}
      <div className="panel">
        <div className="ph">
          <h3>Textos legales</h3>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {LEGAL_TEXTS.map((t) => (
            <button
              key={t.key}
              className="btn ghost"
              onClick={() =>
                setModal({
                  type: "legal",
                  key:   t.key,
                  label: t.label,
                  content: legalValues[t.key] ?? "",
                })
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Panel: Integraciones */}
      <div className="panel">
        <div className="ph">
          <h3>Integraciones</h3>
        </div>
        <div className="acc-list-row">
          <div className="main">
            <div className="t">WebPay Plus (Transbank)</div>
            <div className="m">Conectado · Producción</div>
          </div>
          <span className="stat-pill pub"><span className="dot" />Activo</span>
          <button className="btn ghost" style={{ padding: "8px 14px" }}>Configurar</button>
        </div>
        <div className="acc-list-row">
          <div className="main">
            <div className="t">Mercado Pago</div>
            <div className="m">No configurado</div>
          </div>
          <span className="stat-pill exp"><span className="dot" />Inactivo</span>
          <button className="btn ghost" style={{ padding: "8px 14px" }}>Conectar</button>
        </div>
        <div className="acc-list-row">
          <div className="main">
            <div className="t">Flow</div>
            <div className="m">No configurado</div>
          </div>
          <span className="stat-pill exp"><span className="dot" />Inactivo</span>
          <button className="btn ghost" style={{ padding: "8px 14px" }}>Conectar</button>
        </div>
      </div>

      {/* Modal: Create / Edit service */}
      {isServiceModal && (
        <AdminFormModal
          title={
            modal?.type === "createFoto" ? "Nuevo servicio de fotografía" :
            modal?.type === "editFoto"   ? "Editar servicio" :
            modal?.type === "createCreat"? "Nuevo servicio de creadores" :
                                           "Editar servicio"
          }
          onClose={closeModal}
          onSubmit={handleSaveService}
          submitLabel="Guardar"
        >
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Nombre del servicio</label>
            <input
              type="text"
              value={svcInput}
              onChange={(e) => setSvcInput(e.target.value)}
              placeholder="Ej: Cobertura completa del evento"
              autoFocus
            />
          </div>
        </AdminFormModal>
      )}

      {/* Modal: Delete service */}
      {isDeleteModal && (modal?.type === "deleteFoto" || modal?.type === "deleteCreat") && (
        <ConfirmDialog
          title="¿Eliminar servicio?"
          message={`"${modal.item.name}" ya no aparecerá en el formulario público.`}
          confirmLabel="Sí, eliminar"
          onConfirm={handleDeleteService}
          onClose={closeModal}
        />
      )}

      {/* Modal: Legal text editor */}
      {modal?.type === "legal" && (
        <div className="confirm-bg" onClick={closeModal}>
          <div
            className="confirm-card"
            style={{ maxWidth: 680, width: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ph" style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>{modal.label}</h3>
            </div>
            <textarea
              rows={16}
              value={modal.content}
              onChange={(e) => {
                const val = e.target.value;
                setModal((m) => m?.type === "legal" ? { ...m, content: val } : m);
              }}
              style={{
                width: "100%",
                background: "var(--surface-2)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 13,
                color: "var(--ink)",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
                lineHeight: 1.6,
              }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
              <button className="btn ghost" onClick={closeModal}>Cancelar</button>
              <button
                className="btn dark"
                disabled={busyLegal}
                onClick={async () => {
                  if (modal?.type !== "legal") return;
                  const { key, content } = modal;
                  setLegalValues((p) => ({ ...p, [key]: content }));
                  await saveLegal(key, content);
                  closeModal();
                }}
              >
                {busyLegal ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
