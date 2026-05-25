"use client";
import { use, useState } from "react";
import Link from "next/link";

function SatisfactionForm() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-xl)", padding: 28, textAlign: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 13, color: "var(--ink-3)" }}>Gracias por tu feedback ✓</div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-xl)", padding: 28, marginBottom: 18 }}>
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, margin: "0 0 6px" }}>¿Cómo fue tu experiencia publicando?</h3>
      <p style={{ color: "var(--ink-3)", fontSize: 13, margin: "0 0 16px" }}>Tu opinión nos ayuda a mejorar.</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[1,2,3,4,5].map(s => (
          <button
            key={s}
            onClick={() => setRating(s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            style={{ fontSize: 28, background: "none", border: "none", cursor: "pointer", padding: 4, color: (hover || rating) >= s ? "var(--accent-2)" : "var(--line-2)", transition: "color .15s" }}
          >
            ★
          </button>
        ))}
      </div>
      {rating > 0 && (
        <>
          <textarea
            placeholder="Comentario opcional…"
            value={comment}
            onChange={e => setComment(e.target.value)}
            style={{ width: "100%", minHeight: 80, marginBottom: 12, boxSizing: "border-box" }}
          />
          <button className="btn dark" onClick={() => setSent(true)}>Enviar →</button>
        </>
      )}
    </div>
  );
}

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

      {/* Servicios */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-xl)", padding: 32, marginBottom: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>PARA TU EVENTO</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div style={{ background: "var(--surface-2)", borderRadius: "var(--r-lg)", padding: "20px 22px", border: "1px solid var(--line)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".15em", color: "var(--accent)", marginBottom: 8 }}>FOTOGRAFÍA</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Cobertura profesional</div>
            <p style={{ color: "var(--ink-3)", fontSize: 13, lineHeight: 1.55, margin: "0 0 14px" }}>Fotógrafos especializados en eventos geek y otaku. Entrega en 48h.</p>
            <Link href="/servicios/fotografia" className="btn ghost" style={{ fontSize: 13, padding: "9px 16px" }}>Cotizar fotógrafo →</Link>
          </div>
          <div style={{ background: "var(--surface-2)", borderRadius: "var(--r-lg)", padding: "20px 22px", border: "1px solid var(--line)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".15em", color: "var(--accent)", marginBottom: 8 }}>CREADORES</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Reels · Aftermovie · Stories</div>
            <p style={{ color: "var(--ink-3)", fontSize: 13, lineHeight: 1.55, margin: "0 0 14px" }}>Contenido viral para Instagram y TikTok. Cobertura en vivo incluida.</p>
            <Link href="/servicios/creadores" className="btn ghost" style={{ fontSize: 13, padding: "9px 16px" }}>Cotizar contenido →</Link>
          </div>
        </div>
      </div>

      {/* Satisfacción */}
      <SatisfactionForm />

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
