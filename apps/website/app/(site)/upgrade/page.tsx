"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

function formatCLP(value: number): string {
  return `$${value.toLocaleString("es-CL")}`;
}

export default function UpgradePage() {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    api.settingsPublic().then(setSettings).catch(() => {});
  }, []);

  const n = (k: string, fb: number) => parseInt(settings[k] ?? "", 10) || fb;

  const credits = n("SUBSCRIPTION_CREDITS", 10);
  const discount = n("SUBSCRIPTION_SPOT_DISCOUNT", 20);
  const price = n("SUBSCRIPTION_PRICE", 9990);

  const BENEFITS = [
    { ic: "🎟", t: `${credits} créditos al mes`, d: `Publica hasta ${credits} eventos al mes con 45 días de visibilidad cada uno.` },
    { ic: "💰", t: `${discount}% descuento`, d: "En avisos y portadas. Amplifica tus eventos a un precio especial." },
    { ic: "⚡", t: "Acceso prioritario", d: "Revisión de eventos en menos de 12 horas para suscriptores Pro." },
    { ic: "📊", t: "Métricas avanzadas", d: "Ve cuántas personas ven, guardan y comparten tus eventos." },
    { ic: "🏅", t: "Badge de organizador", d: "Perfil destacado con badge Pro en el directorio de organizadores." },
    { ic: "🔔", t: "Notificaciones push", d: "Avisa a tus seguidores cuando publicas un nuevo evento." },
  ];

  return (
    <main className="ups-shell">
      {/* Hero banner */}
      <div
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--accent) 18%, var(--surface)) 0%, var(--surface) 100%)",
          border: "1px solid color-mix(in oklab, var(--accent) 25%, var(--line))",
          borderRadius: "var(--r-xl)",
          padding: "48px 40px",
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        <div className="eyebrow" style={{ marginBottom: 12 }}>PRO · プロ</div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(40px,5vw,64px)",
            letterSpacing: "-.025em",
            lineHeight: 1.05,
            margin: "0 0 16px",
          }}
        >
          Hazte <em style={{ color: "var(--accent)", fontStyle: "normal" }}>Pro</em>
        </h1>
        <p
          style={{
            color: "var(--ink-2)",
            fontSize: 17,
            lineHeight: 1.55,
            maxWidth: "52ch",
            margin: "0 auto 32px",
          }}
        >
          La suscripción mensual para organizadores que publican seguido. Publica más, paga menos por evento.
        </p>
        <div style={{ display: "inline-flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/cuenta?tab=subs" className="btn primary lg">
            Suscribirme por {formatCLP(price)}/mes →
          </Link>
          <Link href="/precios" className="btn ghost lg">
            Ver todos los precios
          </Link>
        </div>
      </div>

      {/* Benefits */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-xl)",
          padding: 32,
          marginBottom: 16,
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            letterSpacing: "-.015em",
            marginBottom: 24,
          }}
        >
          ¿Qué incluye la suscripción?
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 18,
          }}
        >
          {BENEFITS.map((b) => (
            <div
              key={b.t}
              style={{
                display: "flex",
                gap: 14,
                padding: "18px 20px",
                background: "var(--surface-2)",
                border: "1px solid var(--line)",
                borderRadius: "var(--r-lg)",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: "var(--bg)",
                  border: "1px solid var(--line)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  flex: "0 0 44px",
                }}
              >
                {b.ic}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{b.t}</div>
                <div style={{ color: "var(--ink-2)", fontSize: 13, lineHeight: 1.45 }}>{b.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA final */}
      <div style={{ textAlign: "center", padding: "24px 0" }}>
        <Link href="/cuenta?tab=subs" className="btn primary lg">
          Comenzar suscripción Pro →
        </Link>
        <p style={{ color: "var(--ink-3)", fontSize: 13, marginTop: 12 }}>
          Cancela cuando quieras. Sin contratos. Sin permanencia.
        </p>
      </div>
    </main>
  );
}
