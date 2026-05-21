import type { EventItem } from "@/lib/data";

export function Poster({ e, landscape = false }: { e: EventItem; landscape?: boolean }) {
  return (
    <div className={`poster ${landscape ? "land" : ""}`}>
      <div className={`poster-art ${e.art}`} />
      <div className="poster-label">
        <div className="jp-big">{e.ja}</div>
        <div>
          <div className="en">{e.title}</div>
          <div className="stamp">{e.stamp}</div>
        </div>
      </div>
      <div className="ribbon">{e.cat}</div>
      {e.price > 0 ? (
        <div className="price-tag">${e.price}</div>
      ) : (
        <div className="price-tag" style={{ background: "#1f8a5b" }}>
          FREE
        </div>
      )}
      <div className="placeholder-note">placeholder</div>
    </div>
  );
}
