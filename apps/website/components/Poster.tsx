import type { EventItem } from "@/lib/data";

export function Poster({ e, landscape = false }: { e: EventItem; landscape?: boolean }) {
  return (
    <div className={`poster ${landscape ? "land" : ""}`}>
      <img className="poster-img" src={e.image} alt={e.title} loading="lazy" />
      <div className="ribbon">{e.cat}</div>
      {e.price > 0 ? (
        <div className="price-tag">${e.price}</div>
      ) : (
        <div className="price-tag" style={{ background: "#1f8a5b" }}>
          FREE
        </div>
      )}
    </div>
  );
}
