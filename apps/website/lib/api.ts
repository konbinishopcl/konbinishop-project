// Cliente HTTP de la API de Konbini.
import { cache } from "react";
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
  type: 'PERSON' | 'ORGANIZATION';
  handle: string | null;
};

export type AuthResponse = { token: string; user: ApiUser };

export type ApiAdminUser = {
  id: number;
  email: string;
  firstname: string | null;
  lastname: string | null;
  rut: string | null;
  isCompany: boolean;
  role: Role;
  confirmed: boolean;
  blocked: boolean;
  type: 'PERSON' | 'ORGANIZATION';
  handle: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApiFaqItem = {
  id: number;
  question: string;
  answer: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'BAN' | 'UNBAN';
export type AuditEntity = 'EVENT' | 'USER' | 'AVISO' | 'PORTADA';

export type ApiAuditLog = {
  id: number;
  userId: number | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId: number;
  metadata: Record<string, unknown>;
  ip: string | null;
  userAgent: string | null;
  url: string | null;
  createdAt: string;
};

export type ApiAuditLogList = {
  items: ApiAuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type AuditQuery = {
  page?: number;
  pageSize?: number;
  action?: AuditAction;
  entity?: AuditEntity;
  userId?: number;
  dateFrom?: string;
  dateTo?: string;
};

// ─────────────────────────── Phase 27: Payments ──────────────────────────

export type ApiPayment = {
  id: number;
  status: "PAID" | "FAILED";
  total: number;
  gateway: string | null;
  createdAt: string;
  buyer: { name: string; handle: string | null; email: string };
  items: Array<{ type: string; title: string; days: number; subtotal: number }>;
};

export type ApiServiceOption = {
  id: number;
  label: string;
  order: number;
};

// ─────────────────────────── Phase 26: Inbox / CRM / Subs ──────────────────────────

export type ApiContactMessage = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type CrmStage = 'NEW' | 'CONTACTED' | 'NEGOTIATING' | 'WON' | 'LOST';
export type CrmType  = 'CONTACT' | 'PHOTOGRAPHY' | 'CONTENT';

export type ApiCrmEntry = {
  id: number;
  type: CrmType;
  stage: CrmStage;
  stageReason: string | null;
  contactName: string;
  contactEmail: string;
  assignedTo: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiCrmNote = {
  id: number;
  content: string;
  authorId: number | null;
  crmEntryId: number;
  createdAt: string;
};

// SubscriptionStatus enum: ACTIVE | CANCELLED | EXPIRED (double-L — from Prisma schema)
// Subscription.findAll includes user: { id, email, type, handle } and org: { id, email, handle }
// (no firstname/lastname — the subscriptions service selects only these fields)
export type ApiSubscription = {
  id: number;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  cycleStart: string;
  cycleEnd: string;
  creditsUsed: number;
  creditsTotal: number;
  cancelledAt: string | null;
  createdAt: string;
  user?: { id: number; email: string; type: 'PERSON' | 'ORGANIZATION'; handle: string | null } | null;
  org?: { id: number; email: string; handle: string | null } | null;
};

export type ApiSubscriptionList = {
  items: ApiSubscription[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ApiCrmList = {
  items: ApiCrmEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

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
  nameJa?: string | null;
  slug: string;
  description: string | null;
  _count?: { articles?: number };
};

export type ApiArticleEvent = {
  id: number;
  slug: string;
  title: string;
  poster: string | null;
  banner: string | null;
  dates: { id: number; date: string | null }[];
  city: { name: string } | null;
  category: { name: string; slug: string } | null;
};

export type ApiArticle = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image: string | null;
  status: string;
  userId: number | null;
  isSponsored: boolean;
  createdAt: string;
  articleCategories: ApiArticleCategory[];
  articleTags: { id: number; name: string; slug: string }[];
  tags: { id: number; name: string; slug: string }[];
  events?: ApiArticleEvent[];
  _count?: { likes: number };
};

export type ApiArticleTag = {
  id: number;
  name: string;
  slug: string;
  _count?: { articles?: number };
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
  status: "DRAFT" | "PENDING_PAYMENT" | "PENDING_MODERATION" | "APPROVED" | "REJECTED" | "BANNED";
  statusReason: string | null;
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

export type ApiOwner = {
  id: number;
  firstname: string | null;
  lastname: string | null;
  email: string;
  handle?: string | null;
};

export type ApiSpot = {
  id: number;
  title: string;
  image: string | null;
  linkType: "URL" | "PHONE" | "EMAIL";
  linkValue: string;
  status: "DRAFT" | "PENDING_PAYMENT" | "PENDING_MODERATION" | "APPROVED" | "REJECTED" | "BANNED";
  statusReason: string | null;
  days: number | null;
  amount: number | null;
  expirationDate: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
  owner?: ApiOwner | null;
};

export type ApiQuota = {
  max: number;
  active: number;
  available: number;
  pricePerDay: number;
  maxDays: number;
};

export type ApiList<T> = { items: T[]; total: number; page: number; pageSize: number; totalPages: number };

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
  // Phase 20 additions:
  status: "DRAFT" | "PENDING_PAYMENT" | "PENDING_MODERATION" | "APPROVED" | "REJECTED" | "BANNED";
  statusReason: string | null;
  userId: number;
  createdAt: string;
  owner?: ApiOwner | null;
};

// ─────────────────────────── Orders / Payments ──────────────────────────

export type OrderItemKind = "EVENT" | "SPOT" | "HERO" | "ARTICLE" | "SUBSCRIPTION";

export type ApiOrderItem = {
  id: number;
  type: OrderItemKind;
  days: number;
  unitPrice: number;
  subtotal: number;
  eventId: number | null;
  spotId: number | null;
  heroId: number | null;
  articleId: number | null;
  event?: { id: number; title: string; slug: string; poster: string | null; banner: string | null; eventCategory: ApiEventCategory | null } | null;
  spot?: { id: number; title: string; image: string | null } | null;
  hero?: { id: number; title: string; image: string; eventCategory: ApiEventCategory | null } | null;
  article?: { id: number; title: string } | null;
};

export type ApiOrder = {
  id: number;
  userId: number;
  orgId: number | null;
  status: "DRAFT" | "PENDING_PAYMENT" | "PAID" | "FAILED";
  total: number;
  gateway: string | null;
  externalId: string | null;
  items: ApiOrderItem[];
};

export type AddOrderItemInput = {
  type: OrderItemKind;
  days?: number;
  eventId?: number;
  spotId?: number;
  heroId?: number;
  articleId?: number;
};

export type EventsQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
  eventCategory?: string;
  region?: string;
  status?: "DRAFT" | "PENDING_PAYMENT" | "PENDING_MODERATION" | "APPROVED" | "REJECTED" | "BANNED";
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
  switchOrg: (orgId: number, token: string) =>
    request<AuthResponse>('/auth/switch-org', { method: 'POST', body: JSON.stringify({ orgId }) }, token),

  // Contenido
  events: (query: EventsQuery = {}) => request<ApiEventList>(`/events${qs(query)}`),
  event: (slug: string) => request<ApiEvent>(`/events/${slug}`),
  createEvent: (body: CreateEventInput, token: string) =>
    request<ApiEvent>("/events", { method: "POST", body: JSON.stringify(body) }, token),
  myEvents: (token: string) => request<ApiEvent[]>("/events/mine", {}, token),
  // El endpoint unificado /events devuelve todos los estados cuando el token es de admin.
  adminEvents: (token: string, query: EventsQuery = {}) =>
    request<ApiEventList>(`/events${qs(query)}`, {}, token),
  adminPayments: (token: string) =>
    request<ApiPayment[]>("/payments", {}, token),
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
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    let res: Response;
    try {
      res = await fetch(`${apiBase()}/upload`, {
        method: "POST",
        headers,
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
  articleCategories: cache(() => request<ApiArticleCategory[]>("/article-categories")),
  articleTags:     cache(() => request<ApiArticleTag[]>("/article-tags")),
  articles: (query?: { page?: number; pageSize?: number; articleCategory?: string; articleTag?: string }) =>
    request<{ items: ApiArticle[]; total: number; page: number; pageSize: number; totalPages: number }>(
      `/articles${qs(query ?? {})}`
    ),
  article: (slug: string) => request<ApiArticle>(`/articles/${slug}`),
  likeArticle: (id: number, token: string) =>
    request<{ liked: boolean; likes: number }>(`/articles/${id}/like`, { method: "POST" }, token),
  unlikeArticle: (id: number, token: string) =>
    request<{ liked: boolean; likes: number }>(`/articles/${id}/like`, { method: "DELETE" }, token),
  likeStatus: (id: number, token: string) =>
    request<{ liked: boolean; likes: number }>(`/articles/${id}/like`, {}, token),
  regions: (country?: string) => request<ApiRegion[]>(`/states${country ? `?country=${encodeURIComponent(country)}` : ""}`),
  communes: (region?: string) =>
    request<ApiCommune[]>(`/cities${region ? `?state=${encodeURIComponent(region)}` : ""}`),
  heroes: () => request<ApiList<ApiHero>>("/heroes").then((r) => r.items),
  spots:  () => request<ApiList<ApiSpot>>("/spots").then((r) => r.items),

  // Spots
  spotsQuota: () => request<ApiQuota>("/spots/quota"),
  mySpots: (token: string) => request<ApiSpot[]>("/spots/mine", {}, token),
  adminSpots: (token: string, query?: { status?: string; page?: number; pageSize?: number }) =>
    request<ApiList<ApiSpot>>(`/spots${qs(query ?? {})}`, {}, token),
  createSpot: (
    body: { title: string; image?: string; linkType: "URL" | "PHONE" | "EMAIL"; linkValue: string },
    token: string,
  ) => request<ApiSpot>("/spots", { method: "POST", body: JSON.stringify(body) }, token),
  updateSpot: (
    id: number,
    body: { title?: string; image?: string; linkType?: "URL" | "PHONE" | "EMAIL"; linkValue?: string },
    token: string,
  ) => request<ApiSpot>(`/spots/${id}`, { method: "PATCH", body: JSON.stringify(body) }, token),
  deleteSpot: (id: number, token: string) =>
    request<{ deleted: boolean }>(`/spots/${id}`, { method: "DELETE" }, token),
  approveSpot: (id: number, token: string) =>
    request<ApiSpot>(`/spots/${id}/approve`, { method: "PATCH" }, token),
  rejectSpot: (id: number, reason: string, token: string) =>
    request<ApiSpot>(`/spots/${id}/reject`, { method: "PATCH", body: JSON.stringify({ reason }) }, token),
  banSpot: (id: number, reason: string, token: string) =>
    request<ApiSpot>(`/spots/${id}/ban`, { method: "PATCH", body: JSON.stringify({ reason }) }, token),

  // Heroes
  heroesQuota: () => request<ApiQuota>("/heroes/quota"),
  myHeroes: (token: string) => request<ApiHero[]>("/heroes/mine", {}, token),
  adminHeroes: (token: string, query?: { status?: string; page?: number; pageSize?: number }) =>
    request<ApiList<ApiHero>>(`/heroes${qs(query ?? {})}`, {}, token),
  createHero: (
    body: { title: string; titleAccent?: string; lead?: string; image: string; date?: string; place?: string; link?: string; eventCategoryId?: number },
    token: string,
  ) => request<ApiHero>("/heroes", { method: "POST", body: JSON.stringify(body) }, token),
  updateHero: (
    id: number,
    body: { title?: string; titleAccent?: string; lead?: string; image?: string; date?: string; place?: string; link?: string; eventCategoryId?: number },
    token: string,
  ) => request<ApiHero>(`/heroes/${id}`, { method: "PATCH", body: JSON.stringify(body) }, token),
  deleteHero: (id: number, token: string) =>
    request<{ deleted: boolean }>(`/heroes/${id}`, { method: "DELETE" }, token),
  approveHero: (id: number, token: string) =>
    request<ApiHero>(`/heroes/${id}/approve`, { method: "PATCH" }, token),
  rejectHero: (id: number, reason: string, token: string) =>
    request<ApiHero>(`/heroes/${id}/reject`, { method: "PATCH", body: JSON.stringify({ reason }) }, token),
  banHero: (id: number, reason: string, token: string) =>
    request<ApiHero>(`/heroes/${id}/ban`, { method: "PATCH", body: JSON.stringify({ reason }) }, token),

  // ───────── Admin: Users (Phase 25) ─────────
  adminUsers: (token: string) => request<ApiAdminUser[]>("/users", {}, token),
  banUser: (id: number, blocked: boolean, token: string) =>
    request<ApiAdminUser>(`/users/${id}/ban`, { method: "PATCH", body: JSON.stringify({ blocked }) }, token),

  // ───────── FAQ (Phase 25) ─────────
  faqAll: () => request<ApiFaqItem[]>("/faq"),
  faqCreate: (body: { question: string; answer: string; order?: number }, token: string) =>
    request<ApiFaqItem>("/faq", { method: "POST", body: JSON.stringify(body) }, token),
  faqUpdate: (id: number, body: { question?: string; answer?: string; order?: number }, token: string) =>
    request<ApiFaqItem>(`/faq/${id}`, { method: "PATCH", body: JSON.stringify(body) }, token),
  faqRemove: (id: number, token: string) =>
    request<{ deleted?: boolean } | ApiFaqItem>(`/faq/${id}`, { method: "DELETE" }, token),

  // ───────── Audit logs (Phase 25) ─────────
  auditLogs: (query: AuditQuery, token: string) =>
    request<ApiAuditLogList>(`/admin/audit-logs${qs(query as Record<string, string | number | undefined>)}`, {}, token),

  // ───────── Service options (Phase 25) ─────────
  photoOptions: () => request<ApiServiceOption[]>("/services/photography/options"),
  creatorOptions: () => request<ApiServiceOption[]>("/services/content-creators/options"),
  createPhotoOption: (body: { label: string }, token: string) =>
    request<ApiServiceOption>("/services/photography/options", { method: "POST", body: JSON.stringify(body) }, token),
  updatePhotoOption: (id: number, body: { label?: string }, token: string) =>
    request<ApiServiceOption>(`/services/photography/options/${id}`, { method: "PATCH", body: JSON.stringify(body) }, token),
  deletePhotoOption: (id: number, token: string) =>
    request<{ deleted?: boolean } | ApiServiceOption>(`/services/photography/options/${id}`, { method: "DELETE" }, token),
  createCreatorOption: (body: { label: string }, token: string) =>
    request<ApiServiceOption>("/services/content-creators/options", { method: "POST", body: JSON.stringify(body) }, token),
  updateCreatorOption: (id: number, body: { label?: string }, token: string) =>
    request<ApiServiceOption>(`/services/content-creators/options/${id}`, { method: "PATCH", body: JSON.stringify(body) }, token),
  deleteCreatorOption: (id: number, token: string) =>
    request<{ deleted?: boolean } | ApiServiceOption>(`/services/content-creators/options/${id}`, { method: "DELETE" }, token),

  // ───────── Contact / Inbox (Phase 26) ─────────
  contactAll: (token: string) =>
    request<ApiContactMessage[]>('/contact', {}, token),
  contactMarkRead: (id: number, token: string) =>
    request<ApiContactMessage>(`/contact/${id}/read`, { method: 'PATCH', body: JSON.stringify({ read: true }) }, token),
  contactRemove: (id: number, token: string) =>
    request<{ deleted: boolean }>(`/contact/${id}`, { method: 'DELETE' }, token),

  // ───────── CRM (Phase 26) ─────────
  crmAll: (token: string) =>
    request<ApiCrmList>('/crm?limit=50', {}, token),
  crmGet: (id: number, token: string) =>
    request<ApiCrmEntry>(`/crm/${id}`, {}, token),
  crmNotes: (id: number, token: string) =>
    request<ApiCrmNote[]>(`/crm/${id}/notes`, {}, token),
  crmAddNote: (id: number, content: string, token: string) =>
    request<ApiCrmNote>(`/crm/${id}/notes`, { method: 'POST', body: JSON.stringify({ content }) }, token),
  crmSetStage: (id: number, stage: CrmStage, token: string, stageReason?: string) =>
    request<ApiCrmEntry>(`/crm/${id}/stage`, { method: 'PATCH', body: JSON.stringify(stageReason ? { stage, stageReason } : { stage }) }, token),

  // ───────── Subscriptions (Phase 26) ─────────
  subscriptions: (token: string) =>
    request<ApiSubscriptionList>('/subscriptions?limit=50', {}, token),

  // Settings / Stats (no token required)
  settingsPublic: () => request<Record<string, string>>("/settings/public"),
  statsPublic:    () => request<{ approvedEvents: number; organizers: number }>("/stats/public"),

  // Orders (require user JWT)
  ordersDraft:    (token: string) => request<ApiOrder>("/orders/draft", {}, token),
  getOrder:       (id: number, token: string) => request<ApiOrder>(`/orders/${id}`, {}, token),
  addOrderItem:   (orderId: number, body: AddOrderItemInput, token: string) =>
    request<ApiOrder>(`/orders/${orderId}/items`, { method: "PUT", body: JSON.stringify(body) }, token),
  removeOrderItem: (orderId: number, type: OrderItemKind, token: string) =>
    request<ApiOrder>(`/orders/${orderId}/items/${type}`, { method: "DELETE" }, token),

  // Payments (require user JWT)
  checkout:       (orderId: number, gateway: "TRANSBANK", token: string) =>
    request<{ redirectUrl: string; externalId: string }>(`/payments/${orderId}/checkout`, { method: "POST", body: JSON.stringify({ gateway }) }, token),
};

// ───────────────────────────── Mappers ──────────────────────────

function initialsOf(name: string | null | undefined, email: string): string {
  const fromName = (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (fromName) return fromName;
  // Fallback: primeras 2 letras de la parte local del email
  return (email.split("@")[0] ?? email).slice(0, 2).toUpperCase() || "?";
}

/** Mapea el usuario de la API al shape de User que usa el website. */
export function toUser(u: ApiUser): User {
  const name = [u.firstname, u.lastname].filter(Boolean).join(" ");
  return {
    id: u.id,
    name: name || u.email,
    email: u.email,
    phone: "",
    initials: initialsOf(name, u.email),
    role: u.role,
    type: u.type,
    handle: u.handle,
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
