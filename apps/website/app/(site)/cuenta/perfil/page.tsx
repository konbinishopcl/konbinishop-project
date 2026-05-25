"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AccountShell } from "../AccountShell";
import { useUser } from "@/components/providers";

export default function PerfilPage() {
  const { user, token, ready } = useUser();
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
          { k: "email", t: "Cambiar email", d: "Confirmación obligatoria en el nuevo email antes de aplicar el cambio." },
          { k: "delete", t: "Eliminar cuenta", d: "Acción permanente e irreversible. Ley 21.719 te permite ejercer este derecho en cualquier momento." },
        ].map((r) => (
          <div key={r.k} className="acc-list-row">
            <div className="main">
              <div className="t">{r.t}</div>
              <div className="m">{r.d}</div>
            </div>
            <button
              className="btn ghost"
              style={{ borderColor: r.k === "delete" ? "var(--err)" : "color-mix(in oklab, var(--err) 30%, var(--line))", color: "var(--err)" }}
              onClick={() => toast.info(`Próximamente: ${r.t}`)}
            >
              {r.k === "delete" ? "Eliminar" : "Cambiar"}
            </button>
          </div>
        ))}
      </div>
    </AccountShell>
  );
}
