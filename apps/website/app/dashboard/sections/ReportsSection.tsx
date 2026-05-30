"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { api, type ApiPayment } from "@/lib/api";
import { RevenueBarChart, type RevenueDatum } from "@/components/charts/RevenueBarChart";

type Period = "Día" | "Semana" | "Mes" | "Año";

// ── CSV export helper ─────────────────────────────────────────────────────────

function buildCSV(rows: ApiPayment[]): string {
  const header = ["ID", "Comprador", "Productos", "Monto", "Fecha", "Estado"];
  const lines = rows.map((r) => {
    const fields = [
      "TX-" + r.id,
      r.buyer.name,
      r.items.map((i) => i.title).join(" + "),
      String(r.total),
      new Date(r.createdAt).toLocaleDateString("es-CL"),
      r.status === "PAID" ? "Aprobado" : "Fallido",
    ];
    return fields.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(",");
  });
  return [header.join(","), ...lines].join("\n");
}

// ── Bucketing helpers ─────────────────────────────────────────────────────────

function bucketByDay(payments: ApiPayment[]): RevenueDatum[] {
  // last 7 days, one bucket per calendar day, label = 2-digit day
  const now = new Date();
  const buckets: RevenueDatum[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const day = d.getDate();
    const label = String(day).padStart(2, "0");
    buckets.push({ label, value: 0 });
  }
  // Map each bucket to its calendar date
  const bucketDates = buckets.map((_, idx) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - idx));
    return d;
  });
  payments.forEach((p) => {
    const pd = new Date(p.createdAt);
    const idx = bucketDates.findIndex(
      (bd) =>
        bd.getFullYear() === pd.getFullYear() &&
        bd.getMonth() === pd.getMonth() &&
        bd.getDate() === pd.getDate()
    );
    if (idx !== -1) buckets[idx].value += p.total;
  });
  return buckets;
}

function bucketByWeek(payments: ApiPayment[]): RevenueDatum[] {
  // last 8 weeks, label = "S1".."S8" oldest→newest
  const now = new Date();
  const buckets: RevenueDatum[] = Array.from({ length: 8 }, (_, i) => ({
    label: `S${i + 1}`,
    value: 0,
  }));
  payments.forEach((p) => {
    const pd = new Date(p.createdAt);
    const diffMs = now.getTime() - pd.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays < 0 || diffDays >= 56) return; // outside 8-week window
    const weekIdx = 7 - Math.floor(diffDays / 7); // 0=oldest(7w ago), 7=newest
    if (weekIdx >= 0 && weekIdx < 8) buckets[weekIdx].value += p.total;
  });
  return buckets;
}

function bucketByMonth(payments: ApiPayment[]): RevenueDatum[] {
  // last 12 months, label = month initial, oldest→newest
  const MONTH_LABELS = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  const now = new Date();
  const buckets: RevenueDatum[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ label: MONTH_LABELS[d.getMonth()], value: 0 });
  }
  // Build reference months (year+month pairs), oldest→newest
  const refMonths = Array.from({ length: 12 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - idx), 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  payments.forEach((p) => {
    const pd = new Date(p.createdAt);
    const idx = refMonths.findIndex(
      (rm) => rm.year === pd.getFullYear() && rm.month === pd.getMonth()
    );
    if (idx !== -1) buckets[idx].value += p.total;
  });
  return buckets;
}

function bucketByYear(payments: ApiPayment[]): RevenueDatum[] {
  // last 5 years, label = 2-digit year, oldest→newest
  const now = new Date();
  const currentYear = now.getFullYear();
  const buckets: RevenueDatum[] = Array.from({ length: 5 }, (_, i) => ({
    label: String(currentYear - (4 - i)).slice(-2),
    value: 0,
  }));
  const startYear = currentYear - 4;
  payments.forEach((p) => {
    const year = new Date(p.createdAt).getFullYear();
    const idx = year - startYear;
    if (idx >= 0 && idx < 5) buckets[idx].value += p.total;
  });
  return buckets;
}

function getStartDateForPeriod(period: Period): Date {
  const now = new Date();
  switch (period) {
    case "Día": {
      const d = new Date(now);
      d.setDate(now.getDate() - 6);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "Semana": {
      const d = new Date(now);
      d.setDate(now.getDate() - 55);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "Mes": {
      const d = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      return d;
    }
    case "Año": {
      return new Date(now.getFullYear() - 4, 0, 1);
    }
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReportsSection() {
  const { token } = useUser();
  const [period, setPeriod] = useState<Period>("Mes");
  const [payments, setPayments] = useState<ApiPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setPayments(await api.adminPayments(token));
    } catch (ex) {
      toast.error(
        ex instanceof Error ? ex.message : "Reportes no disponibles — intenta de nuevo"
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  // Bucket paid payments by the active period
  const { chartData, periodPayments } = useMemo(() => {
    const paidPayments = payments.filter((p) => p.status === "PAID");

    // Build chart buckets
    let buckets: RevenueDatum[];
    switch (period) {
      case "Día":
        buckets = bucketByDay(paidPayments);
        break;
      case "Semana":
        buckets = bucketByWeek(paidPayments);
        break;
      case "Mes":
        buckets = bucketByMonth(paidPayments);
        break;
      case "Año":
        buckets = bucketByYear(paidPayments);
        break;
    }

    const allZero = buckets.every((b) => b.value === 0);
    const chartData: RevenueDatum[] = allZero ? [] : buckets;

    // In-period paid payments (for CSV export)
    const startDate = getStartDateForPeriod(period);
    const periodPayments = paidPayments.filter(
      (p) => new Date(p.createdAt) >= startDate
    );

    return { chartData, periodPayments };
  }, [payments, period]);

  // Top buyers by revenue (grouped from PAID payments)
  const topIngresos = useMemo(() => {
    const map = new Map<string, number>();
    payments
      .filter((p) => p.status === "PAID")
      .forEach((p) => map.set(p.buyer.name, (map.get(p.buyer.name) ?? 0) + p.total));
    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = sorted[0]?.[1] ?? 0;
    return sorted.map(([name, total]) => ({
      name,
      label: "$" + total.toLocaleString("es-CL"),
      pct: max > 0 ? Math.round((total / max) * 100) : 0,
    }));
  }, [payments]);

  function handleExportCSV() {
    const csv = buildCSV(periodPayments);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-${period.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV generado", {
      description: `reporte-${period.toLowerCase()}.csv descargado`,
    });
  }

  return (
    <>
      {/* Period filter chips */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        {(["Día", "Semana", "Mes", "Año"] as Period[]).map((p) => (
          <button
            key={p}
            className={`sel${period === p ? " on" : ""}`}
            onClick={() => setPeriod(p)}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Sales chart panel */}
      <div className="panel">
        <div className="ph">
          <h3>Ventas por período</h3>
          <button
            className="btn ghost"
            style={{ padding: "8px 14px", fontSize: 12 }}
            onClick={handleExportCSV}
          >
            ↓ Exportar CSV
          </button>
        </div>
        {loading ? (
          <div
            style={{
              height: 160,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ink-3)",
            }}
          >
            Cargando…
          </div>
        ) : (
          <RevenueBarChart data={chartData} />
        )}
      </div>

      {/* Top buyers by revenue */}
      <div className="panel" style={{ marginTop: 18 }}>
        <div className="ph">
          <h3>Top compradores (ingresos)</h3>
        </div>
        {topIngresos.length === 0 ? (
          <div className="empty">
            <div className="ic" />
            <h3>Sin datos de ingresos</h3>
          </div>
        ) : (
          topIngresos.map((t, i) => (
            <div key={t.name} className="cat-bar">
              <div className="name">
                {i + 1}. {t.name}
              </div>
              <div className="track">
                <div style={{ width: t.pct + "%" }} />
              </div>
              <div className="v">{t.label}</div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
