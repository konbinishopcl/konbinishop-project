"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AccountShell } from "../AccountShell";
import { useUser } from "@/components/providers";

export default function OrganizadorPage() {
  const { user, token, ready } = useUser();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [facebook, setFacebook] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");
  const [twitch, setTwitch] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/login?returnTo=/cuenta/organizador");
  }, [ready, user, router]);

  if (!ready || !user) return null;

  const save = async () => {
    if (!displayName.trim()) { toast.error("El nombre público es requerido"); return; }
    if (!handle.trim()) { toast.error("El handle es requerido"); return; }
    setBusy(true);
    try {
      await fetch("/api/users/me/organizer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ displayName, handle, bio, website, instagram, tiktok, facebook, twitter, youtube, twitch, linkedin }),
      });
      toast.success("Perfil de organizador guardado");
    } catch {
      toast.error("No se pudo guardar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AccountShell>
      <h1>Perfil de organizador</h1>
      <p className="lead">Tu identidad pública. Separa cómo te ve la audiencia de tu perfil personal.</p>

      <div className="acc-section">
        <h3>Identidad pública</h3>
        {/* Avatar + Banner buttons */}
        <div style={{ display: "flex", gap: 12, marginBottom: 22 }}>
          <button className="btn ghost" style={{ fontSize: 12, padding: "8px 14px" }}>Cambiar avatar</button>
          <button className="btn ghost" style={{ fontSize: 12, padding: "8px 14px" }}>Cambiar banner</button>
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Nombre público <span style={{ color: "var(--err)" }}>*</span></label>
            <input type="text" placeholder="Ej: Cinépolis Chile" value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </div>
          <div className="field">
            <label>Handle / URL <span style={{ color: "var(--err)" }}>*</span></label>
            <div className="input-prefix">
              <span>/@</span>
              <input type="text" placeholder="mi-organizacion" value={handle} onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} />
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>Tu perfil público: konbini.cl/@{handle || "tu-handle"}</div>
          </div>
        </div>
        <div className="field">
          <label>Bio corta</label>
          <textarea placeholder="Describe tu organización en pocas palabras…" value={bio} onChange={e => setBio(e.target.value)} style={{ minHeight: 80 }} />
        </div>
        <div className="field">
          <label>Sitio web</label>
          <div className="input-prefix"><span>https://</span><input type="text" value={website} onChange={e => setWebsite(e.target.value)} /></div>
        </div>
      </div>

      <div className="acc-section">
        <h3>Redes sociales</h3>
        <div className="grid-2">
          {[
            { label: "Instagram", prefix: "@", val: instagram, set: setInstagram },
            { label: "TikTok", prefix: "@", val: tiktok, set: setTiktok },
            { label: "Facebook", prefix: "fb.com/", val: facebook, set: setFacebook },
            { label: "X / Twitter", prefix: "@", val: twitter, set: setTwitter },
            { label: "YouTube", prefix: "/", val: youtube, set: setYoutube },
            { label: "Twitch", prefix: "/", val: twitch, set: setTwitch },
            { label: "LinkedIn", prefix: "/in/", val: linkedin, set: setLinkedin },
          ].map(r => (
            <div key={r.label} className="field">
              <label>{r.label}</label>
              <div className="input-prefix"><span>{r.prefix}</span><input type="text" value={r.val} onChange={e => r.set(e.target.value)} /></div>
            </div>
          ))}
        </div>
      </div>

      <button className="btn dark lg" onClick={save} disabled={busy}>
        {busy ? "Guardando…" : "Guardar perfil"}
      </button>
    </AccountShell>
  );
}
