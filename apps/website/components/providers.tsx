"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@/lib/data";

type Theme = "dark" | "light";

/* ───────────────── theme ───────────────── */
const ThemeCtx = createContext<{ theme: Theme; setTheme: (t: Theme) => void } | null>(null);

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("kb-theme") as Theme | null;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("kb-theme", theme);
  }, [theme]);

  return <ThemeCtx.Provider value={{ theme, setTheme }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme debe usarse dentro de <Providers>");
  return ctx;
}

/* ───────────────── user ───────────────── */
const UserCtx = createContext<{ user: User | null; setUser: (u: User | null) => void } | null>(null);

function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("kb-user");
      if (raw && raw !== "null") setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("kb-user", JSON.stringify(user));
  }, [user]);

  return <UserCtx.Provider value={{ user, setUser }}>{children}</UserCtx.Provider>;
}

export function useUser() {
  const ctx = useContext(UserCtx);
  if (!ctx) throw new Error("useUser debe usarse dentro de <Providers>");
  return ctx;
}

/* ───────────────── wrapper ───────────────── */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <UserProvider>{children}</UserProvider>
    </ThemeProvider>
  );
}
