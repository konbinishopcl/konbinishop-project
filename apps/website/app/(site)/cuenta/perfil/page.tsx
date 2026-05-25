"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AccountShell } from "../AccountShell";
import { useUser } from "@/components/providers";

/* ─── Modal base ─────────────────────────────────────────────────────── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", width: "100%", maxWidth: 440, padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>{title}</h3>
          <button className="icon-btn" onClick={onClose} style={{ width: 32, height: 32, fontSize: 18 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── Modal: Cambiar contraseña ──────────────────────────────────────── */
function PasswordModal({ onClose, token }: { onClose: () => void; token: string }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    if (!next || next !== repeat) { toast.error("Las contraseñas no coinciden"); return; }
    if (next.length < 8) { toast.error("Mínimo 8 caracteres"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      if (!res.ok) throw new Error();
      toast.success("Contraseña actualizada");
      onClose();
    } catch {
      toast.error("Contraseña actual incorrecta");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Cambiar contraseña" onClose={onClose}>
      <div className="field"><label>Contraseña actual</label><input type="password" value={current} onChange={e => setCurrent(e.target.value)} placeholder="••••••••" /></div>
      <div className="field"><label>Nueva contraseña</label><input type="password" value={next} onChange={e => setNext(e.target.value)} placeholder="Mínimo 8 caracteres" /></div>
      <div className="field"><label>Repetir nueva contraseña</label><input type="password" value={repeat} onChange={e => setRepeat(e.target.value)} placeholder="••••••••" /></div>
      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <button className="btn ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
        <button className="btn primary" onClick={handle} disabled={busy || !current || !next || !repeat} style={{ flex: 1 }}>
          {busy ? "Guardando…" : "Cambiar contraseña"}
        </button>
      </div>
    </Modal>
  );
}

/* ─── Modal: Cambiar email ────────────────────────────────────────────── */
function EmailModal({ onClose, token, currentEmail }: { onClose: () => void; token: string; currentEmail: string }) {
  const [step, setStep] = useState<"verify" | "new">("verify");
  const [password, setPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const verifyStep = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error();
      setStep("new");
    } catch {
      toast.error("Contraseña incorrecta");
    } finally {
      setBusy(false);
    }
  };

  const sendLink = async () => {
    if (!newEmail.includes("@")) { toast.error("Email inválido"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newEmail }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Link de confirmación enviado a ${newEmail}`);
      onClose();
    } catch {
      toast.error("No se pudo enviar el link");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Cambiar email" onClose={onClose}>
      {step === "verify" ? (
        <>
          <p style={{ color: "var(--ink-3)", fontSize: 14, margin: "0 0 16px" }}>
            Tu email actual es <strong>{currentEmail}</strong>. Confirma tu contraseña para continuar.
          </p>
          <div className="field"><label>Contraseña</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" /></div>
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button className="btn ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
            <button className="btn primary" onClick={verifyStep} disabled={busy || !password} style={{ flex: 1 }}>
              {busy ? "Verificando…" : "Continuar"}
            </button>
          </div>
        </>
      ) : (
        <>
          <p style={{ color: "var(--ink-3)", fontSize: 14, margin: "0 0 16px" }}>
            Ingresa el nuevo email. Te enviaremos un link de confirmación — el cambio se aplicará solo cuando lo confirmes.
          </p>
          <div className="field"><label>Nuevo email</label><input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="nuevo@email.com" /></div>
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button className="btn ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
            <button className="btn primary" onClick={sendLink} disabled={busy || !newEmail} style={{ flex: 1 }}>
              {busy ? "Enviando…" : "Enviar link de confirmación"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

/* ─── Modal: Eliminar cuenta ─────────────────────────────────────────── */
function DeleteModal({ onClose, token, logout }: { onClose: () => void; token: string; logout: () => void }) {
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const handle = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      toast.success("Cuenta eliminada");
      logout();
      router.push("/");
    } catch {
      toast.error("No se pudo eliminar la cuenta");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Eliminar cuenta" onClose={onClose}>
      <div style={{ background: "color-mix(in oklab, var(--err) 10%, transparent)", border: "1px solid color-mix(in oklab, var(--err) 25%, transparent)", borderRadius: "var(--r)", padding: "14px 16px", marginBottom: 20 }}>
        <p style={{ margin: 0, fontSize: 14, color: "var(--err)", fontWeight: 600 }}>⚠ Acción permanente e irreversible</p>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--ink-2)" }}>
          Se eliminarán tu cuenta, perfil público, historial de pagos y todos los datos asociados. Los eventos publicados quedarán sin dueño y se desactivarán. Esta acción no se puede deshacer.
        </p>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--ink-3)" }}>
          Amparado por Ley 21.719 (Protección de Datos Personales) — tienes derecho a eliminar tus datos en cualquier momento.
        </p>
      </div>
      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", fontSize: 14 }}>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={e => setConfirmed(e.target.checked)}
          style={{ marginTop: 2, flexShrink: 0 }}
        />
        Entiendo que esta acción es permanente e irreversible y que no podré recuperar mis datos
      </label>
      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <button className="btn ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
        <button
          className="btn"
          onClick={handle}
          disabled={!confirmed || busy}
          style={{ flex: 1, background: confirmed ? "var(--err)" : undefined, color: confirmed ? "#fff" : undefined, borderColor: "var(--err)" }}
        >
          {busy ? "Eliminando…" : "Eliminar mi cuenta"}
        </button>
      </div>
    </Modal>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────── */
export default function PerfilPage() {
  const { user, token, logout, ready } = useUser();
  const router = useRouter();

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");
  const [busy, setBusy] = useState(false);

  // Modal state
  const [modal, setModal] = useState<"password" | "email" | "delete" | null>(null);

  useEffect(() => {
    if (ready && !user) {
      router.replace(`/login?returnTo=/cuenta/perfil`);
    }
    if (user) {
      const [fn, ...rest] = user.name.split(" ");
      setFirstname(fn ?? "");
      setLastname(rest.join(" "));
    }
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)" }}>
        {ready ? "Redirigiendo al inicio de sesión…" : "Verificando acceso…"}
      </main>
    );
  }

  const saveProfile = async () => {
    if (!token) return;
    setBusy(true);
    try {
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ firstname, lastname, bio, website, instagram, tiktok, twitter, youtube }),
      });
      toast.success("Perfil guardado");
    } catch {
      toast.error("No se pudo guardar el perfil");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AccountShell>
      <h1>Mi perfil</h1>
      <p className="lead">Esta información es la que verá la audiencia en tu perfil público.</p>

      <div className="acc-section">
        <h3>Información básica</h3>
        <div style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 22 }}>
          <div style={{ width: 80, height: 80, borderRadius: 999, background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 28, fontFamily: "var(--font-display)" }}>
            {user.initials}
          </div>
          <div>
            <button className="btn ghost" style={{ fontSize: 12, padding: "8px 14px" }}>Cambiar foto</button>
            <div style={{ color: "var(--ink-3)", fontSize: 11, marginTop: 6 }}>JPG / PNG · máx 2MB</div>
          </div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Nombre</label>
            <input type="text" value={firstname} onChange={(e) => setFirstname(e.target.value)} />
          </div>
          <div className="field">
            <label>Apellido</label>
            <input type="text" value={lastname} onChange={(e) => setLastname(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Bio</label>
          <textarea
            placeholder="Cuéntale a la comunidad quién eres…"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Sitio web</label>
          <div className="input-prefix">
            <span>https://</span>
            <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Instagram</label>
            <div className="input-prefix"><span>@</span><input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} /></div>
          </div>
          <div className="field">
            <label>TikTok</label>
            <div className="input-prefix"><span>@</span><input type="text" value={tiktok} onChange={(e) => setTiktok(e.target.value)} /></div>
          </div>
          <div className="field">
            <label>X / Twitter</label>
            <div className="input-prefix"><span>@</span><input type="text" value={twitter} onChange={(e) => setTwitter(e.target.value)} /></div>
          </div>
          <div className="field">
            <label>YouTube</label>
            <div className="input-prefix"><span>/</span><input type="text" value={youtube} onChange={(e) => setYoutube(e.target.value)} /></div>
          </div>
        </div>
        <button className="btn dark lg" style={{ marginTop: 14 }} onClick={saveProfile} disabled={busy}>
          {busy ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>

      <div className="acc-section acc-danger">
        <h3>Zona Danger</h3>
        {[
          { k: "password", t: "Cambiar contraseña", d: "Requiere tu contraseña actual." },
          { k: "email",    t: "Cambiar email",       d: "Confirmación obligatoria en el nuevo email antes de aplicar el cambio." },
          { k: "delete",  t: "Eliminar cuenta",      d: "Acción permanente e irreversible. Ley 21.719 te permite ejercer este derecho en cualquier momento." },
        ].map((r) => (
          <div key={r.k} className="acc-list-row">
            <div className="main">
              <div className="t">{r.t}</div>
              <div className="m">{r.d}</div>
            </div>
            <button
              className="btn ghost"
              style={{
                borderColor: r.k === "delete" ? "var(--err)" : "color-mix(in oklab, var(--err) 30%, var(--line))",
                color: "var(--err)",
              }}
              onClick={() => setModal(r.k as "password" | "email" | "delete")}
            >
              {r.k === "delete" ? "Eliminar" : "Cambiar"}
            </button>
          </div>
        ))}
      </div>

      {/* Modales */}
      {modal === "password" && token && (
        <PasswordModal token={token} onClose={() => setModal(null)} />
      )}
      {modal === "email" && token && (
        <EmailModal token={token} currentEmail={user.email} onClose={() => setModal(null)} />
      )}
      {modal === "delete" && token && (
        <DeleteModal token={token} logout={logout} onClose={() => setModal(null)} />
      )}
    </AccountShell>
  );
}
