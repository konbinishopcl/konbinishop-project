import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api, imageUrl, toEventItem } from "@/lib/api";
import { EventView } from "./EventView";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  try {
    const event = await api.event(slug);
    const image = imageUrl(event.banner ?? event.poster);
    const place = [event.commune?.name, event.region?.name].filter(Boolean).join(", ");
    const category = event.category?.name;
    const description = event.description.slice(0, 160);
    return {
      title: event.title,
      description,
      openGraph: {
        type: "article",
        title: event.title,
        description,
        ...(image && { images: [{ url: image, width: 1200, height: 630, alt: event.title }] }),
        ...(place && { section: place }),
        ...(category && { tags: [category] }),
      },
      twitter: {
        card: "summary_large_image",
        title: event.title,
        description,
        ...(image && { images: [image] }),
      },
    };
  } catch {
    return { title: "Evento" };
  }
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const event = await api.event(slug).catch(() => null);
  if (!event) notFound();

  const relatedRes = await api
    .events({ category: event.category?.slug, pageSize: 8 })
    .catch(() => ({ items: [] }));
  const related = relatedRes.items
    .filter((e) => e.id !== event.id)
    .slice(0, 6)
    .map(toEventItem);

  return <EventView event={event} related={related} />;
}
