import type { EventItem } from "@/lib/data";

/** Determina si el evento es hoy comparando la cadena de fecha */
function isToday(dateStr: string): boolean {
  const today = new Date().toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
  });
  return dateStr.toLowerCase().includes(today.toLowerCase());
}

export function Poster({
  e,
  saved = false,
  onSave,
}: {
  e: EventItem;
  saved?: boolean;
  onSave?: () => void;
}) {
  const today = isToday(e.date);

  return (
    <div className="poster">
      {/* Imagen de fondo */}
      <div
        className="pc-img"
        style={{
          backgroundImage: `url(${e.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Top row: chip de categoría + chip HOY + corazón */}
      <div className="pc-top">
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span className="cat-chip">{e.cat}</span>
          {today && <span className="today-chip">HOY</span>}
        </div>
        {onSave && (
          <button
            className={`heart${saved ? " saved" : ""}`}
            onClick={(ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              onSave();
            }}
            aria-label={saved ? "Quitar de favoritos" : "Guardar"}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={saved ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        )}
      </div>

      {/* Bottom gradient overlay */}
      <div className="pc-bottom">
        <div className="pc-date">{e.date}</div>
        <div className="pc-title">{e.title}</div>
        <div className="pc-place">
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {e.place}
        </div>
        <div className="pc-cta">
          Ver evento
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
