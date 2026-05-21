export function RevenueChart() {
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const sales = [12, 18, 14, 22, 28, 34, 30, 42, 48, 52, 58, 64];
  const tix = [8, 12, 9, 15, 19, 24, 21, 30, 36, 38, 42, 48];
  const max = 70;
  const W = 700, H = 240, P = 30;
  const xs = (i: number) => P + (i * (W - P * 2)) / (months.length - 1);
  const ys = (v: number) => H - P - (v / max) * (H - P * 2);
  const path = (data: number[]) =>
    data.map((v, i) => `${i === 0 ? "M" : "L"} ${xs(i)} ${ys(v)}`).join(" ");
  const areaPath = (data: number[]) =>
    path(data) + ` L ${xs(months.length - 1)} ${H - P} L ${xs(0)} ${H - P} Z`;

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="gr1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity=".3" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1={P}
            x2={W - P}
            y1={P + (i * (H - P * 2)) / 4}
            y2={P + (i * (H - P * 2)) / 4}
            stroke="var(--line)"
            strokeDasharray="3 4"
          />
        ))}
        <path d={areaPath(sales)} fill="url(#gr1)" />
        <path d={path(sales)} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
        <path d={path(tix)} fill="none" stroke="var(--accent-3)" strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round" />
        {sales.map((v, i) => (
          <circle key={i} cx={xs(i)} cy={ys(v)} r="3" fill="var(--bg)" stroke="var(--accent)" strokeWidth="2" />
        ))}
        {months.map((m, i) => (
          <text
            key={i}
            x={xs(i)}
            y={H - 8}
            textAnchor="middle"
            fontSize="10"
            fill="var(--ink-3)"
            fontFamily="var(--font-mono)"
            letterSpacing=".05em"
          >
            {m.toUpperCase()}
          </text>
        ))}
        {[0, 1, 2, 3, 4].map((i) => (
          <text
            key={i}
            x={P - 8}
            y={P + (i * (H - P * 2)) / 4 + 4}
            textAnchor="end"
            fontSize="10"
            fill="var(--ink-3)"
            fontFamily="var(--font-mono)"
          >
            {Math.round(max - (i * max) / 4)}M
          </text>
        ))}
      </svg>
    </div>
  );
}
