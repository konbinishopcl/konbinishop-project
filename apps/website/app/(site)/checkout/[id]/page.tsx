"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Ic } from "@/components/icons";
import { EVENTS } from "@/lib/data";

type Tier = { name: string; desc: string; price: number; qty: number };

export default function CheckoutPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const e = EVENTS.find((x) => x.id === Number(params.id)) ?? EVENTS[0];

  const [step, setStep] = useState(1);
  const [tiers, setTiers] = useState<Tier[]>([
    { name: "General", desc: "Sala estándar · butaca libre", price: 9990, qty: 1 },
    { name: "3D Premium", desc: "Lentes incluidos · sala IMAX", price: 14990, qty: 0 },
    { name: "VIP · Combo", desc: "Reclinable + cabritas + bebida", price: 22990, qty: 0 },
  ]);

  const subtotal = tiers.reduce((s, t) => s + t.price * t.qty, 0);
  const fee = Math.round(subtotal * 0.06);
  const total = subtotal + fee;
  const fmt = (n: number) => n.toLocaleString("es-CL");
  const setQty = (i: number, d: number) =>
    setTiers(tiers.map((t, j) => (j === i ? { ...t, qty: Math.max(0, t.qty + d) } : t)));
  const totalTickets = tiers.reduce((s, t) => s + t.qty, 0);

  // simula el redirect a la pasarela
  useEffect(() => {
    if (step === 2) {
      const id = setTimeout(() => setStep(3), 2200);
      return () => clearTimeout(id);
    }
  }, [step]);

  return (
    <main className="container">
      <div className="ck-shell">
        <div className="ck-head">
          <div>
            <button
              className="btn ghost"
              style={{ fontSize: 12, padding: "6px 14px" }}
              onClick={() => router.push(`/evento/${e.id}`)}
            >
              {Ic.chevL} Volver al evento
            </button>
            <h1 className="display" style={{ fontSize: 32, margin: "16px 0 4px" }}>
              Checkout
            </h1>
            <div style={{ color: "var(--ink-3)", fontSize: 14 }}>
              {e.title} · {e.date}
            </div>
          </div>
          <div className="ck-steps">
            <div className={`s ${step >= 1 ? "on" : ""} ${step > 1 ? "done" : ""}`}>
              <span className="n">1</span> ENTRADAS
            </div>
            <div className="line" />
            <div className={`s ${step >= 2 ? "on" : ""} ${step > 2 ? "done" : ""}`}>
              <span className="n">2</span> PAGO
            </div>
            <div className="line" />
            <div className={`s ${step >= 3 ? "on" : ""}`}>
              <span className="n">3</span> CONFIRMACIÓN
            </div>
          </div>
        </div>

        {step === 1 && (
          <div className="ck-grid">
            <div>
              <h2 className="display" style={{ fontSize: 22, marginTop: 0 }}>
                Selecciona tus entradas
              </h2>
              {tiers.map((t, i) => (
                <div key={i} className="ck-tier">
                  <div>
                    <div className="name">{t.name}</div>
                    <div className="desc">{t.desc}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                    <div className="price">${fmt(t.price)}</div>
                    <div className="ck-qty">
                      <button onClick={() => setQty(i, -1)} disabled={t.qty === 0}>
                        −
                      </button>
                      <span className="v">{t.qty}</span>
                      <button onClick={() => setQty(i, +1)}>+</button>
                    </div>
                  </div>
                </div>
              ))}
              <div
                className="help"
                style={{
                  marginTop: 18,
                  color: "var(--ink-3)",
                  fontSize: 13,
                  padding: 14,
                  background: "var(--surface-2)",
                  borderRadius: 10,
                }}
              >
                💡 El pago se procesará por nuestra <strong>pasarela segura</strong>. No solicitamos
                ni almacenamos datos de tu tarjeta.
              </div>
            </div>
            <aside className="ck-summary">
              <h3>Resumen</h3>
              {tiers
                .filter((t) => t.qty > 0)
                .map((t, i) => (
                  <div key={i} className="sum-row">
                    <span>
                      {t.name} × {t.qty}
                    </span>
                    <span className="mono">${fmt(t.price * t.qty)}</span>
                  </div>
                ))}
              {totalTickets === 0 && (
                <div style={{ color: "var(--ink-3)", fontSize: 13, padding: "8px 0" }}>
                  Agrega entradas para continuar.
                </div>
              )}
              {totalTickets > 0 && (
                <>
                  <div className="sum-row">
                    <span style={{ color: "var(--ink-3)" }}>Subtotal</span>
                    <span className="mono">${fmt(subtotal)}</span>
                  </div>
                  <div className="sum-row">
                    <span style={{ color: "var(--ink-3)" }}>Servicio (6%)</span>
                    <span className="mono">${fmt(fee)}</span>
                  </div>
                  <div className="sum-row tot">
                    <span>Total</span>
                    <span>${fmt(total)}</span>
                  </div>
                </>
              )}
              <button
                className="btn primary block lg"
                disabled={totalTickets === 0}
                style={{ marginTop: 18, opacity: totalTickets === 0 ? 0.4 : 1 }}
                onClick={() => setStep(2)}
              >
                Continuar al pago {Ic.arrow}
              </button>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--ink-3)",
                  letterSpacing: ".1em",
                  textAlign: "center",
                  marginTop: 12,
                }}
              >
                🔒 PAGO SEGURO · SSL · 3D SECURE
              </div>
            </aside>
          </div>
        )}

        {step === 2 && (
          <div className="gateway-card">
            <div className="lock">{Ic.lock}</div>
            <h3>Redirigiendo a la pasarela…</h3>
            <p>
              Estamos llevándote a nuestro procesador de pago certificado. Tus datos están
              protegidos con cifrado de extremo a extremo.
            </p>
            <div
              style={{
                position: "relative",
                margin: "20px auto",
                maxWidth: 280,
                height: 4,
                background: "rgba(255,255,255,.2)",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "white",
                  borderRadius: 999,
                  animation: "load 2.2s ease forwards",
                }}
              />
            </div>
            <style>{`@keyframes load { from { transform: translateX(-100%); } to { transform: translateX(0); } }`}</style>
            <div className="gateway-logos">
              <span>WEBPAY+</span>
              <span>·</span>
              <span>MERCADO PAGO</span>
              <span>·</span>
              <span>STRIPE</span>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="ck-grid">
            <div className="ticket-result">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 18 }}>
                <div>
                  <div className="eyebrow" style={{ color: "var(--ok)" }}>
                    ✓ COMPRA CONFIRMADA
                  </div>
                  <h2 className="display" style={{ fontSize: 30, margin: "10px 0 4px" }}>
                    {e.title}
                  </h2>
                  <div style={{ color: "var(--ink-3)" }}>
                    {e.date} · {e.place}
                  </div>
                </div>
                <div className="qr-code" />
              </div>
              <div className="perf">
                <div className="cell">
                  <div className="lbl">CÓDIGO</div>
                  <div className="val mono">KB-9F2A-71X</div>
                </div>
                <div className="cell">
                  <div className="lbl">ASISTENTE</div>
                  <div className="val">Edgardo Toro</div>
                </div>
                <div className="cell">
                  <div className="lbl">ENTRADAS</div>
                  <div className="val">{totalTickets || 1} tickets</div>
                </div>
                <div className="cell">
                  <div className="lbl">PAGADO</div>
                  <div className="val mono">${fmt(total || 9990)}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                <button className="btn dark">Descargar PDF</button>
                <button className="btn ghost">Enviar a mi correo</button>
                <button className="btn ghost">Agregar al calendario</button>
              </div>
            </div>
            <aside className="ck-summary">
              <h3>¿Qué sigue?</h3>
              <ol style={{ paddingLeft: 18, color: "var(--ink-2)", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                <li>Te enviamos las entradas a tu correo.</li>
                <li>Presenta el QR al ingresar al evento.</li>
                <li>
                  Comparte tu plan en redes con{" "}
                  <span className="mono" style={{ color: "var(--accent)" }}>
                    #Konbini
                  </span>
                </li>
              </ol>
              <button className="btn primary block" style={{ marginTop: 22 }} onClick={() => router.push("/")}>
                Volver a explorar
              </button>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
