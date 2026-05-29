"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, ShieldCheck } from "lucide-react";
import { AccountShell } from "../AccountShell";
import { useUser } from "@/components/providers";

interface Org {
  id:         number;
  name:       string | null;
  handle:     string | null;
  email:      string;
  role:       string;
  isVerified: boolean;
  avatar:     string | null;
}

/* ─── Modal crear organización ──────────────────────────────────────── */
function CreateOrgModal({ token, onClose, onCreated }: {
  token:     string;
  onClose:   () => void;
  onCreated: (org: Org) => void;
}) {
  const [name,          setName]          = useState("");
  const [email,         setEmail]         = useState("");
  const [handle,        setHandle]        = useState("");
  const [handleEdited,  setHandleEdited]  = useState(false);
  const [busy,          setBusy]          = useState(false);

  const toHandle = (val: string) =>
    val.toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30);

  // Auto-generate handle from name until user manually edits it
  const suggestHandle = (val: string) => {
    setName(val);
    if (!handleEdited) setHandle(toHandle(val));
  };

  const handleSubmit = async () => {
    if (!name.trim())        { toast.error("El nombre es requerido"); return; }
    if (!email.includes("@")){ toast.error("Email inválido"); return; }
    if (handle && !/^[a-z0-9-]{3,30}$/.test(handle)) {
      toast.error("El handle debe tener 3–30 caracteres (letras minúsculas, números y guiones)");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), ...(handle ? { handle } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Error al crear organización");
      toast.success(`Organización "${name}" creada`);
      onCreated({ id: data.id, name: data.firstname, handle: data.handle, email: data.email, role: "OWNER", isVerified: false, avatar: null });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", width: "100%", maxWidth: 480, padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 22 }}>Crear organización</h3>
          <button className="icon-btn" onClick={onClose} style={{ width: 32, height: 32, fontSize: 18 }}>✕</button>
        </div>
        <p style={{ color: "var(--ink-3)", fontSize: 13, margin: "0 0 22px" }}>
          Una organización es una cuenta compartida con miembros, carrito y suscripción independientes.
        </p>

        <div className="field">
          <label>Nombre de la organización <span style={{ color: "var(--err)" }}>*</span></label>
          <input
            type="text"
            value={name}
            onChange={(e) => suggestHandle(e.target.value)}
            placeholder="Ej: Productora Konbini"
            maxLength={100}
            autoFocus
          />
        </div>

        <div className="field">
          <label>Email de contacto <span style={{ color: "var(--err)" }}>*</span></label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contacto@miorganizacion.cl"
          />
          <div className="help">Este email se usará para comunicaciones con la organización.</div>
        </div>

        <div className="field">
          <label>Handle <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>(opcional)</span></label>
          <div className="input-prefix">
            <span>@</span>
            <input
              type="text"
              value={handle}
              onChange={(e) => {
                setHandleEdited(true);
                setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30));
              }}
              placeholder="mi-organizacion"
              maxLength={30}
            />
          </div>
          <div className="help">3–30 caracteres. Solo letras minúsculas, números y guiones.</div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
          <button className="btn ghost" onClick={onClose} style={{ flex: 1 }} disabled={busy}>
            Cancelar
          </button>
          <button
            className="btn primary"
            onClick={handleSubmit}
            disabled={busy || !name.trim() || !email.trim()}
            style={{ flex: 2 }}
          >
            {busy ? "Creando…" : "Crear organización →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function OrganizacionesPage() {
  const { user, token, ready, isOrgContext } = useUser();
  const router = useRouter();
  const [orgs,    setOrgs]    = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login?returnTo=/cuenta/organizaciones");
      return;
    }
    if (ready && isOrgContext) {
      router.replace("/cuenta");
      return;
    }
    if (!token) return;
    fetch("/api/organizations/mine", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setOrgs(Array.isArray(data) ? data : []))
      .catch(() => setOrgs([]))
      .finally(() => setLoading(false));
  }, [ready, user, token, router]);

  if (!ready || !user) {
    return (
      <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)" }}>
        {ready ? "Redirigiendo al inicio de sesión…" : "Verificando acceso…"}
      </main>
    );
  }

  const ROLE_LABEL: Record<string, string> = {
    OWNER: "Propietario",
    ADMIN: "Administrador",
    MEMBER: "Miembro",
  };

  return (
    <AccountShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 4 }}>
        <h1>Mis organizaciones</h1>
        {!isOrgContext && (
          <button className="btn primary" onClick={() => setModal(true)}>＋ Crear organización</button>
        )}
      </div>
      <p className="lead">Cuentas compartidas con miembros, carrito y suscripción independientes.</p>

      {loading ? (
        <div className="acc-section" style={{ color: "var(--ink-3)", fontSize: 14 }}>
          Cargando organizaciones…
        </div>
      ) : orgs.length === 0 ? (
        <div className="acc-section" style={{ textAlign: "center", padding: "40px 28px" }}>
          <Building2 size={40} style={{ opacity: .2, marginBottom: 12 }} />
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Aún no tienes organizaciones</div>
          <div style={{ color: "var(--ink-3)", fontSize: 14, marginBottom: 20 }}>
            Crea una para gestionar eventos y miembros de forma independiente.
          </div>
          {!isOrgContext && (
            <button className="btn primary" onClick={() => setModal(true)}>＋ Crear organización</button>
          )}
        </div>
      ) : (
        <div className="acc-section">
          {orgs.map((o) => (
            <div key={o.id} className="acc-list-row">
              <div className="av" style={{ background: "linear-gradient(135deg, var(--accent-3), var(--accent))", fontSize: 16 }}>
                {o.name?.[0]?.toUpperCase() ?? "O"}
              </div>
              <div className="main">
                <div className="t" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {o.name ?? "Sin nombre"}
                  {o.isVerified && <ShieldCheck size={14} style={{ color: "var(--accent)" }} />}
                </div>
                <div className="m">
                  {o.handle ? `@${o.handle} · ` : ""}{ROLE_LABEL[o.role] ?? o.role}
                </div>
              </div>
              <button className="btn ghost" onClick={() => router.push(`/organizacion/${o.handle ?? o.id}`)}>
                Entrar
              </button>
            </div>
          ))}
        </div>
      )}

      {modal && token && !isOrgContext && (
        <CreateOrgModal
          token={token}
          onClose={() => setModal(false)}
          onCreated={(org) => {
            setOrgs((prev) => [...prev, org]);
            setModal(false);
          }}
        />
      )}
    </AccountShell>
  );
}
