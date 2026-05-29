"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AccountShell } from "../AccountShell";
import { useUser } from "@/components/providers";

interface Subscription {
  id: number;
  status: string;
  creditsUsed: number;
  creditsTotal: number;
  cycleStart: string;
  cycleEnd: string;
  cancelledAt?: string | null;
}

export default function SuscripcionPage() {
  const { user, token, ready } = useUser();
  const router = useRouter();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});

  const n = (k: string, fb: number) => parseInt(settings[k] ?? "", 10) || fb;

  useEffect(() => {
    api.settingsPublic().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login?returnTo=/cuenta/suscripcion");
      return;
    }
    if (!token) return;
    fetch("/api/subscriptions/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setSub(data))
      .catch(() => setSub(null))
      .finally(() => setLoading(false));
  }, [ready, user, token, router]);

  if (!ready || !user) {
    return (
      <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)" }}>
        {ready ? "Redirigiendo al inicio de sesión…" : "Verificando acceso…"}
      </main>
    );
  }

  const handleCancel = async () => {
    if (!token) return;
    try {
      await fetch("/api/subscriptions/me", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Suscripción cancelada");
      setSub(null);
    } catch {
      toast.error("No se pudo cancelar la suscripción");
    } finally {
      setCancelOpen(false);
    }
  };

  const handleSubscribe = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data?.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        toast.success("Suscripción activada");
        setSub(data);
      }
    } catch {
      toast.error("No se pudo activar la suscripción");
    }
  };

  return (
    <AccountShell>
      <h1>Suscripción</h1>
      <p className="lead">Plan mensual de {n("SUBSCRIPTION_CREDITS", 10)} créditos. Cada crédito = una publicación de 45 días.</p>

      {loading ? (
        <div className="acc-section" style={{ color: "var(--ink-3)", fontSize: 14 }}>Cargando suscripción…</div>
      ) : sub ? (
        <>
          <div className="acc-credit">
            <div className="b">
              <div className="h">{sub.creditsUsed ?? 0} / {sub.creditsTotal ?? 0} créditos usados este mes</div>
              <div className="p">Se renueva el {new Date(sub.cycleEnd).toLocaleDateString("es-CL", { day: "numeric", month: "long" })}</div>
              <div className="pbar">
                <div style={{ width: `${sub.creditsTotal ? Math.round(((sub.creditsUsed ?? 0) / sub.creditsTotal) * 100) : 0}%` }} />
              </div>
            </div>
            <div className="v">{(sub.creditsTotal ?? 0) - (sub.creditsUsed ?? 0)}</div>
            <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ink-3)", letterSpacing: ".1em" }}>RESTAN</div>
          </div>

          <div className="acc-section">
            <h3>Beneficios activos</h3>
            <div style={{ color: "var(--ink-2)", fontSize: 14, lineHeight: 1.8 }}>
              ✓ {sub.creditsTotal ?? 0} créditos de publicación al mes<br />
              ✓ {n("SUBSCRIPTION_SPOT_DISCOUNT", 20)}% off en avisos y portadas<br />
              ✓ Soporte prioritario
            </div>
          </div>

          {!sub.cancelledAt && (
            <div className="acc-section acc-danger">
              <h3>Cancelar suscripción</h3>
              <p style={{ color: "var(--ink-2)", margin: "0 0 14px", fontSize: 14, lineHeight: 1.55 }}>
                Si cancelas ahora, tu suscripción seguirá activa hasta el final del ciclo.
              </p>
              {cancelOpen ? (
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn ghost" style={{ borderColor: "var(--err)", color: "var(--err)" }} onClick={handleCancel}>
                    Sí, cancelar suscripción
                  </button>
                  <button className="btn ghost" onClick={() => setCancelOpen(false)}>Mantener activa</button>
                </div>
              ) : (
                <button className="btn ghost" style={{ borderColor: "color-mix(in oklab, var(--err) 30%, var(--line))", color: "var(--err)" }} onClick={() => setCancelOpen(true)}>
                  Cancelar suscripción
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="acc-section" style={{ textAlign: "center", padding: "32px 0" }}>
          <h3 style={{ marginBottom: 12 }}>Sin suscripción activa</h3>
          <p style={{ color: "var(--ink-2)", marginBottom: 20, fontSize: 14 }}>
            Suscríbete para publicar eventos con créditos mensuales y obtener descuentos en avisos y portadas.
          </p>
          <button className="btn primary lg" onClick={handleSubscribe}>
            Suscribirme →
          </button>
        </div>
      )}
    </AccountShell>
  );
}
