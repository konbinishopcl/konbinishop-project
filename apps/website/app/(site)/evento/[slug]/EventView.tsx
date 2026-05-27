"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { EventCard } from "@/components/EventCard";
import { Ic } from "@/components/icons";
import { useUser } from "@/components/providers";
import { imageUrl, withUtm, type ApiEvent } from "@/lib/api";
import type { EventItem } from "@/lib/data";

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

type Props = {
  event: ApiEvent;
  related: EventItem[];
};

export function EventView({ event, related }: Props) {
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

  const handleShareClick = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: event.title, url: window.location.href }).catch(() => {});
    } else {
      setShareOpen((s) => !s);
    }
  };

  const category = event.eventCategory?.name ?? "Evento";
  const place = [event.commune?.name, event.region?.name].filter(Boolean).join(", ");
  const firstDate = event.dates.find((d) => d.date)?.date;
  const dateLabel = firstDate ? fmtDate(firstDate).full : "Fecha por confirmar";
  const heroImage = imageUrl(event.banner ?? event.poster);
  const isFree = event.prices.length > 0 && event.prices.every((p) => p.price === 0);
  const ownerName = [event.owner?.firstname, event.owner?.lastname].filter(Boolean).join(" ") || "Organizador";

  return (
    <main className="container">
      {/* Banner revisión */}
      {user && user.id != null && event.owner?.id === user.id && !event.isApproved && !event.isRejected && (
        <div style={{
          background: "color-mix(in oklab, var(--warn) 12%, transparent)",
          border: "1px solid color-mix(in oklab, var(--warn) 30%, transparent)",
          borderRadius: "var(--r)",
          padding: "14px 20px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: 14,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          <div>
            <strong>Este evento aún no es público</strong> — está en revisión y solo tú puedes verlo por ahora. Un admin lo revisará en menos de 24 horas hábiles.
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="event-hero">
        {heroImage && (
          <img
            src={heroImage}
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }}
          />
        )}
        <div className="haze" />
        <div className="grain" />
        <div className="event-hero-body">
          <div className="event-poster-lg">
            {(event.poster ?? event.banner) && (
              <img
                src={imageUrl(event.poster ?? event.banner)}
                alt=""
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
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
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            <button
              className="icon-btn"
              onClick={handleSave}
              title={saved ? "Guardado" : "Guardar"}
              style={saved ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" } : undefined}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
            <div style={{ position: "relative" }}>
              <button className="btn ghost" onClick={handleShareClick}>
                {Ic.share} Compartir
              </button>
              {shareOpen && (
                <div
                  className="menu"
                  style={{ top: "calc(100% + 6px)", right: 0, left: "auto", position: "absolute", zIndex: 100, minWidth: 200 }}
                  onMouseLeave={() => setShareOpen(false)}
                >
                  <button onClick={handleShare}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    Copiar link
                  </button>
                  <a href={`https://wa.me/?text=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`} target="_blank" rel="noopener noreferrer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                    WhatsApp
                  </a>
                  <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}&text=${encodeURIComponent(event.title)}`} target="_blank" rel="noopener noreferrer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    X (Twitter)
                  </a>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`} target="_blank" rel="noopener noreferrer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                  </a>
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
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
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
              <div style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "var(--r-lg)",
                padding: 20,
                display: "flex",
                gap: 16,
                alignItems: "center",
              }}>
                <div style={{
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
                }}>
                  {ownerName[0]?.toUpperCase() ?? "O"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>
                    {ownerName}
                  </div>
                  <div style={{ color: "var(--ink-3)", fontSize: 13 }}>{event.owner.email}</div>
                </div>
                <span style={{ color: "var(--ink-3)" }}>{Ic.arrow}</span>
              </div>
            </>
          )}

          {/* Categoría */}
          {event.eventCategory && (
            <>
              <h2>Categoría</h2>
              <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
                <Link className="pill" href={`/categoria/${event.eventCategory.slug}`}>
                  {event.eventCategory.name ?? event.eventCategory.slug}
                </Link>
              </div>
            </>
          )}

          {/* Redes y videos */}
          {(event.socialLinks.some((s) => s.link) || event.videos.some((v) => v.link)) && (
            <>
              <h2>Enlaces</h2>
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                {event.socialLinks.filter((s) => s.link).map((s) => (
                  <a key={s.id} className="pill" href={withUtm(s.link!, "event_social")} target="_blank" rel="noopener noreferrer">
                    {Ic.insta} Red social
                  </a>
                ))}
                {event.videos.filter((v) => v.link).map((v) => (
                  <a key={v.id} className="pill" href={withUtm(v.link!, "event_video")} target="_blank" rel="noopener noreferrer">
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
                    <div className="name">{p.name}</div>
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
                href={withUtm(event.ticketUrl, "event_ticket")}
                target="_blank"
                rel="noopener noreferrer"
              >
                Comprar entradas {Ic.arrow}
              </a>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                className="btn ghost"
                style={saved
                  ? { flex: 1, background: "color-mix(in oklab, var(--accent) 12%, transparent)", color: "var(--accent)", borderColor: "var(--accent)" }
                  : { flex: 1 }
                }
                onClick={handleSave}
              >
                {Ic.heart} {saved ? "Guardado" : "Guardar"}
              </button>
              <button className="btn ghost" style={{ flex: 1 }} onClick={handleShareClick}>
                {Ic.share} Compartir
              </button>
            </div>
          </div>

          {/* Fechas */}
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
                      borderBottom: i < event.dates.length - 1 ? "1px dashed var(--line)" : "none",
                    }}
                  >
                    <div>
                      <strong>{f?.full ?? "Por confirmar"}</strong>
                      {f && (
                        <div style={{ color: "var(--ink-3)", fontSize: 12, textTransform: "capitalize" }}>
                          {f.weekday}
                        </div>
                      )}
                    </div>
                    {times && <div className="mono" style={{ fontSize: 13 }}>{times}</div>}
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
            <div style={{ fontWeight: 600 }}>{event.address} {event.addressNumber}</div>
            {place && <div style={{ color: "var(--ink-3)", fontSize: 13, marginTop: 2 }}>{place}</div>}
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
