import { Ic } from "./icons";

export function PlaceholderView({
  title,
  ja,
  subtitle,
}: {
  title: string;
  ja: string;
  subtitle: string;
}) {
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">
            {title.toUpperCase()} · {ja}
          </div>
          <h1>
            {title} <span style={{ color: "var(--accent)" }}>.</span>
          </h1>
          <div className="sub">{subtitle}</div>
        </div>
      </div>
      <div className="panel" style={{ padding: 60, textAlign: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            margin: "0 auto 18px",
            borderRadius: 999,
            background: "var(--surface-2)",
            border: "1px solid var(--line)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {Ic.cog}
        </div>
        <h3 style={{ fontFamily: "var(--font-display)", margin: "0 0 8px", fontSize: 20 }}>
          Sección en construcción
        </h3>
        <p style={{ color: "var(--ink-3)", fontSize: 14, maxWidth: "42ch", margin: "0 auto" }}>
          La sección de <strong style={{ color: "var(--ink)" }}>{title}</strong> aún no está
          implementada. El Dashboard y la lista de Eventos están listos para usar.
        </p>
      </div>
    </>
  );
}
