"use client";
import { useState } from "react";
import Link from "next/link";
import { imageUrl, toEventItem } from "@/lib/api";
import type { OrganizerProfile } from "./page";
import type { ApiEvent } from "@/lib/api";

function EventMiniCard({
  event,
}: {
  event: OrganizerProfile["events"][0];
}) {
  const img = event.poster ?? event.banner;
  const dateStr =
    event.dates[0]?.date
      ? new Date(event.dates[0].date).toLocaleDateString("es-CL", {
          day: "numeric",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        })
      : "Fecha por confirmar";

  return (
    <Link href={`/evento/${event.slug}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-lg)",
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        <div style={{ aspectRatio: "16/9", position: "relative", background: "#1a1714" }}>
          {img ? (
            <img
              src={imageUrl(img)}
              alt={event.title}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#2a1410,#4a1820)" }} />
          )}
        </div>
        <div style={{ padding: "14px 16px" }}>
          {event.category && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".15em", color: "var(--accent)", marginBottom: 6 }}>
              {event.category.name.toUpperCase()}
            </div>
          )}
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, lineHeight: 1.2, marginBottom: 4 }}>
            {event.title}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
            {dateStr}
            {event.city && ` · ${event.city.name}`}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function OrganizerView({ profile }: { profile: OrganizerProfile }) {
  const [tab, setTab] = useState<"proximos" | "pasados" | "articulos">("proximos");

  const name =
    profile.profile?.displayName ||
    [profile.firstname, profile.lastname].filter(Boolean).join(" ") ||
    profile.handle;

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "K";

  const now = new Date();
  const upcoming = profile.events.filter((e) => {
    const d = e.dates[0]?.date;
    if (!d) return true;
    return new Date(d) >= now;
  });
  const past = profile.events.filter((e) => {
    const d = e.dates[0]?.date;
    if (!d) return false;
    return new Date(d) < now;
  });

  const list = tab === "proximos" ? upcoming : tab === "pasados" ? past : null;

  return (
    <main className="container">
      {/* Banner */}
      <div className="org-banner">
        {profile.profile?.banner ? (
          <img
            src={imageUrl(profile.profile.banner)}
            alt={name}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }}
          />
        ) : null}
      </div>

      {/* Head */}
      <div className="org-head">
        <div className="org-avatar">
          {profile.profile?.avatar ? (
            <img
              src={imageUrl(profile.profile.avatar)}
              alt={name}
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
            />
          ) : (
            initials
          )}
        </div>
        <div className="org-meta">
          <h1>
            {name}
            {profile.isVerified && (
              <span className="verified">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2 9.5 4.5 6 4l-.5 3.5L2 9.5 4 12l-2 2.5L5.5 16 6 19.5l3.5-.5L12 22l2.5-3 3.5.5.5-3.5L22 14.5 20 12l2-2.5L18.5 8 18 4.5l-3.5.5z" />
                </svg>
                Verificado
              </span>
            )}
          </h1>
          <div className="handle">konbini.cl/u/{profile.handle}</div>
          {profile.profile?.bio && <p className="bio">{profile.profile.bio}</p>}
          {profile.profile?.website && (
            <a
              href={profile.profile.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent)", fontSize: 13, marginTop: 8, display: "inline-block" }}
            >
              {profile.profile.website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
        <div className="org-stats">
          <div className="s">
            <span className="n">{profile.events.length}</span>
            <span className="l">Eventos</span>
          </div>
          {profile.articles.length > 0 && (
            <div className="s">
              <span className="n">{profile.articles.length}</span>
              <span className="l">Artículos</span>
            </div>
          )}
        </div>
        <div className="org-socials">
          {profile.profile?.instagram && (
            <a href={`https://instagram.com/${profile.profile.instagram}`} className="icon-btn" target="_blank" rel="noopener noreferrer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
          )}
          {profile.profile?.facebook && (
            <a href={`https://facebook.com/${profile.profile.facebook}`} className="icon-btn" target="_blank" rel="noopener noreferrer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="org-tabs">
        <button
          className={tab === "proximos" ? "on" : ""}
          onClick={() => setTab("proximos")}
        >
          Próximos{" "}
          <span style={{ color: "var(--ink-3)", marginLeft: 6, fontFamily: "var(--font-mono)", fontSize: 11 }}>
            {upcoming.length}
          </span>
        </button>
        <button
          className={tab === "pasados" ? "on" : ""}
          onClick={() => setTab("pasados")}
        >
          Pasados{" "}
          <span style={{ color: "var(--ink-3)", marginLeft: 6, fontFamily: "var(--font-mono)", fontSize: 11 }}>
            {past.length}
          </span>
        </button>
        {profile.articles.length > 0 && (
          <button
            className={tab === "articulos" ? "on" : ""}
            onClick={() => setTab("articulos")}
          >
            Artículos{" "}
            <span style={{ color: "var(--ink-3)", marginLeft: 6, fontFamily: "var(--font-mono)", fontSize: 11 }}>
              {profile.articles.length}
            </span>
          </button>
        )}
      </div>

      {/* Content */}
      {tab === "articulos" ? (
        <div className="card-grid" style={{ marginBottom: 60 }}>
          {profile.articles.map((a) => (
            <Link key={a.id} href={`/noticias/${a.slug}`} style={{ textDecoration: "none" }}>
              <article className="art-card">
                <div className="a-img">
                  {a.image ? (
                    <img
                      src={imageUrl(a.image)}
                      alt={a.title}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#2a1410,#4a1820)" }} />
                  )}
                </div>
                <div className="a-cat">{a.tags[0]?.name ?? "Noticias"}</div>
                <h3 className="a-title">{a.title}</h3>
              </article>
            </Link>
          ))}
        </div>
      ) : (
        <div
          className="card-grid"
          style={{
            marginBottom: 60,
            ...(tab === "pasados" ? { filter: "grayscale(.7)", opacity: 0.75 } : {}),
          }}
        >
          {(list ?? []).map((e) => (
            <EventMiniCard key={e.id} event={e} />
          ))}
          {(list ?? []).length === 0 && (
            <div className="empty">
              {tab === "proximos" ? "Sin eventos próximos." : "Sin eventos pasados."}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
