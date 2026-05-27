import type { Metadata } from "next";
import Link from "next/link";
import { api, toEventItem, imageUrl } from "@/lib/api";
import type { EventItem } from "@/lib/data";

export async function generateMetadata(
  { params }: { params: Promise<{ tag: string }> },
): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `#${tag} — Konbini`,
    description: `Eventos y contenido relacionado con #${tag} en Konbini.`,
  };
}

export default async function TagPage(
  { params }: { params: Promise<{ tag: string }> },
) {
  const { tag } = await params;
  const data = await api.events({ pageSize: 24 }).catch(() => ({ items: [] }));
  const events: EventItem[] = data.items
    .filter((e) =>
      e.title.toLowerCase().includes(tag.toLowerCase()) ||
      e.eventCategory?.slug === tag ||
      e.eventCategory?.name?.toLowerCase() === tag.toLowerCase(),
    )
    .map(toEventItem);

  return (
    <main className="container" style={{ padding: "36px 0 80px" }}>
      <div style={{ marginBottom: 32 }}>
        <div className="eyebrow">TAG</div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(40px,5vw,64px)",
            letterSpacing: "-.025em",
            margin: "12px 0 6px",
          }}
        >
          <span style={{ color: "var(--accent)" }}>#</span>
          {tag}
        </h1>
        <p style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
          {events.length} resultado{events.length !== 1 ? "s" : ""}
        </p>
      </div>

      {events.length === 0 ? (
        <div className="empty">Sin resultados para #{tag}.</div>
      ) : (
        <div className="card-grid">
          {events.map((e) => (
            <Link key={e.id} href={`/evento/${e.slug}`} style={{ textDecoration: "none" }}>
              <article
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--r-lg)",
                  overflow: "hidden",
                  cursor: "pointer",
                }}
              >
                <div style={{ aspectRatio: "4/5", position: "relative", background: "#1a1714" }}>
                  {e.image ? (
                    <img
                      src={e.image}
                      alt={e.title}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#2a1410,#4a1820)" }} />
                  )}
                </div>
                <div style={{ padding: "14px 16px" }}>
                  {e.cat && (
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".15em", color: "var(--accent)", marginBottom: 6 }}>
                      {e.cat.toUpperCase()}
                    </div>
                  )}
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, lineHeight: 1.2, marginBottom: 4 }}>
                    {e.title}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
                    {e.date} · {e.place}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
