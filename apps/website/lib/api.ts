// Cliente HTTP de la API de Konbini.
import type { EventItem, Role, User } from "./data";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";
// Origen sin el sufijo /api — para las imágenes servidas en /uploads.
const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor. ¿Está corriendo la API?");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const m = (data as { message?: string | string[] }).message;
    throw new Error(Array.isArray(m) ? m.join(" · ") : m || "Ocurrió un error inesperado");
  }
  return data as T;
}

/** Antepone el origen de la API a las rutas de imagen relativas (`/uploads/...`). */
export function imageUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_ORIGIN}${path}`;
}

// ───────────────────────────── Auth ─────────────────────────────

export type ApiUser = {
  id: number;
  email: string;
  firstname: string | null;
  lastname: string | null;
  rut: string | null;
  isCompany: boolean;
  role: Role;
  confirmed: boolean;
  blocked: boolean;
};

export type AuthResponse = { token: string; user: ApiUser };

// ─────────────────────────── Contenido ──────────────────────────

export type ApiCategory = {
  id: number;
  name: string | null;
  slug: string;
  description: string | null;
};

export type ApiRegion = { id: number; name: string; slug: string };
export type ApiCommune = { id: number; name: string; slug: string; regionId: number | null };

export type ApiEventPrice = { id: number; name: string; price: number };
export type ApiEventDate = {
  id: number;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
};
export type ApiEventLink = { id: number; link: string | null };

export type ApiEvent = {
  id: number;
  title: string;
  slug: string;
  company: string | null;
  description: string;
  about: string | null;
  expirationDate: string | null;
  address: string;
  addressNumber: string;
  ticketUrl: string | null;
  banner: string | null;
  poster: string | null;
  gallery: string[];
  isApproved: boolean;
  isRejected: boolean;
  rejectedReason: string | null;
  owner?: {
    id: number;
    firstname: string | null;
    lastname: string | null;
    email: string;
  } | null;
  region: ApiRegion | null;
  commune: ApiCommune | null;
  categories: ApiCategory[];
  prices: ApiEventPrice[];
  dates: ApiEventDate[];
  socialLinks: ApiEventLink[];
  videos: ApiEventLink[];
};

export type ApiEventList = {
  items: ApiEvent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type EventsQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
  category?: string;
  region?: string;
};

// Payload para crear un evento (POST /events).
export type CreateEventInput = {
  title: string;
  company?: string;
  description: string;
  about?: string;
  expirationDate?: string;
  address: string;
  addressNumber: string;
  ticketUrl?: string;
  banner?: string;
  poster?: string;
  gallery?: string[];
  regionId?: number;
  communeId?: number;
  categoryIds?: number[];
  prices?: { name: string; price?: number }[];
  dates?: { date?: string; startTime?: string; endTime?: string }[];
  socialLinks?: { link: string }[];
  videos?: { link: string }[];
};

function qs(query: Record<string, string | number | undefined>): string {
  const parts = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

export const api = {
  // Auth
  register: (body: { email: string; password: string; firstname: string; lastname: string }) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: (token: string) => request<ApiUser>("/auth/me", {}, token),

  // Contenido
  events: (query: EventsQuery = {}) => request<ApiEventList>(`/events${qs(query)}`),
  event: (slug: string) => request<ApiEvent>(`/events/${slug}`),
  createEvent: (body: CreateEventInput, token: string) =>
    request<ApiEvent>("/events", { method: "POST", body: JSON.stringify(body) }, token),
  myEvents: (token: string) => request<ApiEvent[]>("/events/mine", {}, token),
  adminEvents: (token: string, query: EventsQuery = {}) =>
    request<ApiEventList>(`/events/admin${qs(query)}`, {}, token),
  approveEvent: (id: number, token: string) =>
    request<ApiEvent>(`/events/${id}/approve`, { method: "PATCH" }, token),
  rejectEvent: (id: number, reason: string, token: string) =>
    request<ApiEvent>(
      `/events/${id}/reject`,
      { method: "PATCH", body: JSON.stringify({ reason }) },
      token,
    ),

  // Subida de imagen (multipart) — el navegador fija el Content-Type con su boundary.
  uploadImage: async (file: File, token: string): Promise<{ url: string; filename: string }> => {
    const form = new FormData();
    form.append("file", file);
    let res: Response;
    try {
      res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
    } catch {
      throw new Error("No se pudo conectar con el servidor. ¿Está corriendo la API?");
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const m = (data as { message?: string | string[] }).message;
      throw new Error(Array.isArray(m) ? m.join(" · ") : m || "No se pudo subir la imagen");
    }
    return data as { url: string; filename: string };
  },
  categories: () => request<ApiCategory[]>("/categories"),
  regions: () => request<ApiRegion[]>("/regions"),
  communes: (region?: string) =>
    request<ApiCommune[]>(`/communes${region ? `?region=${encodeURIComponent(region)}` : ""}`),
};

// ───────────────────────────── Mappers ──────────────────────────

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

/** Mapea el usuario de la API al shape de User que usa el website. */
export function toUser(u: ApiUser): User {
  const name = [u.firstname, u.lastname].filter(Boolean).join(" ") || u.email;
  return {
    id: u.id,
    name,
    email: u.email,
    phone: "",
    initials: initialsOf(name),
    role: u.role,
  };
}

const MESES = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
];

/** Formatea la primera fecha del evento como "8 ABR 2026". */
function formatEventDate(dates: ApiEventDate[]): string {
  const raw = dates.find((d) => d.date)?.date;
  if (!raw) return "Fecha por confirmar";
  const d = new Date(raw);
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function minPrice(prices: ApiEventPrice[]): number {
  if (!prices.length) return 0;
  return Math.min(...prices.map((p) => p.price));
}

/** Mapea un evento de la API al shape EventItem que consumen las cards. */
export function toEventItem(e: ApiEvent): EventItem {
  return {
    id: e.id,
    slug: e.slug,
    title: e.title,
    cat: e.categories[0]?.name ?? "Evento",
    catSlug: e.categories[0]?.slug,
    image: imageUrl(e.poster ?? e.banner),
    date: formatEventDate(e.dates),
    place: e.commune?.name ?? e.address,
    price: minPrice(e.prices),
  };
}

export type HeroEvent = {
  slug: string;
  title: string;
  category: string;
  date: string;
  place: string;
  lead: string;
  image: string;
};

/** Mapea un evento de la API al shape que consume el HeroBlock. */
export function toHeroEvent(e: ApiEvent): HeroEvent {
  return {
    slug: e.slug,
    title: e.title,
    category: e.categories[0]?.name ?? "Evento",
    date: formatEventDate(e.dates),
    place: e.commune?.name ?? e.address,
    lead: e.description,
    image: imageUrl(e.poster ?? e.banner),
  };
}
