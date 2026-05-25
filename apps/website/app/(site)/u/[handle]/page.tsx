import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrganizerView } from "./OrganizerView";

export type OrganizerProfile = {
  id: number;
  handle: string;
  firstname: string | null;
  lastname: string | null;
  type: string;
  isVerified: boolean;
  createdAt: string;
  profile: {
    displayName: string | null;
    bio: string | null;
    avatar: string | null;
    banner: string | null;
    website: string | null;
    instagram: string | null;
    tiktok: string | null;
    facebook: string | null;
    x: string | null;
    youtube: string | null;
    twitch: string | null;
    linkedin: string | null;
  } | null;
  events: {
    id: number;
    title: string;
    slug: string;
    poster: string | null;
    banner: string | null;
    dates: { date: string | null }[];
    category: { name: string; slug: string } | null;
    city: { name: string } | null;
  }[];
  articles: {
    id: number;
    title: string;
    slug: string;
    image: string | null;
    excerpt: string | null;
    createdAt: string;
    tags: { id: number; name: string; slug: string }[];
  }[];
};

async function fetchProfile(handle: string): Promise<OrganizerProfile | null> {
  const base = process.env.API_URL || "http://localhost:3333/api";
  const headers: Record<string, string> = {};
  const key = process.env.API_KEY;
  if (key) headers["X-API-Key"] = key;
  try {
    const res = await fetch(`${base}/users/${handle}`, {
      headers,
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ handle: string }> },
): Promise<Metadata> {
  const { handle } = await params;
  const profile = await fetchProfile(handle);
  if (!profile) return { title: "Perfil no encontrado — Konbini" };
  const name = profile.profile?.displayName || [profile.firstname, profile.lastname].filter(Boolean).join(" ") || handle;
  return {
    title: `${name} — Konbini`,
    description: profile.profile?.bio ?? undefined,
  };
}

export default async function OrganizerPage(
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;
  const profile = await fetchProfile(handle);
  if (!profile) notFound();
  return <OrganizerView profile={profile} />;
}
