import type { ReactNode } from "react";

export function KpiCard({
  label,
  value,
  ccy,
  trend,
  from,
  icon,
  color,
}: {
  label: string;
  value: string;
  ccy?: string;
  trend?: string;
  from?: string;
  icon: ReactNode;
  color?: string;
}) {
  const up = trend ? trend.startsWith("+") : false;
  return (
    <div className="kpi">
      <div className="lbl">
        <span className="ic" style={{ color: color || "var(--ink-2)" }}>{icon}</span>
        {label}
      </div>
      <div className="val">
        {value}
        {ccy && <span className="ccy">{ccy}</span>}
      </div>
      {trend && (
        <div className={`trend ${up ? "up" : "down"}`}>
          {up ? "▲" : "▼"} {trend} <span className="from">vs. {from}</span>
        </div>
      )}
      <svg className="spark" viewBox="0 0 80 30" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke={color || "var(--accent)"}
          strokeWidth="1.5"
          points={Array.from(
            { length: 14 },
            (_, i) => `${i * 6},${20 - Math.sin((i + (label.length % 5)) * 0.7) * 8 - i * 0.6}`,
          ).join(" ")}
        />
      </svg>
    </div>
  );
}
