"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Poster } from "./Poster";
import type { EventItem } from "@/lib/data";

export function EventCard({ e }: { e: EventItem }) {
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const handleSave = () => {
    const next = !saved;
    setSaved(next);
    toast.success(next ? "Guardado en favoritos" : "Eliminado de favoritos", {
      description: e.title,
    });
  };

  return (
    <div
      className="card"
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/evento/${e.slug}`)}
      onKeyDown={(ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          router.push(`/evento/${e.slug}`);
        }
      }}
      style={{ cursor: "pointer" }}
    >
      <Poster e={e} saved={saved} onSave={handleSave} />
    </div>
  );
}
