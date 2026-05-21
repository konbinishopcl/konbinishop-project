"use client";

import Link from "next/link";
import { useState } from "react";
import { Ic } from "./icons";
import { HERO } from "@/lib/data";

export function HeroBlock() {
  const [idx, setIdx] = useState(0);

  return (
    <section className="hero">
      <div className="hero-arrows">
        <button className="icon-btn" onClick={() => setIdx((i) => (i + 3) % 4)}>{Ic.chevL}</button>
        <button className="icon-btn" onClick={() => setIdx((i) => (i + 1) % 4)}>{Ic.chevR}</button>
      </div>
      <div className="hero-grid">
        <div className="hero-text">
          <div>
            <div className="row" style={{ gap: 10 }}>
              <span className="pill accent">{HERO.cat}</span>
              <span className="eyebrow">FEATURED · 注目</span>
            </div>
            <h1>
              {HERO.title1}
              <br />
              <em>{HERO.title2}</em>
            </h1>
            <p className="lead">{HERO.lead}</p>
          </div>
          <div className="hero-bottom">
            <Link className="btn dark lg" href="/checkout/1">Comprar entradas {Ic.arrow}</Link>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: ".15em" }}>FECHA</span>
              <span style={{ fontWeight: 600 }}>{HERO.date}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: ".15em" }}>LUGAR</span>
              <span style={{ fontWeight: 600 }}>{HERO.place}</span>
            </div>
            <div className="hero-dots" style={{ marginLeft: "auto" }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`d ${i === idx ? "on" : ""}`}
                  onClick={() => setIdx(i)}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-poster">
            <div className="pp-jp">
              ロヒアリム
              <br />
              戦記
            </div>
            <div className="pp-title">The War of the Rohirrim</div>
            <div className="pp-foot">2025 · WARNER BROS ANIME</div>
          </div>
        </div>
      </div>
    </section>
  );
}
