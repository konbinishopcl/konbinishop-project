import Link from "next/link";
import { Poster } from "./Poster";
import type { EventItem } from "@/lib/data";

export function EventCard({ e, landscape = false }: { e: EventItem; landscape?: boolean }) {
  return (
    <Link href={`/evento/${e.id}`} className={`card ${landscape ? "land" : ""}`}>
      <Poster e={e} landscape={landscape} />
      <div className="meta">
        <div className="title">{e.title}</div>
        <div className="sub">
          {e.date}
          <span className="dot">·</span>
          {e.place}
        </div>
      </div>
    </Link>
  );
}
