"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser } from "@/components/providers";
import { api, imageUrl } from "@/lib/api";

// ── URL validator ─────────────────────────────────────────────────────────────

function validUrl(raw: string): boolean {
  if (!raw.trim()) return true;
  try {
    const u = new URL(/^https?:\/\//.test(raw) ? raw : `https://${raw}`);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch { return false; }
}

// ── Zod schema ────────────────────────────────────────────────────────────────

const dashEventSchema = z
  .object({
    title:         z.string().min(1, "El título es requerido"),
    company:       z.string().max(100, "Máx 100 caracteres"),
    description:   z.string(),
    about:         z.string(),
    address:       z.string(),
    addressNumber: z.string(),
    ticketUrl:     z.string().refine((v) => !v.trim() || validUrl(v), "Ingresa una URL válida"),
    categoryId:    z.string(),
    countrySlug:   z.string(),
    stateSlug:     z.string(),
    cityId:        z.string(),
    isFree:        z.boolean(),
    prices:        z.array(z.object({
      name:   z.string(),
      amount: z.number({ error: "Ingresa un monto" }).optional(),
    })),
    dates:   z.array(z.object({
      date:      z.string(),
      startTime: z.string(),
      endTime:   z.string(),
    })),
    socials: z.array(z.object({ link: z.string() })),
    videos:  z.array(z.object({ link: z.string() })),
    status:      z.enum(["APPROVED", "PENDING_MODERATION", "DRAFT"]),
    organizerId: z.string(),
  })
  .superRefine((val, ctx) => {
    // Título: mínimo 3 cuando tiene contenido
    if (val.title.trim().length > 0 && val.title.trim().length < 3) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Mínimo 3 caracteres", path: ["title"] });
    }

    // Validaciones estrictas solo al publicar / enviar a revisión
    if (val.status !== "DRAFT") {
      if (val.description.trim().length < 10) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Mínimo 10 caracteres al publicar", path: ["description"] });
      }
      if (!val.address.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La dirección es requerida al publicar", path: ["address"] });
      }
    }

    // Precios cuando no es gratuito
    if (!val.isFree) {
      val.prices.forEach((p, i) => {
        if (!p.name.trim()) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Nombre de tarifa requerido", path: ["prices", i, "name"] });
        }
        if (p.amount === undefined || isNaN(p.amount)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ingresa un monto", path: ["prices", i, "amount"] });
        }
      });
    }

    // Validación cruzada de horarios
    val.dates.forEach((d, i) => {
      if (d.startTime && d.endTime && d.endTime <= d.startTime) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Hora término debe ser posterior al inicio", path: ["dates", i, "endTime"] });
      }
    });

    // URLs redes sociales
    val.socials.forEach((s, i) => {
      if (s.link.trim() && !validUrl(s.link)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "URL no válida", path: ["socials", i, "link"] });
      }
    });

    // URLs videos
    val.videos.forEach((v, i) => {
      if (v.link.trim() && !validUrl(v.link)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "URL no válida (debe incluir https://)", path: ["videos", i, "link"] });
      }
    });
  });

type DashEventValues = z.infer<typeof dashEventSchema>;

// ── Catalog types ─────────────────────────────────────────────────────────────

type Category = { id: number; name: string; slug: string };
type Country  = { id: number; name: string; slug: string };
type State    = { id: number; name: string; slug: string };
type City     = { id: number; name: string };
type OrgUser  = { id: number; firstname: string | null; lastname: string | null; email: string; handle: string | null };

// ── Image slot (outside RHF — file objects not serializable) ──────────────────

type ImageSlot = { file: File | null; url: string };

// ── InitialEvent exported type ─────────────────────────────────────────────────

export type InitialEvent = {
  id:              number;
  title:           string;
  company:         string | null;
  description:     string;
  about:           string | null;
  address:         string;
  addressNumber:   string | null;
  ticketUrl:       string | null;
  banner:          string | null;
  poster:          string | null;
  gallery?:        string[];
  categoryId:      number | null;      // legacy — backend lo sigue devolviendo durante la transición
  eventCategoryId: number | null;      // Phase 18+ — se prefiere sobre categoryId
  cityId:          number | null;
  status:          string;
  prices:          { name: string; price: number }[];
  dates:           { date: string | null; startTime: string | null; endTime: string | null }[];
  socialLinks:     { link: string | null }[];
  videos:          { link: string | null }[];
  city?: { id: number; name: string; state?: { id: number; slug: string; country?: { slug: string } } } | null;
};

interface Props {
  mode:     "create" | "edit";
  initial?: InitialEvent;
}

// ── FieldError ─────────────────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <div style={{ color: "var(--err)", fontSize: 12, marginTop: 5 }}>{msg}</div>;
}

// ── AccItem ────────────────────────────────────────────────────────────────────

function AccItem({
  n, title, meta, open, onToggle, children,
}: {
  n: string; title: string; meta?: string;
  open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className={`form-acc-item${open ? " open" : ""}`}>
      <div className="form-acc-head" onClick={onToggle}>
        <span className="num">{n}</span>
        <span className="ti">{title}</span>
        {meta && <span className="meta">{meta}</span>}
        <span className="chev">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </span>
      </div>
      {open && <div className="form-acc-body">{children}</div>}
    </div>
  );
}

// ── ImageUploadBox ─────────────────────────────────────────────────────────────

function ImageUploadBox({
  variant, slot, onPick, onRemove, label, hint,
}: {
  variant: "banner" | "poster" | "gallery";
  slot: ImageSlot;
  onPick: (file: File) => void;
  onRemove: () => void;
  label: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const previewSrc = slot.file
    ? URL.createObjectURL(slot.file)
    : slot.url ? imageUrl(slot.url) : "";

  useEffect(() => {
    if (!slot.file) return;
    const u = URL.createObjectURL(slot.file);
    return () => URL.revokeObjectURL(u);
  }, [slot.file]);

  if (previewSrc) {
    const aspect = variant === "poster" ? "3/4" : variant === "gallery" ? "1/1" : "16/9";
    return (
      <div style={{ position: "relative", aspectRatio: aspect, borderRadius: "var(--r)", overflow: "hidden", background: "var(--surface-2)" }}>
        <img src={previewSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <button type="button" onClick={onRemove} aria-label="Eliminar imagen" className="icon-btn"
          style={{ position: "absolute", top: 8, right: 8, width: 32, height: 32, background: "rgba(15,12,10,.75)", color: "#fff", borderColor: "rgba(255,255,255,.15)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
    );
  }

  const boxClass = variant === "poster" ? "upload-box tall" : "upload-box";
  const extraStyle = variant === "gallery" ? { aspectRatio: "1/1" as const, padding: 14 } : undefined;

  return (
    <>
      <div className={boxClass} style={extraStyle} onClick={() => inputRef.current?.click()}>
        <div className="ic" style={variant === "gallery" ? { width: 28, height: 28 } : undefined}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
        </div>
        <div style={{ fontWeight: 500, color: "var(--ink-2)", fontSize: variant === "gallery" ? 12 : 14 }}>{label}</div>
        {hint && <small style={{ fontSize: variant === "gallery" ? 10 : 11 }}>{hint}</small>}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }}
      />
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function EventForm({ mode, initial }: Props) {
  const router  = useRouter();
  const { token, user } = useUser();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const [busy, setBusy] = useState(false);

  // Catalog data
  const [categories, setCategories] = useState<Category[]>([]);
  const [countries,  setCountries]  = useState<Country[]>([]);
  const [states,     setStates]     = useState<State[]>([]);
  const [cities,     setCities]     = useState<City[]>([]);
  const [orgUsers,   setOrgUsers]   = useState<OrgUser[]>([]);

  // Image state (outside RHF — File objects not serializable)
  const [banner,  setBanner]  = useState<ImageSlot>({ file: null, url: initial?.banner  ?? "" });
  const [poster,  setPoster]  = useState<ImageSlot>({ file: null, url: initial?.poster  ?? "" });
  const [gallery, setGallery] = useState<ImageSlot[]>(
    Array(8).fill(null).map((_, i) => ({ file: null, url: initial?.gallery?.[i] ?? "" }))
  );
  const updateGallerySlot = (i: number, slot: ImageSlot) =>
    setGallery((g) => g.map((s, j) => j === i ? slot : s));

  // Accordion open state
  const [open, setOpen] = useState<Record<number, boolean>>({ 1: true });
  const toggle = (n: number) => setOpen((o) => ({ ...o, [n]: !o[n] }));

  // ── RHF ────────────────────────────────────────────────────────────────────

  let initStatus: DashEventValues["status"] = "PENDING_MODERATION";
  if (initial?.status === "APPROVED")              initStatus = "APPROVED";
  else if (initial?.status === "DRAFT")            initStatus = "DRAFT";

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DashEventValues>({
    resolver: zodResolver(dashEventSchema),
    mode: "onTouched",
    defaultValues: {
      title:         initial?.title         ?? "",
      company:       initial?.company       ?? "",
      description:   initial?.description   ?? "",
      about:         initial?.about         ?? "",
      address:       initial?.address       ?? "",
      addressNumber: initial?.addressNumber ?? "",
      ticketUrl:     initial?.ticketUrl     ?? "",
      categoryId:    (initial?.eventCategoryId ?? initial?.categoryId) != null ? String(initial?.eventCategoryId ?? initial?.categoryId) : "",
      countrySlug:   initial?.city?.state?.country?.slug ?? "",
      stateSlug:     initial?.city?.state?.slug          ?? "",
      cityId:        initial?.cityId != null ? String(initial.cityId) : "",
      isFree:        initial ? (initial.prices.length === 0 || initial.prices[0]?.price === 0) : false,
      prices: initial?.prices.length
        ? initial.prices.map((p) => ({ name: p.name, amount: p.price }))
        : [{ name: "General", amount: undefined }],
      dates: initial?.dates.length
        ? initial.dates.map((d) => ({
            date:      d.date ? d.date.slice(0, 10) : "",
            startTime: d.startTime ?? "",
            endTime:   d.endTime   ?? "",
          }))
        : [{ date: "", startTime: "", endTime: "" }],
      socials: initial?.socialLinks.length
        ? initial.socialLinks.map((l) => ({ link: l.link ?? "" }))
        : [{ link: "" }],
      videos: initial?.videos.length
        ? initial.videos.map((v) => ({ link: v.link ?? "" }))
        : [{ link: "" }],
      status:      initStatus,
      organizerId: "",
    },
  });

  const { fields: priceFields, append: addPrice, remove: removePrice } =
    useFieldArray({ control, name: "prices" });
  const { fields: dateFields, append: addDate, remove: removeDate } =
    useFieldArray({ control, name: "dates" });
  const { fields: socialFields, append: addSocial, remove: removeSocial } =
    useFieldArray({ control, name: "socials" });
  const { fields: videoFields, append: addVideo, remove: removeVideo } =
    useFieldArray({ control, name: "videos" });

  const isFree       = watch("isFree");
  const watchStatus  = watch("status");
  const watchTitle   = watch("title");
  const watchAddress = watch("address");
  const watchSocials = watch("socials");

  // ── Catalog cascade ────────────────────────────────────────────────────────

  const fetchCatalog = useCallback(async () => {
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    const [cats, ctrs] = await Promise.all([
      fetch("/api/event-categories", { headers: h }).then((r) => r.json()).catch(() => []),
      fetch("/api/countries",        { headers: h }).then((r) => r.json()).catch(() => []),
    ]);
    setCategories(Array.isArray(cats) ? cats : []);
    setCountries(Array.isArray(ctrs) ? ctrs : []);
  }, [token]);
  useEffect(() => { fetchCatalog(); }, [fetchCatalog]);

  const watchCountrySlug = watch("countrySlug");
  const watchStateSlug   = watch("stateSlug");

  // Auto-selecciona el país cuando hay uno solo y el formulario no tiene país (creación)
  useEffect(() => {
    if (countries.length === 1 && !watchCountrySlug) {
      setValue("countrySlug", countries[0].slug);
    }
  }, [countries, watchCountrySlug, setValue]);

  useEffect(() => {
    if (!token || !watchCountrySlug) { setStates([]); return; }
    fetch(`/api/states?country=${encodeURIComponent(watchCountrySlug)}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()).then((d) => setStates(Array.isArray(d) ? d : [])).catch(() => setStates([]));
  }, [token, watchCountrySlug]);

  useEffect(() => {
    if (!token || !watchStateSlug) { setCities([]); return; }
    fetch(`/api/cities?state=${encodeURIComponent(watchStateSlug)}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()).then((d) => setCities(Array.isArray(d) ? d : [])).catch(() => setCities([]));
  }, [token, watchStateSlug]);

  useEffect(() => {
    if (!token || !isAdmin) return;
    fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setOrgUsers(Array.isArray(d) ? d : []))
      .catch(() => setOrgUsers([]));
  }, [token, isAdmin]);

  // ── onSubmit ───────────────────────────────────────────────────────────────

  const onSubmit = async (values: DashEventValues) => {
    if (!token) { toast.error("No autenticado"); return; }
    setBusy(true);
    try {
      // 1) Upload pending images
      let bannerUrl = banner.url;
      if (banner.file) {
        const r = await api.uploadImage(banner.file, token);
        bannerUrl = r.url;
        setBanner({ file: null, url: r.url });
      }

      let posterUrl = poster.url;
      if (poster.file) {
        const r = await api.uploadImage(poster.file, token);
        posterUrl = r.url;
        setPoster({ file: null, url: r.url });
      }

      const galleryUrls: string[] = [];
      const newGallery = [...gallery];
      for (let i = 0; i < gallery.length; i++) {
        const g = gallery[i];
        if (g.file) {
          const r = await api.uploadImage(g.file, token);
          newGallery[i] = { file: null, url: r.url };
          galleryUrls.push(r.url);
        } else if (g.url) {
          galleryUrls.push(g.url);
        }
      }
      setGallery(newGallery);

      // 2) Build payload
      const payload = {
        title:         values.title.trim(),
        company:       values.company.trim()       || undefined,
        description:   values.description.trim(),
        about:         values.about.trim()         || undefined,
        address:       values.address.trim(),
        addressNumber: values.addressNumber.trim() || undefined,
        ticketUrl:     values.ticketUrl.trim()     || undefined,
        banner:        bannerUrl                   || undefined,
        poster:        posterUrl                   || undefined,
        gallery:       galleryUrls.length ? galleryUrls : undefined,
        eventCategoryId: values.categoryId ? Number(values.categoryId) : undefined,
        cityId:          values.cityId     ? Number(values.cityId)     : undefined,

        prices: values.isFree
          ? [{ name: "Entrada", price: 0 }]
          : values.prices
              .filter((p) => p.amount !== undefined)
              .map((p) => ({ name: p.name || "General", price: p.amount! })),

        dates: values.dates
          .filter((d) => d.date)
          .map((d) => ({
            date:      d.date,
            startTime: d.startTime || undefined,
            endTime:   d.endTime   || undefined,
          })),

        socialLinks: values.socials.filter((s) => s.link.trim()).map((s) => ({ link: s.link.trim() })),
        videos:      values.videos .filter((v) => v.link.trim()).map((v) => ({ link: v.link.trim() })),
      };

      // 3) Submit to backend
      const url    = mode === "create" ? "/api/events" : `/api/events/${initial!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const r = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? "Error al guardar");
      }

      const saved = await r.json() as { id: number; status?: string };

      // 4) Approve explicitly if admin requested APPROVED
      const targetStatus = values.status;
      if (targetStatus === "APPROVED" && saved.status !== "APPROVED") {
        await fetch(`/api/events/${saved.id}/approve`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      toast.success(mode === "create" ? "Evento creado" : "Evento actualizado", {
        description:
          targetStatus === "APPROVED"             ? "Publicado directamente"
          : targetStatus === "PENDING_MODERATION" ? "En revisión"
          :                                         "Guardado como borrador",
      });
      router.push("/dashboard/events");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al guardar");
    } finally {
      setBusy(false);
    }
  };

  // ── CTA label ──────────────────────────────────────────────────────────────

  const ctaLabel = busy
    ? "Guardando…"
    : mode === "create"
      ? watchStatus === "APPROVED"             ? "Crear y publicar →"
        : watchStatus === "PENDING_MODERATION" ? "Crear en revisión →"
        :                                        "Crear borrador →"
      : watchStatus === "APPROVED"             ? "Guardar y publicar →"
        : watchStatus === "PENDING_MODERATION" ? "Guardar en revisión →"
        :                                        "Guardar borrador →";

  // Accordion meta subtitles
  const meta1 = watchTitle.trim()
    ? `· "${watchTitle.trim().slice(0, 28)}${watchTitle.trim().length > 28 ? "…" : ""}"`
    : "Título, categoría, descripción";
  const meta2 = watchAddress.trim() ? `· ${watchAddress.trim().slice(0, 28)}` : "Cuándo y dónde";
  const meta3 = (banner.url || banner.file || poster.url || poster.file)
    ? `· ${[banner.url || banner.file, poster.url || poster.file].filter(Boolean).length} archivo(s)`
    : "Banner, poster, galería";
  const meta4 = watchSocials?.some((s) => s.link.trim()) ? "· con enlaces" : "Opcional";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>

      {/* Back link */}
      <Link href="/dashboard/events" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink-3)", fontSize: 13, marginBottom: 18 }}>
        ◀ Volver a eventos
      </Link>

      {/* ── Admin panel ───────────────────────────────────────────────────── */}
      {isAdmin && (
        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="grid-2">
            <div className="field" style={{ margin: 0 }}>
              <label>Asignar a organizador <span style={{ color: "var(--err)" }}>*</span></label>
              <select {...register("organizerId")}>
                <option value="">Selecciona una cuenta…</option>
                {orgUsers.map((u) => {
                  const name = [u.firstname, u.lastname].filter(Boolean).join(" ") || u.email;
                  const handle = u.handle ? ` (@${u.handle})` : ` (${u.email})`;
                  return <option key={u.id} value={u.id}>{name}{handle}</option>;
                })}
              </select>
              <div className="help">El evento se publicará bajo esta cuenta como organizador.</div>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Estado al guardar</label>
              <select {...register("status")}>
                <option value="APPROVED">Publicado (directo)</option>
                <option value="PENDING_MODERATION">En revisión</option>
                <option value="DRAFT">Borrador</option>
              </select>
              <div className="help">Como admin puedes publicar de inmediato sin pasar por revisión.</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Accordion ─────────────────────────────────────────────────────── */}
      <div className="form-acc">

        {/* 1 — Información básica */}
        <AccItem n="1" title="Información básica" meta={meta1} open={!!open[1]} onToggle={() => toggle(1)}>

          <div className="field">
            <label>Título del evento <span style={{ color: "var(--err)" }}>*</span></label>
            <input type="text" placeholder="Ej: Anime Crunchyroll Fest 2025" maxLength={200} {...register("title")} />
            <FieldError msg={errors.title?.message} />
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Categoría</label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <select value={field.value} onChange={field.onChange} onBlur={field.onBlur} ref={field.ref}>
                    <option value="">Sin categoría</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              />
              <FieldError msg={errors.categoryId?.message} />
            </div>
            <div className="field">
              <label>Empresa organizadora (texto público)</label>
              <input type="text" placeholder="Ej: Productora 8U, Cinépolis Chile" {...register("company")} />
              <FieldError msg={errors.company?.message} />
            </div>
          </div>

          <div className="field">
            <label>Descripción corta <span style={{ color: "var(--err)" }}>*</span></label>
            <textarea rows={3} placeholder="Aparece en la card del evento. Mínimo 10 caracteres al publicar." {...register("description")} />
            <FieldError msg={errors.description?.message} />
          </div>

          <div className="field">
            <label>Sobre el evento (texto completo)</label>
            <textarea rows={6} placeholder="Descripción larga que aparece en el detalle del evento." {...register("about")} />
            <FieldError msg={errors.about?.message} />
          </div>

          {/* Precio */}
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Precio</label>
            <Controller
              control={control}
              name="isFree"
              render={({ field }) => (
                <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none", marginBottom: field.value ? 0 : 14 }}
                  onClick={() => {
                    const next = !field.value;
                    field.onChange(next);
                    if (next) priceFields.forEach((_, i) => setValue(`prices.${i}.amount`, 0));
                  }}
                >
                  <span style={{
                    width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                    border: "2px solid var(--line)",
                    background: field.value ? "var(--accent)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {field.value && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </span>
                  <span style={{ fontSize: 14 }}>Evento gratuito</span>
                </div>
              )}
            />

            {!isFree && (
              <div style={{ marginTop: 12 }}>
                {priceFields.map((field, i) => (
                  <div className="price-row" key={field.id}>
                    <div className="field" style={{ margin: 0 }}>
                      <label>Nombre de tarifa</label>
                      <input type="text" placeholder="Ej: General, VIP, Estudiante" {...register(`prices.${i}.name`)} />
                      <FieldError msg={errors.prices?.[i]?.name?.message} />
                    </div>
                    <div className="field" style={{ margin: 0 }}>
                      <label>Precio</label>
                      <div className="input-prefix">
                        <span>$</span>
                        <input type="number" inputMode="numeric" min="0" placeholder="0"
                          {...register(`prices.${i}.amount`, { valueAsNumber: true })} />
                        <span className="suffix">CLP</span>
                      </div>
                      <FieldError msg={errors.prices?.[i]?.amount?.message} />
                    </div>
                    <div style={{ display: "flex", alignItems: "end" }}>
                      {priceFields.length > 1 && (
                        <button type="button" className="icon-btn" aria-label="Eliminar" onClick={() => removePrice(i)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button type="button" className="add-line"
                  onClick={() => addPrice({ name: "", amount: undefined as unknown as number })}>
                  + Agregar otra tarifa
                </button>
              </div>
            )}
          </div>
        </AccItem>

        {/* 2 — Fechas, horarios y ubicación */}
        <AccItem n="2" title="Fechas, horarios y ubicación" meta={meta2} open={!!open[2]} onToggle={() => toggle(2)}>

          {dateFields.map((field, i) => (
            <div key={field.id} style={{ marginBottom: 14 }}>
              <div className="grid-3">
                <div className="field" style={{ margin: 0 }}>
                  <label>Fecha {i > 0 ? `(día ${i + 1})` : ""}</label>
                  <input type="date" {...register(`dates.${i}.date`)} />
                  <FieldError msg={errors.dates?.[i]?.date?.message} />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>Hora inicio</label>
                  <input type="time" {...register(`dates.${i}.startTime`)} />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>Hora término</label>
                  <input type="time" {...register(`dates.${i}.endTime`)} />
                  <FieldError msg={errors.dates?.[i]?.endTime?.message} />
                </div>
              </div>
              {dateFields.length > 1 && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                  <button type="button" className="icon-btn" aria-label="Eliminar" onClick={() => removeDate(i)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              )}
            </div>
          ))}
          <button type="button" className="add-line" onClick={() => addDate({ date: "", startTime: "", endTime: "" })} style={{ marginBottom: 18 }}>
            + Agregar otra función
          </button>

          <div className="grid-3">
            <div className="field">
              <label>País</label>
              <Controller
                control={control}
                name="countrySlug"
                render={({ field }) => (
                  <select value={field.value} onBlur={field.onBlur} ref={field.ref}
                    onChange={(e) => { field.onChange(e.target.value); setValue("stateSlug", ""); setValue("cityId", ""); }}>
                    <option value="">Selecciona país…</option>
                    {countries.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
                  </select>
                )}
              />
            </div>
            <div className="field">
              <label>Región / División</label>
              <Controller
                control={control}
                name="stateSlug"
                render={({ field }) => (
                  <select value={field.value} onBlur={field.onBlur} ref={field.ref}
                    disabled={!watchCountrySlug || states.length === 0}
                    onChange={(e) => { field.onChange(e.target.value); setValue("cityId", ""); }}>
                    <option value="">Selecciona región…</option>
                    {states.map((s) => <option key={s.id} value={s.slug}>{s.name}</option>)}
                  </select>
                )}
              />
            </div>
            <div className="field">
              <label>Ciudad</label>
              <select disabled={!watchStateSlug || cities.length === 0} {...register("cityId")}>
                <option value="">Selecciona ciudad…</option>
                {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Dirección completa</label>
            <input type="text" placeholder="Av. Providencia 1234, Providencia, Santiago" {...register("address")} />
            <FieldError msg={errors.address?.message} />
          </div>

          <div className="field">
            <label>Número / Piso</label>
            <input type="text" placeholder="Of. 201, piso 3…" {...register("addressNumber")} />
            <FieldError msg={errors.addressNumber?.message} />
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label>URL de venta de entradas (externa)</label>
            <Controller
              control={control}
              name="ticketUrl"
              render={({ field }) => (
                <div className="input-prefix">
                  <span>https://</span>
                  <input
                    type="text"
                    placeholder="ticketmaster.com/tu-evento"
                    value={field.value.replace(/^https?:\/\//i, "")}
                    onBlur={field.onBlur}
                    onChange={(e) =>
                      field.onChange(e.target.value ? `https://${e.target.value.replace(/^https?:\/\//i, "")}` : "")
                    }
                  />
                </div>
              )}
            />
            <FieldError msg={errors.ticketUrl?.message} />
          </div>
        </AccItem>

        {/* 3 — Multimedia */}
        <AccItem n="3" title="Multimedia" meta={meta3} open={!!open[3]} onToggle={() => toggle(3)}>

          <div className="upload-grid" style={{ marginBottom: 18 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: "block" }}>Banner (16:9)</label>
              <ImageUploadBox variant="banner" slot={banner}
                onPick={(f) => setBanner({ file: f, url: banner.url })}
                onRemove={() => setBanner({ file: null, url: "" })}
                label="Sube una imagen horizontal" hint="JPG / PNG · 2400×1350 · sin texto" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: "block" }}>Poster (2:3)</label>
              <ImageUploadBox variant="poster" slot={poster}
                onPick={(f) => setPoster({ file: f, url: poster.url })}
                onRemove={() => setPoster({ file: null, url: "" })}
                label="Poster oficial" hint="JPG / PNG · 1200×1800" />
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: "block" }}>Galería (máx 8)</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {gallery.map((g, i) => (
                <ImageUploadBox key={i} variant="gallery" slot={g}
                  onPick={(f) => updateGallerySlot(i, { file: f, url: g.url })}
                  onRemove={() => updateGallerySlot(i, { file: null, url: "" })}
                  label={`Imagen ${i + 1}`} />
              ))}
            </div>
            <div className="help" style={{ marginTop: 8 }}>Hasta 8 imágenes. Aparecerán en la sección "Galería" del evento.</div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: "block" }}>Videos (YouTube)</label>
            {videoFields.map((field, i) => (
              <div key={field.id} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <div className="input-prefix" style={{ flex: 1 }}>
                    <span>▶</span>
                    <input type="url" placeholder="https://youtube.com/watch?v=..." {...register(`videos.${i}.link`)} />
                  </div>
                  {videoFields.length > 1 && (
                    <button type="button" className="icon-btn" aria-label="Eliminar" onClick={() => removeVideo(i)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>
                  )}
                </div>
                <FieldError msg={errors.videos?.[i]?.link?.message} />
              </div>
            ))}
            <button type="button" className="add-line" onClick={() => addVideo({ link: "" })}>
              + Agregar otro video
            </button>
          </div>
        </AccItem>

        {/* 4 — Redes sociales y tags */}
        <AccItem n="4" title="Redes sociales y tags" meta={meta4} open={!!open[4]} onToggle={() => toggle(4)}>

          {socialFields.map((field, i) => (
            <div key={field.id} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <div className="input-prefix" style={{ flex: 1 }}>
                  <span>@</span>
                  <input type="url" placeholder="instagram.com/tu-evento, tiktok.com/@tu-evento…" {...register(`socials.${i}.link`)} />
                </div>
                {socialFields.length > 1 && (
                  <button type="button" className="icon-btn" aria-label="Eliminar" onClick={() => removeSocial(i)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                )}
              </div>
              <FieldError msg={errors.socials?.[i]?.link?.message} />
            </div>
          ))}
          <button type="button" className="add-line" onClick={() => addSocial({ link: "" })}>
            + Agregar otra red social
          </button>

        </AccItem>

      </div>{/* /form-acc */}

      {/* ── Sticky footer ─────────────────────────────────────────────────── */}
      <div style={{
        position: "sticky", bottom: 0, marginTop: 24,
        padding: "18px 0",
        borderTop: "1px solid var(--line)",
        background: "color-mix(in oklab, var(--bg) 92%, transparent)",
        backdropFilter: "blur(8px)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 13, color: "var(--ink-3)" }}>
          {mode === "create"
            ? "Creando como admin · sin checkout ni upsell."
            : `Editando evento #${initial?.id} · no se notifica al organizador.`}
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/dashboard/events" className="btn ghost">Cancelar</Link>
          <button
            type="button"
            className="btn dark"
            disabled={busy}
            onClick={() => {
              setValue("status", "DRAFT");
              handleSubmit(onSubmit)();
            }}
          >
            Guardar borrador
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={busy}
            onClick={() => handleSubmit(onSubmit)()}
          >
            {ctaLabel}
          </button>
        </div>
      </div>

    </div>
  );
}
