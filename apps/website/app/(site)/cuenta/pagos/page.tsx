"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AccountShell } from "../AccountShell";
import { useUser } from "@/components/providers";

interface OrderItem {
  type: string;
  description?: string;
  quantity?: number;
  total: number;
}

interface Order {
  id: number;
  externalId?: string;
  status: "PENDING" | "PAID" | "FAILED" | string;
  total: number;
  items: OrderItem[];
  createdAt: string;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  PAID:    { label: "Aprobado", color: "var(--ok)" },
  FAILED:  { label: "Fallido",  color: "var(--err)" },
  PENDING: { label: "Pendiente", color: "var(--warn)" },
};

function formatCLP(amount: number): string {
  return `$${amount.toLocaleString("es-CL")}`;
}

function itemSummary(items: OrderItem[]): string {
  return items.map((i) => i.description ?? i.type).join(" + ");
}

export default function PagosPage() {
  const { user, token, ready } = useUser();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login?returnTo=/cuenta/pagos");
      return;
    }
    if (!token) return;
    fetch("/api/orders/mine", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data : data.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [ready, user, token, router]);

  if (!ready || !user) {
    return (
      <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)" }}>
        {ready ? "Redirigiendo al inicio de sesión…" : "Verificando acceso…"}
      </main>
    );
  }

  return (
    <AccountShell>
      <h1>Historial de pagos</h1>
      <p className="lead">Todas tus transacciones en Konbini.</p>

      {loading ? (
        <div className="acc-section" style={{ color: "var(--ink-3)", fontSize: 14 }}>Cargando pagos…</div>
      ) : orders.length === 0 ? (
        <div className="acc-section" style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ color: "var(--ink-3)", fontSize: 14 }}>No tienes transacciones aún.</div>
        </div>
      ) : (
        <div className="acc-section">
          {orders.map((o) => {
            const sm = STATUS_META[o.status] ?? { label: o.status, color: "var(--ink-3)" };
            const date = new Date(o.createdAt).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" }).toUpperCase();
            const txId = o.externalId ?? `TX-${o.id}`;
            return (
              <div key={o.id} className="acc-list-row">
                <div className="main">
                  <div className="t">{itemSummary(o.items) || "Pago"}</div>
                  <div className="m" style={{ fontFamily: "var(--font-mono)" }}>
                    {txId} · {date}
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                  {formatCLP(o.total)}
                </div>
                <span
                  className="pill"
                  style={{
                    color: sm.color,
                    borderColor: `color-mix(in oklab, ${sm.color} 30%, transparent)`,
                    background: `color-mix(in oklab, ${sm.color} 10%, transparent)`,
                  }}
                >
                  {sm.label}
                </span>
                <button className="btn ghost" style={{ padding: "8px 14px", fontSize: 12 }}>
                  Descargar
                </button>
              </div>
            );
          })}
        </div>
      )}
    </AccountShell>
  );
}
