"use client";

import Link from "next/link";
import { useState } from "react";
import { Ic } from "./icons";
import type { HeroEvent } from "@/lib/api";

export function HeroBlock({ events }: { events: HeroEvent[] }) {
  const [idx, setIdx] = useState(0);

  if (events.length === 0) return null;
  const n = events.length;
  const e = events[idx];

  return (
    <section className="hero">
      {n > 1 && (
        <div className="hero-arrows">
          <button className="icon-btn" onClick={() => setIdx((i) => (i + n - 1) % n)}>
            {Ic.chevL}
          </button>
          <button className="icon-btn" onClick={() => setIdx((i) => (i + 1) % n)}>
            {Ic.chevR}
          </button>
        </div>
      )}
      <div className="hero-grid">
        <div className="hero-text">
          <div>
            <div className="row" style={{ gap: 10 }}>
              <span className="pill accent">{e.category}</span>
              <span className="eyebrow">FEATURED · 注目</span>
            </div>
            <h1>{e.title}</h1>
            <p className="lead">{e.lead}</p>
          </div>
          <div className="hero-bottom">
            <Link className="btn dark lg" href={`/evento/${e.slug}`}>
              Ver evento {Ic.arrow}
            </Link>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: ".15em" }}>
                FECHA
              </span>
              <span style={{ fontWeight: 600 }}>{e.date}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: ".15em" }}>
                LUGAR
              </span>
              <span style={{ fontWeight: 600 }}>{e.place}</span>
            </div>
            {n > 1 && (
              <div className="hero-dots" style={{ marginLeft: "auto" }}>
                {events.map((_, i) => (
                  <div
                    key={i}
                    className={`d ${i === idx ? "on" : ""}`}
                    onClick={() => setIdx(i)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="hero-art">
          {e.image && <img className="hero-art-img" src={e.image} alt={e.title} />}
        </div>
      </div>
    </section>
  );
}
