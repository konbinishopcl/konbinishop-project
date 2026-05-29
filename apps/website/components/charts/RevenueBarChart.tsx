"use client";
import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export type RevenueDatum = { label: string; value: number };

// CLP shortener: ≥1,000,000 → "$XM", ≥1,000 → "$Xk", else "$X"
function formatCLP(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n}`;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value?: number }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-sm)",
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        padding: "6px 10px",
        color: "var(--ink)",
      }}
    >
      {formatCLP(Number(payload[0].value ?? 0))}
    </div>
  );
}

export function RevenueBarChart({ data }: { data: RevenueDatum[] }) {
  if (data.length === 0) {
    return (
      <div className="empty">
        <div className="ic" />
        <h3>Sin ventas en este período</h3>
        <p>No hubo pagos registrados para el período seleccionado.</p>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            fill: "var(--ink-3)",
          }}
        />
        <Tooltip
          content={({ active, payload }) => (
            <ChartTooltip
              active={active}
              payload={payload as unknown as { value?: number }[]}
            />
          )}
          cursor={{ fill: "transparent" }}
        />
        <Bar
          dataKey="value"
          fill="color-mix(in oklab, var(--accent) 60%, transparent)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default RevenueBarChart;
