import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import { INSTAGRAM_FOLLOWERS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sobre Konbini — El directorio de cultura geek en Chile",
  description: "Somos el directorio de eventos de anime, manga, gaming y cultura otaku más grande de Chile.",
};

const TEAM = [
  { initials: "K", name: "Konbini Team", role: "Editorial & Contenido", color: "#a25cff" },
  { initials: "G", name: "Gabriel B.", role: "Tecnología", color: "#3b9eff" },
];

export default async function NosotrosPage() {
  const stats = await api.statsPublic().catch(() => ({ approvedEvents: 1200, organizers: 300 }));
  return (
    <main className="container" style={{ paddingBottom: 80 }}>
      {/* Hero */}
      <div
        style={{
          padding: "64px 0 40px",
          maxWidth: "800px",
        }}
      >
        <div className="eyebrow">SOBRE KONBINI · コンビニについて</div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(40px,5vw,72px)",
            letterSpacing: "-.025em",
            lineHeight: 1.05,
            margin: "12px 0 24px",
          }}
        >
          El directorio de cultura geek en Chile.
        </h1>
        <p
          style={{
            fontSize: 18,
            lineHeight: 1.65,
            color: "var(--ink-2)",
            maxWidth: "60ch",
          }}
        >
          Konbini nació para conectar a los fans de anime, manga, gaming y cultura
          otaku con los eventos y organizadores que hacen vibrar a la comunidad.
        </p>
      </div>

      {/* Misión */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          margin: "0 0 48px",
        }}
      >
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-xl)",
            padding: 40,
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 16 }}>MISIÓN</div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              letterSpacing: "-.015em",
              marginBottom: 14,
            }}
          >
            Amplificar la cultura geek chilena
          </h2>
          <p style={{ color: "var(--ink-2)", lineHeight: 1.6, fontSize: 15 }}>
            Queremos que ningún evento de la comunidad otaku se pierda en el ruido de
            las redes sociales. Somos el lugar donde los fans buscan qué hacer este
            fin de semana y los organizadores encuentran a su audiencia.
          </p>
        </div>
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-xl)",
            padding: 40,
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 16 }}>HISTORIA</div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              letterSpacing: "-.015em",
              marginBottom: 14,
            }}
          >
            Desde 2024, creciendo con la comunidad
          </h2>
          <p style={{ color: "var(--ink-2)", lineHeight: 1.6, fontSize: 15 }}>
            Empezamos como una cuenta de Instagram para compartir eventos de anime en
            Santiago. Crecimos a más de 244.000 seguidores y decidimos crear la
            plataforma que la comunidad merecía: descubrir, publicar y conectar.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-xl)",
          overflow: "hidden",
          background: "var(--surface-2)",
          margin: "0 0 48px",
        }}
      >
        {[
          [`${INSTAGRAM_FOLLOWERS}+`, "SEGUIDORES INSTAGRAM"],
          [`${stats.approvedEvents.toLocaleString("es-CL")}+`, "EVENTOS PUBLICADOS"],
          [`${stats.organizers.toLocaleString("es-CL")}+`, "ORGANIZADORES"],
          ["2024", "AÑO DE FUNDACIÓN"],
        ].map((s, i, arr) => (
          <div
            key={s[1]}
            style={{
              padding: "40px 32px",
              borderRight: i < arr.length - 1 ? "1px solid var(--line)" : 0,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 48,
                fontWeight: 700,
                letterSpacing: "-.03em",
                lineHeight: 1,
                marginBottom: 8,
                color: "var(--ink)",
              }}
            >
              {s[0]}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: ".18em",
                color: "var(--ink-3)",
              }}
            >
              {s[1]}
            </div>
          </div>
        ))}
      </div>

      {/* Equipo */}
      <div style={{ marginBottom: 48 }}>
        <div className="eyebrow" style={{ marginBottom: 20 }}>EQUIPO</div>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          {TEAM.map((m) => (
            <div
              key={m.name}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "var(--r-lg)",
                padding: "24px 28px",
                display: "flex",
                gap: 16,
                alignItems: "center",
                minWidth: 260,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  background: `linear-gradient(135deg, ${m.color}, var(--accent-2))`,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 22,
                }}
              >
                {m.initials}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{m.name}</div>
                <div style={{ color: "var(--ink-3)", fontSize: 13 }}>{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div
        style={{
          background: "linear-gradient(135deg, color-mix(in oklab, var(--accent) 18%, var(--surface)) 0%, var(--surface) 100%)",
          border: "1px solid color-mix(in oklab, var(--accent) 25%, var(--line))",
          borderRadius: "var(--r-xl)",
          padding: "48px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 32,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              letterSpacing: "-.02em",
              marginBottom: 8,
            }}
          >
            ¿Organizas eventos geek?
          </h3>
          <p style={{ color: "var(--ink-2)", margin: 0 }}>
            Publica gratis y llega a la comunidad otaku de Chile.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/crear" className="btn primary lg">
            Publicar mi evento →
          </Link>
          <Link href="/preguntas-frecuentes" className="btn ghost lg">
            Contactarnos
          </Link>
        </div>
      </div>
    </main>
  );
}
