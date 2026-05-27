// Cliente HTTP de la API de Konbini.
import type { EventItem, Role, User } from "./data";

// En servidor: llama al backend directamente con la API key (process.env no-público).
// En cliente: llama al proxy Next.js /api/[...path] que agrega la key server-side.
function apiBase(): string {
  return typeof window === "undefined"
    ? process.env.API_URL || "http://localhost:3333/api"
    : "/api";
}

function buildHeaders(token?: string): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window === "undefined") {
    const key = process.env.API_KEY;
    if (key) h["X-API-Key"] = key;
  }
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${apiBase()}${path}`, {
      ...options,
      headers: { ...buildHeaders(token), ...options.headers },
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

/** Rutas de imagen pasan por el proxy interno /api/media/ con cache inmutable. */
export function imageUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `/api/media${path}`;
}

/** Builds the href for a spot link, depending on its link type. */
export function linkHref(type: "URL" | "PHONE" | "EMAIL", value: string): string {
  if (type === "PHONE") return `tel:${value}`;
  if (type === "EMAIL") return `mailto:${value}`;
  return value;
}

/** Agrega UTM params a una URL externa. Ignora mailto:, tel: y anclas. */
export function withUtm(url: string, campaign: string): string {
  if (!url || url.startsWith("#") || url.startsWith("mailto:") || url.startsWith("tel:")) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", "konbini");
    u.searchParams.set("utm_medium", "web");
    u.searchParams.set("utm_campaign", campaign);
    return u.toString();
  } catch {
    return url;
  }
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

// Phase 18+ — taxonomías separadas
export type ApiEventCategory = {
  id: number;
  name: string | null;
  slug: string;
  description: string | null;
  pricePerDay: number;
  icon: string | null;
  color: string | null;
  minDays: number;
  maxDays: number;
  order: number;
};

export type ApiEventTag = {
  id: number;
  name: string;
  slug: string;
};

export type ApiArticleCategory = {
  id: number;
  name: string | null;
  slug: string;
  description: string | null;
};

export type ApiArticleTag = {
  id: number;
  name: string;
  slug: string;
};


export type ApiCountry = { id: number; name: string; slug: string };
export type ApiRegion = { id: number; name: string; slug: string; countryId: number };
export type ApiCommune = { id: number; name: string; slug: string; stateId: number };

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
  addressNumber: string | null;
  ticketUrl: string | null;
  banner: string | null;
  poster: string | null;
  gallery: string[];
  isApproved: boolean;
  isRejected: boolean;
  rejectedReason: string | null;
  _count?: { likes: number };
  owner?: {
    id: number;
    firstname: string | null;
    lastname: string | null;
    email: string;
  } | null;
  region: ApiRegion | null;
  commune: ApiCommune | null;
  eventCategory: ApiEventCategory | null;
  eventTags?: ApiEventTag[];              // Phase 18+ (opcional — algunos endpoints viejos pueden no incluirlo)
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

// A paid placement shown in the home hero carousel.
export type ApiHero = {
  id: number;
  title: string;
  titleAccent: string | null;
  lead: string | null;
  image: string;
  date: string | null;
  place: string | null;
  link: string | null;
  eventCategory: ApiEventCategory | null;
  days: number | null;
  amount: number | null;
  expirationDate: string | null;
};

export type EventsQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
  eventCategory?: string;
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
  addressNumber?: string;
  ticketUrl?: string;
  banner?: string;
  poster?: string;
  gallery?: string[];
  regionId?: number;
  communeId?: number;
  eventCategoryId?: number;
  eventTagIds?: number[];
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
  register: (body: { email: string; password: string; firstname: string; lastname: string; countryId?: number }) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  verifyTwoFa: (code: string, pendingToken: string) =>
    request<AuthResponse>("/auth/2fa/verify", { method: "POST", body: JSON.stringify({ code }) }, pendingToken),
  resendTwoFa: (pendingToken: string) =>
    request<{ ok: boolean }>("/auth/2fa/resend", { method: "POST", body: JSON.stringify({}) }, pendingToken),
  googleAuth: (accessToken: string) =>
    request<AuthResponse>("/auth/google", { method: "POST", body: JSON.stringify({ accessToken }) }),
  googleOneTap: (credential: string) =>
    request<AuthResponse>("/auth/google/onetap", { method: "POST", body: JSON.stringify({ credential }) }),
  me: (token: string) => request<ApiUser>("/auth/me", {}, token),

  // Contenido
  events: (query: EventsQuery = {}) => request<ApiEventList>(`/events${qs(query)}`),
  event: (slug: string) => request<ApiEvent>(`/events/${slug}`),
  createEvent: (body: CreateEventInput, token: string) =>
    request<ApiEvent>("/events", { method: "POST", body: JSON.stringify(body) }, token),
  myEvents: (token: string) => request<ApiEvent[]>("/events/mine", {}, token),
  // El endpoint unificado /events devuelve todos los estados cuando el token es de admin.
  adminEvents: (token: string, query: EventsQuery = {}) =>
    request<ApiEventList>(`/events${qs(query)}`, {}, token),
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
      res = await fetch(`${apiBase()}/upload`, {
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
  countries: () => request<ApiCountry[]>("/countries"),
  eventCategories: () => request<ApiEventCategory[]>("/event-categories"),
  eventTags:       () => request<ApiEventTag[]>("/event-tags"),
  articleCategories: () => request<ApiArticleCategory[]>("/article-categories"),
  articleTags:     () => request<ApiArticleTag[]>("/article-tags"),
  regions: (country?: string) => request<ApiRegion[]>(`/states${country ? `?country=${encodeURIComponent(country)}` : ""}`),
  communes: (region?: string) =>
    request<ApiCommune[]>(`/cities${region ? `?state=${encodeURIComponent(region)}` : ""}`),
  heroes: () => request<ApiHero[]>("/heroes"),
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

/** Formats an ISO date as "8 ABR 2026". */
function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Formatea la primera fecha del evento como "8 ABR 2026". */
function formatEventDate(dates: ApiEventDate[]): string {
  const raw = dates.find((d) => d.date)?.date;
  if (!raw) return "Fecha por confirmar";
  return formatDateLabel(raw);
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
    cat: e.eventCategory?.name ?? "Evento",
    catSlug: e.eventCategory?.slug,
    image: imageUrl(e.poster ?? e.banner),
    date: formatEventDate(e.dates),
    place: e.commune?.name ?? e.address,
    price: minPrice(e.prices),
  };
}

// Shape consumed by the HeroBlock — one slide of the home hero carousel.
export type HeroSlide = {
  title: string;
  titleAccent: string;
  lead: string;
  category: string;
  date: string;
  place: string;
  image: string;
  href: string;
};

/** Maps an API hero to the shape the HeroBlock renders. */
export function toHeroSlide(h: ApiHero): HeroSlide {
  return {
    title: h.title,
    titleAccent: h.titleAccent ?? "",
    lead: h.lead ?? "",
    category: h.eventCategory?.name ?? "",
    date: h.date ? formatDateLabel(h.date) : "",
    place: h.place ?? "",
    image: imageUrl(h.image),
    href: h.link ? withUtm(h.link, "event_hero") : "#",
  };
}
