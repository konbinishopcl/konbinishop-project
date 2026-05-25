"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Poster } from "@/components/Poster";
import { EventCard } from "@/components/EventCard";
import { Ic } from "@/components/icons";
import { useUser } from "@/components/providers";
import { imageUrl, withUtm, type ApiEvent } from "@/lib/api";
import type { EventItem } from "@/lib/data";

type Props = {
  event: ApiEvent;
  related: EventItem[];
  clpFn: (n: number) => string;
  fmtDateFn: (iso: string) => { full: string; weekday: string };
  toEventItemFn: (e: ApiEvent) => EventItem;
};

export function EventView({ event, related, clpFn, fmtDateFn, toEventItemFn }: Props) {
  const { user } = useUser();
  const [saved, setSaved] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const handleSave = () => {
    if (!user) {
      toast.error("Inicia sesión para guardar eventos");
      return;
    }
    setSaved((s) => !s);
    toast.success(saved ? "Eliminado de favoritos" : "Guardado en favoritos");
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado al portapapeles");
    }
    setShareOpen(false);
  };

  const category = event.category?.name ?? "Evento";
  const place = [event.commune?.name, event.region?.name].filter(Boolean).join(", ");
  const firstDate = event.dates.find((d) => d.date)?.date;
  const dateLabel = firstDate ? fmtDateFn(firstDate).full : "Fecha por confirmar";
  const heroImage = imageUrl(event.banner ?? event.poster);
  const isFree = event.prices.length > 0 && event.prices.every((p) => p.price === 0);
  const ownerName = [event.owner?.firstname, event.owner?.lastname].filter(Boolean).join(" ") || "Organizador";

  return (
    <main className="container">
      {/* Hero */}
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
            <Poster e={toEventItemFn(event)} />
          </div>
          <div style={{ flex: 1 }}>
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
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexShrink: 0 }}>
            <button
              className="icon-btn"
              onClick={handleSave}
              title={saved ? "Guardado" : "Guardar"}
              style={saved ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" } : undefined}
            >
              {Ic.heart}
            </button>
            <div style={{ position: "relative" }}>
              <button className="btn ghost" onClick={() => setShareOpen((s) => !s)}>
                {Ic.share} Compartir
              </button>
              {shareOpen && (
                <div className="menu" style={{ top: 52, right: 0, left: "auto", position: "absolute", zIndex: 100 }} onMouseLeave={() => setShareOpen(false)}>
                  <button onClick={handleShare}>📋 Copiar link</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: body + aside */}
      <div className="event-grid">
        <div className="event-body">
          <h2>Sobre el evento</h2>
          <p>{event.description}</p>
          {event.about && <p>{event.about}</p>}

          {/* Galería */}
          {event.gallery.length > 0 && (
            <>
              <h2>Galería</h2>
              <div
                className="gallery"
                style={
                  event.gallery.length === 1
                    ? { gridTemplateColumns: "1fr", gridTemplateRows: "300px" }
                    : event.gallery.length === 2
                    ? { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "260px" }
                    : undefined
                }
              >
                {event.gallery.slice(0, 5).map((g, i) => (
                  <div key={i} className={i === 0 && event.gallery.length >= 3 ? "g1" : ""}>
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

          {/* Organizador */}
          {event.owner && (
            <>
              <h2>Organizador</h2>
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--r-lg)",
                  padding: 20,
                  display: "flex",
                  gap: 16,
                  alignItems: "center",
                  transition: "border-color .15s",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 999,
                    background: "linear-gradient(135deg, var(--accent-3), var(--accent))",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 22,
                    fontFamily: "var(--font-display)",
                    flexShrink: 0,
                  }}
                >
                  {ownerName[0]?.toUpperCase() ?? "O"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: 18,
                    }}
                  >
                    {ownerName}
                  </div>
                  <div style={{ color: "var(--ink-3)", fontSize: 13 }}>
                    {event.owner.email}
                  </div>
                </div>
                <span style={{ color: "var(--ink-3)" }}>{Ic.arrow}</span>
              </div>
            </>
          )}

          {/* Categoría */}
          {event.category && (
            <>
              <h2>Categoría</h2>
              <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
                <Link className="pill" href={`/categoria/${event.category.slug}`}>
                  {event.category.name ?? event.category.slug}
                </Link>
              </div>
            </>
          )}

          {/* Redes y videos */}
          {(event.socialLinks.some((s) => s.link) || event.videos.some((v) => v.link)) && (
            <>
              <h2>Enlaces</h2>
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                {event.socialLinks
                  .filter((s) => s.link)
                  .map((s) => (
                    <a
                      key={s.id}
                      className="pill"
                      href={withUtm(s.link!, "event_social")}
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
                      href={withUtm(v.link!, "event_video")}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ▶ Video
                    </a>
                  ))}
              </div>
            </>
          )}
        </div>

        {/* Aside: ticket panel + info blocks */}
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
                          {clpFn(p.price)}{" "}
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
                href={withUtm(event.ticketUrl, "event_ticket")}
                target="_blank"
                rel="noopener noreferrer"
              >
                Comprar entradas {Ic.arrow}
              </a>
            )}
          </div>

          {/* Fechas */}
          <div className="info-block">
            <div className="lbl">{Ic.cal} FECHA Y HORA</div>
            {event.dates.length > 0 ? (
              event.dates.map((d, i) => {
                const f = d.date ? fmtDateFn(d.date) : null;
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

          {/* Ubicación */}
          <div className="info-block">
            <div className="lbl">{Ic.pin} UBICACIÓN</div>
            <div style={{ fontWeight: 600 }}>
              {event.address} {event.addressNumber}
            </div>
            {place && (
              <div style={{ color: "var(--ink-3)", fontSize: 13, marginTop: 2 }}>{place}</div>
            )}
          </div>
        </aside>
      </div>

      {/* Eventos relacionados */}
      {related.length > 0 && (
        <section style={{ margin: "48px 0 60px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20 }}>
            <h2 className="display" style={{ fontSize: 32, margin: 0 }}>También te puede gustar</h2>
            <span className="jp" style={{ color: "var(--ink-3)", opacity: 0.5 }}>関連</span>
          </div>
          <div className="card-grid">
            {related.map((e) => (
              <EventCard key={e.id} e={e} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
