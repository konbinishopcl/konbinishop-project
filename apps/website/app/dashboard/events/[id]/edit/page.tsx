"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "@/components/providers";
import { EventForm, type InitialEvent } from "../../EventForm";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const { token } = useUser();
  const [event, setEvent] = useState<InitialEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !id) return;
    fetch(`/api/events/${id}/admin`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: InitialEvent) => setEvent(data))
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [token, id]);

  if (loading) return (
    <div style={{ padding: 32, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
      Cargando evento…
    </div>
  );
  if (!event) return (
    <div style={{ padding: 32, textAlign: "center", color: "var(--err)", fontSize: 13 }}>
      Evento no encontrado.
    </div>
  );

  return <EventForm mode="edit" initial={event} />;
}
