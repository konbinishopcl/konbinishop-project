import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Poster } from "@/components/Poster";
import { Ic } from "@/components/icons";
import { api, imageUrl, toEventItem, type ApiEvent } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  try {
    const event = await api.event(slug);
    const image = imageUrl(event.banner ?? event.poster);
    const place = [event.commune?.name, event.region?.name].filter(Boolean).join(", ");
    const category = event.categories[0]?.name;
    const description = event.description.slice(0, 160);
    return {
      title: event.title,
      description,
      openGraph: {
        type: "article",
        title: event.title,
        description,
        ...(image && { images: [{ url: image, width: 1200, height: 630, alt: event.title }] }),
        ...(place && { section: place }),
        ...(category && { tags: [category] }),
      },
      twitter: {
        card: "summary_large_image",
        title: event.title,
        description,
        ...(image && { images: [image] }),
      },
    };
  } catch {
    return { title: "Evento" };
  }
}

function clp(n: number): string {
  return `$${n.toLocaleString("es-CL")}`;
}

function fmtDate(iso: string): { full: string; weekday: string } {
  const d = new Date(iso);
  return {
    full: d.toLocaleDateString("es-CL", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
    weekday: d.toLocaleDateString("es-CL", { weekday: "long", timeZone: "UTC" }),
  };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let event: ApiEvent;
  try {
    event = await api.event(slug);
  } catch {
    notFound();
  }

  const category = event.categories[0]?.name ?? "Evento";
  const place = [event.commune?.name, event.region?.name].filter(Boolean).join(", ");
  const firstDate = event.dates.find((d) => d.date)?.date;
  const dateLabel = firstDate ? fmtDate(firstDate).full : "Fecha por confirmar";
  const heroImage = imageUrl(event.banner ?? event.poster);
  const isFree = event.prices.length > 0 && event.prices.every((p) => p.price === 0);

  return (
    <main className="container">
      <div className="event-hero">
        {heroImage && (
          <img
            src={heroImage}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.55,
            }}
          />
        )}
        <div className="haze" />
        <div className="grain" />
        <div className="event-hero-body">
          <div className="event-poster-lg">
            <Poster e={toEventItem(event)} />
          </div>
          <div>
            <div className="row" style={{ gap: 10 }}>
              <span className="pill solid">{category}</span>
              {event.company && <span className="pill">{event.company}</span>}
            </div>
            <h1>{event.title}</h1>
            <div className="sub-line">
              {dateLabel}
              {place && ` · ${place}`}
            </div>
          </div>
          <button className="btn ghost" style={{ marginLeft: "auto" }}>
            {Ic.share} Compartir
          </button>
        </div>
      </div>

      <div className="event-grid">
        <div className="event-body">
          <h2>Sobre el evento</h2>
          <p>{event.description}</p>
          {event.about && <p>{event.about}</p>}

          {event.gallery.length > 0 && (
            <>
              <h2>Galería</h2>
              <div className="gallery">
                {event.gallery.slice(0, 5).map((g, i) => (
                  <div key={i} className={i === 0 ? "g1" : ""}>
                    <img
                      src={imageUrl(g)}
                      alt=""
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {event.categories.length > 0 && (
            <>
              <h2>Categorías</h2>
              <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
                {event.categories.map((c) => (
                  <Link key={c.id} className="pill" href={`/categoria/${c.slug}`}>
                    {c.name ?? c.slug}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        <aside>
          <div className="ticket-panel">
            <span className="eyebrow">ENTRADAS · チケット</span>
            <h3 style={{ marginTop: 8 }}>{isFree ? "Evento liberado" : "Valores"}</h3>
            <p style={{ color: "var(--ink-3)", fontSize: 12, margin: "4px 0 8px" }}>
              {event.ticketUrl
                ? "La compra de entradas se realiza en el sitio del organizador."
                : "Consulta con el organizador cómo asistir."}
            </p>

            {event.prices.length > 0 && (
              <div>
                {event.prices.map((p) => (
                  <div key={p.id} className="ticket-row">
                    <div>
                      <div className="name">{p.name}</div>
                    </div>
                    <div className="price">
                      {p.price === 0 ? (
                        "Liberado"
                      ) : (
                        <>
                          {clp(p.price)}{" "}
                          <span style={{ fontWeight: 400, color: "var(--ink-3)" }}>CLP</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {event.ticketUrl && (
              <a
                className="btn primary block"
                style={{ marginTop: 14 }}
                href={event.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Comprar entradas {Ic.arrow}
              </a>
            )}
          </div>

          <div className="info-block">
            <div className="lbl">{Ic.cal} FECHA Y HORA</div>
            {event.dates.length > 0 ? (
              event.dates.map((d, i) => {
                const f = d.date ? fmtDate(d.date) : null;
                const times = [d.startTime, d.endTime].filter(Boolean).join(" · ");
                return (
                  <div
                    key={d.id}
                    className="row"
                    style={{
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom:
                        i < event.dates.length - 1 ? "1px dashed var(--line)" : "none",
                    }}
                  >
                    <div>
                      <strong>{f?.full ?? "Por confirmar"}</strong>
                      {f && (
                        <div
                          style={{
                            color: "var(--ink-3)",
                            fontSize: 12,
                            textTransform: "capitalize",
                          }}
                        >
                          {f.weekday}
                        </div>
                      )}
                    </div>
                    {times && (
                      <div className="mono" style={{ fontSize: 13 }}>
                        {times}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ color: "var(--ink-3)", fontSize: 13, paddingTop: 4 }}>
                Fecha por confirmar
              </div>
            )}
          </div>

          <div className="info-block">
            <div className="lbl">{Ic.pin} UBICACIÓN</div>
            <div style={{ fontWeight: 600 }}>
              {event.address} {event.addressNumber}
            </div>
            {place && (
              <div style={{ color: "var(--ink-3)", fontSize: 13, marginTop: 2 }}>{place}</div>
            )}
          </div>

          {(event.socialLinks.some((s) => s.link) || event.videos.some((v) => v.link)) && (
            <div className="info-block">
              <div className="lbl">ENLACES</div>
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                {event.socialLinks
                  .filter((s) => s.link)
                  .map((s) => (
                    <a
                      key={s.id}
                      className="pill"
                      href={s.link!}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {Ic.insta} Red social
                    </a>
                  ))}
                {event.videos
                  .filter((v) => v.link)
                  .map((v) => (
                    <a
                      key={v.id}
                      className="pill"
                      href={v.link!}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ▶ Video
                    </a>
                  ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
