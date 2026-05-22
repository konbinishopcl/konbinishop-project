"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

// ─── Types ─────────────────────────────────────────────────────────────────

/** Imagen seleccionada pero aún no subida a la API. */
export type PendingImage = { kind: "pending"; file: File; preview: string };
/** Imagen ya subida (URL del servidor). */
export type UploadedImage = { kind: "uploaded"; url: string };
/** Un slot de imagen: vacío, pendiente o ya subida. */
export type ImageSlot = PendingImage | UploadedImage | null;

export type Price = { name: string; amount: string };
export type DateRow = { date: string; start?: string; end?: string };
export type FieldErrors = Record<string, string>;

export type FormValues = {
  title: string;
  company: string;
  categoryId: string;
  desc: string;
  about: string;
  free: boolean;
  prices: Price[];
  dates: DateRow[];
  regionId: string;
  communeId: string;
  address: string;
  addressNumber: string;
  web: string;
  socials: string[];
  videos: string[];
  // Imágenes en memoria — NO se persisten en localStorage
  banner: ImageSlot;
  poster: ImageSlot;
  gallery: ImageSlot[];
};

export type UpdateFn = <K extends keyof FormValues>(k: K, v: FormValues[K]) => void;

// ─── Helpers de validación ─────────────────────────────────────────────────

export const MIN_PRICE = 500;
export const MIN_TITLE_LEN = 3;

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isValidUrl(value: string): boolean {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// ─── LocalStorage — solo campos de texto/primitivos ────────────────────────

const DRAFT_KEY = "konbini_crear_draft";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type PersistableDraft = Omit<FormValues, "banner" | "poster" | "gallery">;

const EMPTY: FormValues = {
  title: "",
  company: "",
  categoryId: "",
  desc: "",
  about: "",
  free: false,
  prices: [{ name: "Entrada General", amount: "" }],
  dates: [{ date: "", start: "", end: "" }],
  regionId: "",
  communeId: "",
  address: "",
  addressNumber: "",
  web: "",
  socials: [""],
  videos: [""],
  banner: null,
  poster: null,
  gallery: [],
};

function loadDraft(): FormValues {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return EMPTY;
    const saved = JSON.parse(raw) as PersistableDraft;
    return { ...EMPTY, ...saved, banner: null, poster: null, gallery: [] };
  } catch {
    return EMPTY;
  }
}

function saveDraft(v: FormValues) {
  if (typeof window === "undefined") return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { banner: _b, poster: _p, gallery: _g, ...rest } = v;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(rest));
  } catch {}
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
}

export function hasSavedDraft(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw) as Partial<PersistableDraft>;
    return !!(d.title || d.desc || d.address);
  } catch { return false; }
}

// ─── Context ───────────────────────────────────────────────────────────────

type Ctx = {
  values: FormValues;
  update: UpdateFn;
  fieldErrors: FieldErrors;
  setFieldErrors: Dispatch<SetStateAction<FieldErrors>>;
  resetForm: () => void;
};

const FormCtx = createContext<Ctx | null>(null);

export function FormProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Hidratar desde localStorage una sola vez en el cliente
  useEffect(() => {
    setValues(loadDraft());
    setHydrated(true);
  }, []);

  // Persistir al cambiar (después de hidratación)
  useEffect(() => {
    if (hydrated) saveDraft(values);
  }, [values, hydrated]);

  const update: UpdateFn = useCallback(<K extends keyof FormValues>(k: K, v: FormValues[K]) => {
    setValues((d) => ({ ...d, [k]: v }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[k as string];
      if (k === "prices")  Object.keys(next).filter((x) => x.startsWith("price_")).forEach((x) => delete next[x]);
      if (k === "dates")   Object.keys(next).filter((x) => x.startsWith("date_") || x === "dates").forEach((x) => delete next[x]);
      if (k === "socials") Object.keys(next).filter((x) => x.startsWith("social_")).forEach((x) => delete next[x]);
      if (k === "videos")  Object.keys(next).filter((x) => x.startsWith("video_")).forEach((x) => delete next[x]);
      return next;
    });
  }, []);

  const resetForm = useCallback(() => {
    clearDraft();
    setValues(EMPTY);
    setFieldErrors({});
  }, []);

  // Durante hidratación no renderizamos nada para evitar flash vacío→borrador
  if (!hydrated) return null;

  return (
    <FormCtx.Provider value={{ values, update, fieldErrors, setFieldErrors, resetForm }}>
      {children}
    </FormCtx.Provider>
  );
}

export function useForm() {
  const ctx = useContext(FormCtx);
  if (!ctx) throw new Error("useForm debe usarse dentro de FormProvider");
  return ctx;
}
