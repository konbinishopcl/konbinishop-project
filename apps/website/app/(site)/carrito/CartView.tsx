"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type CartItem = {
  id: string;
  kind: "EVENTO" | "AVISO" | "PORTADA";
  title: string;
  days: number;
  pricePerDay: number;
  isCredit?: boolean;
};

const MOCK_ITEMS: CartItem[] = [
  {
    id: "evt-1",
    kind: "EVENTO",
    title: "Anime Fest Santiago 2025",
    days: 45,
    pricePerDay: 0,
    isCredit: true,
  },
];

function formatCLP(n: number): string {
  return `$${n.toLocaleString("es-CL")}`;
}

export function CartView() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [gateway, setGateway] = useState<"webpay">("webpay");

  useEffect(() => {
    // Try to load from localStorage, fallback to mock
    try {
      const raw = localStorage.getItem("kb-cart");
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    setItems(MOCK_ITEMS);
  }, []);

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const updateDays = (id: string, delta: number) =>
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, days: Math.max(10, Math.min(30, i.days + delta)) } : i,
      ),
    );

  const subtotals = items.map((i) => i.days * i.pricePerDay);
  const total = subtotals.reduce((s, v) => s + v, 0);

  const handleCheckout = () => {
    router.push("/carrito/exito");
  };

  const handleClear = () => {
    setItems([]);
    try { localStorage.removeItem("kb-cart"); } catch { /* ignore */ }
  };

  return (
    <main className="container cart-shell">
      <div className="eyebrow">CARRITO · カート</div>
      <h1>Tu compra</h1>

      {items.length === 0 ? (
        <div
          className="empty"
          style={{
            textAlign: "center",
            padding: "80px 0",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 24,
              marginBottom: 8,
            }}
          >
            Tu carrito está vacío
          </h3>
          <p style={{ color: "var(--ink-2)", marginBottom: 24 }}>
            Agrega eventos, avisos o portadas desde tu panel de cuenta.
          </p>
          <button className="btn primary" onClick={() => router.push("/cuenta")}>
            Ir a mi cuenta →
          </button>
        </div>
      ) : (
        <div className="cart-grid">
          <div>
            {items.map((item, idx) => (
              <div key={item.id} className={`cart-item${item.isCredit ? " credit" : ""}`}>
                <div className="thumb">
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: `linear-gradient(135deg, #2a1410, #4a1820)`,
                    }}
                  />
                </div>
                <div className="info">
                  <div className="k">
                    {item.kind}
                    {item.isCredit && " · CRÉDITO DE SUSCRIPCIÓN"}
                  </div>
                  <div className="t">{item.title}</div>
                  <div className="m">
                    {item.isCredit
                      ? "Publicación fija de 45 días"
                      : `${item.days} días de publicación`}
                  </div>
                  {!item.isCredit && (
                    <div className="days">
                      <button onClick={() => updateDays(item.id, -1)}>−</button>
                      <div className="v">{item.days} días</div>
                      <button onClick={() => updateDays(item.id, +1)}>+</button>
                    </div>
                  )}
                </div>
                <div className="price-col">
                  <div className="pv">
                    {item.isCredit ? formatCLP(0) : formatCLP(item.days * item.pricePerDay)}
                  </div>
                  <div className="px">
                    {item.isCredit ? "CRÉDITO" : `${formatCLP(item.pricePerDay)} / DÍA`}
                  </div>
                  <button className="rm" onClick={() => removeItem(item.id)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}

            <button
              className="btn ghost"
              style={{ marginTop: 8 }}
              onClick={handleClear}
            >
              Vaciar carrito
            </button>
          </div>

          <aside className="cart-side">
            <h3>Resumen</h3>
            {items.map((item, idx) => (
              <div key={item.id} className="sum-row">
                <span>
                  {item.kind} {!item.isCredit && `· ${item.days} días`}
                </span>
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  {item.isCredit ? "$0" : formatCLP(subtotals[idx])}
                </span>
              </div>
            ))}
            <div className="sum-row tot">
              <span>Total</span>
              <span style={{ fontFamily: "var(--font-mono)" }}>{formatCLP(total)}</span>
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>
                MEDIO DE PAGO
              </div>
              <div className="gateway-list">
                <div
                  className={`gw ${gateway === "webpay" ? "on" : ""}`}
                  onClick={() => setGateway("webpay")}
                >
                  <span className="radio" />
                  <div style={{ flex: 1 }}>
                    <div className="gnm">WebPay Plus</div>
                    <div className="gm">TRANSBANK · TARJETAS CL</div>
                  </div>
                </div>
                <div className="gw coming">
                  <span className="radio" />
                  <div style={{ flex: 1 }}>
                    <div className="gnm">Mercado Pago</div>
                    <div className="gm">PRÓXIMAMENTE</div>
                  </div>
                </div>
              </div>
            </div>

            <button
              className="btn primary block lg"
              style={{ marginTop: 12 }}
              onClick={handleCheckout}
            >
              Pagar {formatCLP(total)} →
            </button>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--ink-3)",
                letterSpacing: ".1em",
                textAlign: "center",
                marginTop: 10,
              }}
            >
              PAGO SEGURO · SSL · WEBPAY
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
