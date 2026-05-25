import Link from "next/link";
import { EventCard } from "./EventCard";
import type { EventItem } from "@/lib/data";

export function Rail({
  title,
  jp,
  hrefSeeAll,
  items,
}: {
  title: string;
  jp?: string;
  hrefSeeAll?: string;
  items: EventItem[];
}) {
  return (
    <section className="rail">
      <div className="sec-head">
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <h2>{title}</h2>
          {jp && <span className="ja">{jp}</span>}
        </div>
        {hrefSeeAll && (
          <Link href={hrefSeeAll} className="more">
            Ver todos →
          </Link>
        )}
      </div>
      <div className="rail-track">
        {items.slice(0, 4).map((e, i) => (
          <EventCard key={`${e.id}-${i}`} e={e} />
        ))}
      </div>
    </section>
  );
}
