"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { api, imageUrl, type ApiOrder, type ApiOrderItem, type OrderItemKind } from "@/lib/api";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatCLP(n: number): string {
  return `$${n.toLocaleString("es-CL")}`;
}

const LABEL: Record<string, string> = {
  EVENT: "EVENTO",
  SPOT: "AVISO",
  HERO: "PORTADA",
};

function isCredit(item: ApiOrderItem): boolean {
  return item.type === "EVENT" && item.unitPrice === 0 && item.subtotal === 0;
}

function itemTitle(item: ApiOrderItem): string {
  return item.spot?.title ?? item.hero?.title ?? item.event?.title ?? "Producto";
}

function itemImage(item: ApiOrderItem): string | null {
  return item.spot?.image ?? item.hero?.image ?? item.event?.poster ?? item.event?.banner ?? null;
}

// ─── component ──────────────────────────────────────────────────────────────

export function CartView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, ready } = useUser();

  // Show feedback when returning from a failed/aborted payment
  useEffect(() => {
    const reason = searchParams.get("reason");
    if (reason === "aborted") toast.info("Pago cancelado. Tu carrito sigue intacto.");
    else if (reason === "failed") toast.error("El pago fue rechazado. Puedes reintentar.");
  }, []);

  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<OrderItemKind | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  // Base prices for discount row (fetched from settings)
  const [basePrices, setBasePrices] = useState<{ spot: number; hero: number } | null>(null);

  // Per-item optimistic day counts (before server round-trip confirms)
  const [localDays, setLocalDays] = useState<Record<string, number>>({});

  // Debounce timers per item type
  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ── load draft order on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;

    if (!user || !token) {
      router.replace("/login?returnTo=/carrito");
      return;
    }

    setLoading(true);
    api
      .ordersDraft(token)
      .then((o) => {
        setOrder(o);
        // Seed localDays from server data
        const days: Record<string, number> = {};
        o.items.forEach((item) => {
          days[item.type] = item.days;
        });
        setLocalDays(days);
      })
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoading(false));

    // Fetch base prices for discount row
    api.settingsPublic().then((settings) => {
      const spot = parseFloat(settings["SPOT_PRICE_PER_DAY"] ?? "0");
      const hero = parseFloat(settings["HERO_PRICE_PER_DAY"] ?? "0");
      if (spot > 0 || hero > 0) setBasePrices({ spot, hero });
    }).catch(() => {/* silently ignore — discount row just won't appear */});
  }, [ready, user, token, router]);

  // ── mutations ──────────────────────────────────────────────────────────────

  const removeItem = useCallback(async (type: OrderItemKind) => {
    if (!order || !token || busy) return;
    setBusy(type);
    try {
      const updated = await api.removeOrderItem(order.id, type, token);
      setOrder(updated);
      // Clean up localDays for removed type
      setLocalDays((prev) => {
        const next = { ...prev };
        delete next[type];
        return next;
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setBusy(null);
    }
  }, [order, token, busy]);

  const adjustDays = useCallback((item: ApiOrderItem, nextDays: number) => {
    if (!order || !token) return;
    // Clamp to [10, 30] for SPOT/HERO; no adjuster for EVENT credit
    const clamped = Math.max(10, Math.min(30, nextDays));
    const key = item.type;

    // Optimistic update
    setLocalDays((prev) => ({ ...prev, [key]: clamped }));

    // Debounce the PUT call
    clearTimeout(debounceRefs.current[key]);
    debounceRefs.current[key] = setTimeout(async () => {
      setBusy(item.type as OrderItemKind);
      try {
        const updated = await api.addOrderItem(
          order.id,
          {
            type: item.type,
            days: clamped,
            spotId: item.spotId ?? undefined,
            heroId: item.heroId ?? undefined,
            eventId: item.eventId ?? undefined,
          },
          token,
        );
        setOrder(updated);
        // Reconcile localDays with server response
        const days: Record<string, number> = {};
        updated.items.forEach((i) => {
          days[i.type] = i.days;
        });
        setLocalDays(days);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al ajustar días");
        // Revert optimistic update
        setLocalDays((prev) => ({ ...prev, [key]: item.days }));
      } finally {
        setBusy(null);
      }
    }, 400);
  }, [order, token]);

  // ── derived values ─────────────────────────────────────────────────────────

  const visibleItems = order?.items.filter((i) => i.type !== "SUBSCRIPTION") ?? [];

  // Compute discount savings (only if basePrices available and items have discounted unitPrice)
  const discountSaved = basePrices
    ? visibleItems.reduce((acc, item) => {
        const base =
          item.type === "SPOT" ? basePrices.spot :
          item.type === "HERO" ? basePrices.hero : 0;
        if (base > 0 && item.unitPrice < base) {
          acc += (base - item.unitPrice) * item.days;
        }
        return acc;
      }, 0)
    : 0;

  // ── render ─────────────────────────────────────────────────────────────────

  if (!ready || loading) {
    return (
      <main className="container cart-shell">
        <div className="eyebrow">CARRITO · カート</div>
        <h1>Tu compra</h1>
        <div style={{ padding: "60px 0", textAlign: "center", color: "var(--ink-2)" }}>
          Cargando carrito...
        </div>
      </main>
    );
  }

  if (!visibleItems.length) {
    return (
      <main className="container cart-shell">
        <div className="eyebrow">CARRITO · カート</div>
        <h1>Tu compra</h1>
        <div
          className="empty"
          style={{ textAlign: "center", padding: "80px 0" }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 8 }}>
            Tu carrito está vacío
          </h3>
          <p style={{ color: "var(--ink-2)", marginBottom: 24 }}>
            Agrega eventos, avisos o portadas desde tu panel de cuenta.
          </p>
          <button className="btn primary" onClick={() => router.push("/cuenta")}>
            Ir a mi cuenta →
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="container cart-shell">
      <div className="eyebrow">CARRITO · カート</div>
      <h1>Tu compra</h1>

      <div className="cart-grid">
        {/* ── item list ── */}
        <div>
          {visibleItems.map((item) => {
            const credit = isCredit(item);
            const title = itemTitle(item);
            const imgPath = itemImage(item);
            const label = LABEL[item.type] ?? item.type;
            const displayDays = localDays[item.type] ?? item.days;

            return (
              <div key={item.type} className={`cart-item${credit ? " credit" : ""}`}>
                <div className="thumb">
                  {imgPath ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={imageUrl(imgPath)}
                      alt={title}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(135deg, #2a1410, #4a1820)",
                      }}
                    />
                  )}
                </div>

                <div className="info">
                  <div className="k">
                    {credit ? "EVENTO · CRÉDITO DE SUSCRIPCIÓN" : label}
                  </div>
                  <div className="t">{title}</div>
                  <div className="m">
                    {credit
                      ? `Publicación fija de ${item.days} días`
                      : `${displayDays} días de publicación`}
                  </div>
                  {!credit && (
                    <div className="days">
                      <button
                        onClick={() => adjustDays(item, displayDays - 1)}
                        disabled={busy === item.type}
                        aria-label="Reducir días"
                      >
                        −
                      </button>
                      <div className="v">{displayDays} días</div>
                      <button
                        onClick={() => adjustDays(item, displayDays + 1)}
                        disabled={busy === item.type}
                        aria-label="Aumentar días"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>

                <div className="price-col">
                  <div className="pv">
                    {credit ? "$0" : formatCLP(item.subtotal)}
                  </div>
                  <div className="px">
                    {credit
                      ? "CRÉDITO"
                      : `${formatCLP(item.unitPrice)} / DÍA`}
                  </div>
                  <button
                    className="rm"
                    onClick={() => removeItem(item.type as OrderItemKind)}
                    disabled={busy === item.type}
                  >
                    {busy === item.type ? "..." : "Eliminar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── summary sidebar ── */}
        <aside className="cart-side">
          <h3>Resumen</h3>

          {visibleItems.map((item) => {
            const credit = isCredit(item);
            const label = LABEL[item.type] ?? item.type;
            const displayDays = localDays[item.type] ?? item.days;
            return (
              <div key={item.type} className="sum-row">
                <span>
                  {label}
                  {!credit && ` · ${displayDays} días`}
                </span>
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  {credit ? "$0" : formatCLP(item.subtotal)}
                </span>
              </div>
            );
          })}

          {discountSaved > 0 && (
            <div className="sum-row dis">
              <span>Descuento suscriptor</span>
              <span style={{ fontFamily: "var(--font-mono)" }}>
                -{formatCLP(discountSaved)}
              </span>
            </div>
          )}

          <div className="sum-row tot">
            <span>Total</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>
              {formatCLP(order?.total ?? 0)}
            </span>
          </div>

          <div style={{ marginTop: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>
              MEDIO DE PAGO
            </div>
            <div className="gateway-list">
              <div className="gw on">
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
              <div className="gw coming">
                <span className="radio" />
                <div style={{ flex: 1 }}>
                  <div className="gnm">Flow</div>
                  <div className="gm">PRÓXIMAMENTE</div>
                </div>
              </div>
            </div>
          </div>

          <button
            className="btn primary block lg"
            style={{ marginTop: 12 }}
            disabled={checkoutBusy || !!busy || !order || !token}
            onClick={async () => {
              if (!order || !token || checkoutBusy) return;
              setCheckoutBusy(true);
              try {
                const { redirectUrl } = await api.checkout(order.id, "TRANSBANK", token);
                window.location.href = redirectUrl;
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Error al iniciar el pago");
                setCheckoutBusy(false);
              }
            }}
          >
            {checkoutBusy ? "Redirigiendo…" : `Pagar ${formatCLP(order?.total ?? 0)} →`}
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
    </main>
  );
}
