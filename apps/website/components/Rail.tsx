import Link from "next/link";
import { EventCard } from "./EventCard";
import { Ic } from "./icons";
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
      <div className="rail-head">
        <h2>
          {title}
          {jp && <span className="jp">{jp}</span>}
        </h2>
        {hrefSeeAll && (
          <Link href={hrefSeeAll} className="see-all">
            Ver todos {Ic.arrow}
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
