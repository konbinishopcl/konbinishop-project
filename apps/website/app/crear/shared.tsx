"use client";

import { useEffect, type RefObject } from "react";

// ─── Helpers puros ────────────────────────────────────────────────────────────

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Bloquea en el teclado todo lo que no sea dígito ni tecla de control */
export const onlyDigits = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const nav = ["Backspace", "Tab", "Delete", "ArrowLeft", "ArrowRight", "Home", "End", "Enter"];
  if (!nav.includes(e.key) && !/^\d$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
  }
};

/** Bloquea la tecla espacio (las URLs no tienen espacios) */
export const noSpaces = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === " ") e.preventDefault();
};

/**
 * Combina el onChange de RHF con limpieza de espacios.
 * Úsalo así:
 *   const reg = register("web");
 *   <input {...reg} onChange={urlChange(reg.onChange)} />
 */
export function urlChange(
  rhfOnChange: React.ChangeEventHandler<HTMLInputElement>,
): React.ChangeEventHandler<HTMLInputElement> {
  return (e) => {
    // Elimina cualquier espacio que pudiera colarse (p. ej. al pegar)
    if (e.target.value.includes(" ")) {
      e.target.value = e.target.value.replace(/\s+/g, "");
    }
    rhfOnChange(e);
  };
}

// ─── Componentes compartidos ──────────────────────────────────────────────────

export function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <div style={{ color: "var(--err)", fontSize: 12, marginTop: 5 }}>{msg}</div>;
}

// ─── Hooks compartidos ────────────────────────────────────────────────────────

/** Oculta el header al hacer scroll hacia abajo, lo muestra al subir */
export function useHeadroom(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const fn = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const el = ref.current;
        if (el) {
          if (y < 80) el.classList.remove("headroom--hidden");
          else if (y - lastY > 4) el.classList.add("headroom--hidden");
          else if (lastY - y > 4) el.classList.remove("headroom--hidden");
        }
        lastY = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
