import { EventCard } from "./EventCard";
import { Ic } from "./icons";
import type { EventItem } from "@/lib/data";

export function Rail({
  title,
  ja,
  items,
  landscape = false,
  cols = 6,
}: {
  title: string;
  ja: string;
  items: EventItem[];
  landscape?: boolean;
  cols?: number;
}) {
  return (
    <section>
      <div className="sec-head">
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <h2>{title}</h2>
          <span className="ja">{ja}</span>
        </div>
        <a className="more">Ver todos {Ic.arrow}</a>
      </div>
      <div className={`card-grid ${cols === 4 ? "cols-4" : ""}`}>
        {items.map((e, i) => (
          <EventCard key={`${e.id}-${i}`} e={e} landscape={landscape} />
        ))}
      </div>
    </section>
  );
}
