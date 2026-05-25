"use client";
import { use } from "react";
import Link from "next/link";

export default function CartExitoPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const params = use(searchParams);
  const orderId = params.orderId;

  return (
    <main className="container" style={{ paddingTop: 36, paddingBottom: 80 }}>
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-xl)",
          padding: 48,
          textAlign: "center",
          marginBottom: 18,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 999,
            background: "var(--ok)",
            color: "#fff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18,
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className="eyebrow">
          PAGO CONFIRMADO{orderId ? ` · ${orderId}` : ""}
        </div>
        <h1
          className="display"
          style={{ fontSize: 48, margin: "16px 0 12px", letterSpacing: "-.02em" }}
        >
          ¡Tu contenido está
          <br />
          en revisión!
        </h1>
        <p
          style={{
            color: "var(--ink-2)",
            maxWidth: "52ch",
            margin: "0 auto",
            fontSize: 16,
            lineHeight: 1.55,
          }}
        >
          Un admin de Konbini revisará tu contenido en menos de 24 horas hábiles.
          Te notificaremos por email cuando esté aprobado.
        </p>
      </div>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-xl)",
          padding: 32,
          marginBottom: 18,
        }}
      >
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, marginBottom: 8 }}>
          ¿Tu perfil de organizador está completo?
        </h3>
        <p style={{ color: "var(--ink-2)", margin: "0 0 14px", fontSize: 14, lineHeight: 1.55 }}>
          Cuando los visitantes hagan clic en tu nombre, verán tu perfil público. Completa tu bio, avatar y redes sociales.
        </p>
        <Link href="/cuenta?tab=org" className="btn dark">
          Completar mi perfil
        </Link>
      </div>

      <div className="thanks-cta-row" style={{ marginTop: 32 }}>
        <Link href="/cuenta?tab=eventos" className="btn primary lg">
          Ver mis eventos →
        </Link>
        <Link href="/" className="btn ghost lg">
          Ir al home
        </Link>
      </div>
    </main>
  );
}
