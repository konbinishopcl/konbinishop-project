// Cliente HTTP de la API de Konbini.
import type { Role, User } from "./data";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";

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

export const api = {
  register: (body: { email: string; password: string; firstname: string; lastname: string }) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: (token: string) => request<ApiUser>("/auth/me", {}, token),
};

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
