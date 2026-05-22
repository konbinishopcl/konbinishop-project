"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BrandMark } from "@/components/BrandMark";
import { Ic } from "@/components/icons";
import { useUser } from "@/components/providers";
import {
  api,
  imageUrl,
  type ApiCategory,
  type ApiCommune,
  type ApiRegion,
  type CreateEventInput,
} from "@/lib/api";
import { useForm as useFormCtx, type ImageSlot, type FormValues } from "../FormContext";
import {
  step1Schema,
  step2Schema,
  step3Schema,
  type Step1Values,
  type Step2Values,
  type Step3Values,
} from "../schemas";

// ─── Helpers ────────────────────────────────────────────────────────────────

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Bloquea en el teclado todo lo que no sea dígito ni tecla de control */
const onlyDigits = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const nav = ["Backspace", "Tab", "Delete", "ArrowLeft", "ArrowRight", "Home", "End", "Enter"];
  if (!nav.includes(e.key) && !/^\d$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
  }
};

// ─── FieldError ─────────────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <div style={{ color: "var(--err)", fontSize: 12, marginTop: 5 }}>{msg}</div>;
}

// ─── ImageUploader — imágenes en memoria hasta el submit ────────────────────

function ImageUploader({
  label, value, onChange, tall,
}: {
  label: string; value: ImageSlot; onChange: (s: ImageSlot) => void; tall?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (value?.kind === "pending") URL.revokeObjectURL(value.preview);
    onChange({ kind: "pending", file, preview: URL.createObjectURL(file) });
  };
  const src =
    value?.kind === "pending" ? value.preview :
    value?.kind === "uploaded" ? imageUrl(value.url) : null;
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: "block" }}>{label}</label>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={onFile} />
      {src ? (
        <div className={`upload-box ${tall ? "tall" : ""}`} style={{ padding: 0, overflow: "hidden", position: "relative" }}>
          <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <button type="button" className="icon-btn"
            onClick={() => { if (value?.kind === "pending") URL.revokeObjectURL(value.preview); onChange(null); }}
            style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,.6)", color: "white" }}>
            {Ic.close}
          </button>
        </div>
      ) : (
        <div className={`upload-box ${tall ? "tall" : ""}`} onClick={() => ref.current?.click()}>
          <div className="ic">{Ic.upl}</div>
          <div style={{ fontWeight: 500, color: "var(--ink-2)" }}>Subir imagen</div>
          <small>JPG / PNG / WebP · máx 5MB</small>
        </div>
      )}
    </div>
  );
}

async function uploadSlot(slot: ImageSlot, token: string): Promise<string | undefined> {
  if (!slot) return undefined;
  if (slot.kind === "uploaded") return slot.url;
  const { url } = await api.uploadImage(slot.file, token);
  return url;
}

// ─── Paso 1 ─────────────────────────────────────────────────────────────────

function Step1Form({
  defaultValues, categories, userName, onDone, onSync,
}: {
  defaultValues: Step1Values;
  categories: ApiCategory[];
  userName: string;
  onDone: (d: Step1Values) => void;
  onSync: (patch: Partial<FormValues>) => void;
}) {
  const { control, register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<Step1Values>({ resolver: zodResolver(step1Schema), mode: "onTouched", defaultValues });

  // Sincronizar con FormContext (y localStorage) en cada cambio del formulario
  useEffect(() => {
    const { unsubscribe } = watch((d) => {
      onSync({
        title:      d.title,
        company:    d.company ?? "",
        categoryId: d.categoryId,
        desc:       d.desc,
        about:      d.about ?? "",
        free:       d.free,
        prices:     d.prices?.map((p) => ({ name: p?.name ?? "", amount: String(p?.amount ?? "") })),
      });
    });
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const free = watch("free");
  const { fields: priceFields, append, remove } = useFieldArray({ control, name: "prices" });
  const firstName = userName.split(" ")[0] || userName;

  return (
    <form id="crear-form" onSubmit={handleSubmit(onDone)}>
      <h1 className="step-title">Hola, {firstName}.<br />Cuéntanos sobre tu evento.</h1>
      <p className="step-lead">Esta información se mostrará en tu publicación. Podrás editarla antes de que se apruebe.</p>

      <fieldset>
        <div className="field-set-title"><span className="n">1.1</span> Información básica</div>

        <div className="field">
          <label>Título del evento</label>
          <input type="text" placeholder="Ej: Konbini Live Fest 2026" maxLength={120} {...register("title")} />
          <FieldError msg={errors.title?.message} />
          <div className="help">Sé claro y descriptivo. Este es el nombre que verán los asistentes.</div>
        </div>

        <div className="grid-2">
          <div className="field">
            <label>Empresa / Productor</label>
            <input type="text" placeholder="Ej: Konbini Producciones" {...register("company")} />
          </div>
          <div className="field">
            <label>Categoría</label>
            <select {...register("categoryId")}>
              <option value="">Selecciona una categoría</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name ?? c.slug}</option>)}
            </select>
            <FieldError msg={errors.categoryId?.message} />
          </div>
        </div>

        <div className="field">
          <label>Descripción general</label>
          <textarea placeholder="Describe brevemente el evento, su temática y formato." {...register("desc")} />
          <FieldError msg={errors.desc?.message} />
          <div className="help">Aparece en las tarjetas de búsqueda. Mínimo 10 caracteres.</div>
        </div>

        <div className="field">
          <label>Acerca de <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>(opcional)</span></label>
          <textarea
            placeholder="Cuenta lo que los asistentes pueden esperar: artistas invitados, actividades…"
            style={{ minHeight: 140 }}
            {...register("about")}
          />
        </div>
      </fieldset>

      <fieldset>
        <div className="field-set-title"><span className="n">1.2</span> Valores de entrada</div>

        <Controller
          control={control}
          name="free"
          render={({ field }) => (
            <div
              className="ck-row"
              onClick={() => {
                const next = !field.value;
                field.onChange(next);
                // Al marcar gratuito, zerear montos para no bloquear el submit
                if (next) priceFields.forEach((_, i) => setValue(`prices.${i}.amount`, 0));
              }}
              style={{ marginBottom: 16 }}
            >
              <div className={`ck ${field.value ? "on" : ""}`}>{field.value && Ic.check}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Evento gratuito</div>
                <div style={{ color: "var(--ink-3)", fontSize: 12 }}>Marca esta opción si la entrada es liberada.</div>
              </div>
            </div>
          )}
        />

        {!free && (
          <div>
            {priceFields.map((field, i) => (
              <div className="price-row" key={field.id}>
                <div className="field" style={{ margin: 0 }}>
                  <label>Nombre de tarifa</label>
                  <input type="text" placeholder="Ej: Entrada General, VIP" {...register(`prices.${i}.name`)} />
                  <FieldError msg={errors.prices?.[i]?.name?.message} />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>Precio</label>
                  <div className="input-prefix">
                    <span>$</span>
                    {/* type="number" → el navegador bloquea letras de forma nativa */}
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="500"
                      min={500}
                      step={1}
                      {...register(`prices.${i}.amount`, { valueAsNumber: true })}
                    />
                    <span className="suffix">CLP</span>
                  </div>
                  <FieldError msg={errors.prices?.[i]?.amount?.message} />
                </div>
                <div style={{ display: "flex", alignItems: "end" }}>
                  {priceFields.length > 1 && (
                    <button type="button" className="icon-btn" onClick={() => remove(i)}>{Ic.close}</button>
                  )}
                </div>
              </div>
            ))}
            <button type="button" className="add-line"
              onClick={() => append({ name: "", amount: undefined as unknown as number })}>
              {Ic.plus} Agregar otra tarifa
            </button>
            <div className="help" style={{ marginTop: 12 }}>
              Los valores son informativos. La compra de entradas se realiza fuera de Konbini.
            </div>
          </div>
        )}
      </fieldset>
    </form>
  );
}

// ─── Paso 2 ─────────────────────────────────────────────────────────────────

function Step2Form({
  defaultValues, regions, communes, onRegionChange, onDone, onSync,
}: {
  defaultValues: Step2Values;
  regions: ApiRegion[];
  communes: ApiCommune[];
  onRegionChange: (id: string) => void;
  onDone: (d: Step2Values) => void;
  onSync: (patch: Partial<FormValues>) => void;
}) {
  const { control, register, handleSubmit, formState: { errors }, watch } =
    useForm<Step2Values>({ resolver: zodResolver(step2Schema), mode: "onTouched", defaultValues });

  useEffect(() => {
    const { unsubscribe } = watch((d) => {
      onSync({
        dates:         d.dates as FormValues["dates"],
        address:       d.address,
        addressNumber: d.addressNumber,
        regionId:      d.regionId ?? "",
        communeId:     d.communeId ?? "",
        web:           d.web ?? "",
        socials:       d.socials?.map((s) => s?.val ?? ""),
      });
    });
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { fields: dateFields, append: addDate, remove: removeDate } =
    useFieldArray({ control, name: "dates" });
  const { fields: socialFields, append: addSocial, remove: removeSocial } =
    useFieldArray({ control, name: "socials" });

  // Error de fechas puede venir como root error (superRefine)
  const datesRootError = (errors.dates as { message?: string } | undefined)?.message;

  return (
    <form id="crear-form" onSubmit={handleSubmit(onDone)}>
      <h1 className="step-title">Horarios, ubicación y links.</h1>
      <p className="step-lead">Indica dónde y cuándo ocurre el evento, y dónde enviar a los asistentes.</p>

      <fieldset>
        <div className="field-set-title"><span className="n">2.1</span> Día y hora del evento</div>
        {dateFields.map((field, i) => (
          <div key={field.id} style={{ marginBottom: 14 }}>
            <div className="grid-3">
              <div className="field" style={{ margin: 0 }}>
                <label>Fecha {i > 0 ? `(día ${i + 1})` : ""}</label>
                {/* min bloquea fechas pasadas en el picker nativo */}
                <input type="date" min={todayISO()} {...register(`dates.${i}.date`)} />
                <FieldError msg={errors.dates?.[i]?.date?.message} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Hora inicio</label>
                <input type="time" {...register(`dates.${i}.start`)} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Hora término</label>
                <input type="time" {...register(`dates.${i}.end`)} />
                <FieldError msg={errors.dates?.[i]?.end?.message} />
              </div>
            </div>
            {dateFields.length > 1 && (
              <button type="button" className="icon-btn" onClick={() => removeDate(i)} style={{ marginTop: 6 }}>
                {Ic.close}
              </button>
            )}
          </div>
        ))}
        {datesRootError && <FieldError msg={datesRootError} />}
        <button type="button" className="add-line" onClick={() => addDate({ date: "", start: "", end: "" })}>
          {Ic.plus} Agregar otro día
        </button>
      </fieldset>

      <fieldset>
        <div className="field-set-title"><span className="n">2.2</span> Ubicación</div>
        <div className="grid-2">
          <div className="field">
            <label>Región</label>
            <select
              {...register("regionId")}
              onChange={(e) => { register("regionId").onChange(e); onRegionChange(e.target.value); }}
            >
              <option value="">Selecciona una región</option>
              {regions.map((r) => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Comuna</label>
            <select {...register("communeId")} disabled={communes.length === 0}>
              <option value="">{communes.length ? "Selecciona una comuna" : "Elige una región primero"}</option>
              {communes.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Dirección</label>
            <input type="text" placeholder="Ej: Av. Matta" maxLength={120} {...register("address")} />
            <FieldError msg={errors.address?.message} />
          </div>
          <div className="field">
            <label>Número</label>
            {/*
              onKeyDown bloquea cualquier tecla que no sea dígito — imposible
              escribir "Maxime" o cualquier letra.
            */}
            <input
              type="text"
              inputMode="numeric"
              placeholder="890"
              maxLength={8}
              {...register("addressNumber")}
              onKeyDown={onlyDigits}
            />
            <FieldError msg={errors.addressNumber?.message} />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <div className="field-set-title"><span className="n">2.3</span> Enlaces importantes</div>
        <div className="field">
          <label>Sitio de venta de entradas / Ticketera</label>
          <div className="input-prefix">
            <span>https://</span>
            <input type="text" inputMode="url" placeholder="ticketera.cl/tu-evento" {...register("web")} />
          </div>
          <FieldError msg={errors.web?.message} />
          <div className="help">La compra de entradas ocurre fuera de Konbini: los asistentes serán dirigidos a este enlace.</div>
        </div>

        <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: "block" }}>Redes sociales</label>
        {socialFields.map((field, i) => (
          <div key={field.id} style={{ marginBottom: 10 }}>
            <div className="row">
              <div className="input-prefix" style={{ flex: 1 }}>
                <span>@</span>
                <input type="text" inputMode="url" placeholder="instagram.com/tu-evento" {...register(`socials.${i}.val`)} />
              </div>
              {socialFields.length > 1 && (
                <button type="button" className="icon-btn" onClick={() => removeSocial(i)}>{Ic.close}</button>
              )}
            </div>
            <FieldError msg={errors.socials?.[i]?.val?.message} />
          </div>
        ))}
        <button type="button" className="add-line" onClick={() => addSocial({ val: "" })}>
          {Ic.plus} Agregar otra red social
        </button>
      </fieldset>
    </form>
  );
}

// ─── Paso 3 ─────────────────────────────────────────────────────────────────

function Step3Form({
  defaultValues, ctxData, updateCtx, onDone, onSync,
}: {
  defaultValues: Step3Values;
  ctxData: { banner: ImageSlot; poster: ImageSlot; gallery: ImageSlot[] };
  updateCtx: (k: "banner" | "poster" | "gallery", v: unknown) => void;
  onDone: (d: Step3Values) => void;
  onSync: (patch: Partial<FormValues>) => void;
}) {
  const { control, register, handleSubmit, formState: { errors }, watch } =
    useForm<Step3Values>({ resolver: zodResolver(step3Schema), mode: "onTouched", defaultValues });

  useEffect(() => {
    const { unsubscribe } = watch((d) => {
      onSync({ videos: d.videos?.map((v) => v?.val ?? "") });
    });
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { fields: videoFields, append, remove } = useFieldArray({ control, name: "videos" });
  const galRef = useRef<HTMLInputElement>(null);
  const [galErr, setGalErr] = useState("");

  const onGalleryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setGalErr("");
    if (file.size > 5 * 1024 * 1024) { setGalErr("La imagen no debe superar 5 MB."); return; }
    updateCtx("gallery", [...ctxData.gallery, { kind: "pending", file, preview: URL.createObjectURL(file) }]);
  };

  return (
    <form id="crear-form" onSubmit={handleSubmit(onDone)}>
      <h1 className="step-title">Imágenes y video.</h1>
      <p className="step-lead">Una buena imagen es decisiva. El banner destaca el evento; el poster va en los listados verticales.</p>

      <fieldset>
        <div className="field-set-title"><span className="n">3.1</span> Imágenes principales</div>
        <div className="upload-grid">
          <ImageUploader label="Banner (horizontal · 16:9)" value={ctxData.banner} onChange={(s) => updateCtx("banner", s)} />
          <ImageUploader label="Poster (vertical · 2:3)" value={ctxData.poster} onChange={(s) => updateCtx("poster", s)} tall />
        </div>
      </fieldset>

      <fieldset>
        <div className="field-set-title"><span className="n">3.2</span> Galería</div>
        <input ref={galRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={onGalleryFile} />
        <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {ctxData.gallery.map((slot, i) => {
            const src = slot?.kind === "pending" ? slot.preview : slot?.kind === "uploaded" ? imageUrl(slot.url) : null;
            return src ? (
              <div key={i} className="upload-box" style={{ aspectRatio: "1/1", padding: 0, overflow: "hidden", position: "relative" }}>
                <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button type="button" className="icon-btn"
                  onClick={() => { if (slot?.kind === "pending") URL.revokeObjectURL(slot.preview); updateCtx("gallery", ctxData.gallery.filter((_, j) => j !== i)); }}
                  style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,.6)", color: "white" }}>
                  {Ic.close}
                </button>
              </div>
            ) : null;
          })}
          {ctxData.gallery.length < 10 && (
            <div className="upload-box" style={{ aspectRatio: "1/1", padding: 14 }} onClick={() => galRef.current?.click()}>
              <div className="ic" style={{ width: 28, height: 28 }}>{Ic.plus}</div>
              <small style={{ fontSize: 10 }}>Agregar</small>
            </div>
          )}
        </div>
        {galErr && <div style={{ color: "var(--err)", fontSize: 12, marginTop: 8 }}>{galErr}</div>}
        <div className="help" style={{ marginTop: 10 }}>Hasta 10 imágenes. Aparecen en la sección &quot;Galería&quot; del evento.</div>
      </fieldset>

      <fieldset>
        <div className="field-set-title"><span className="n">3.3</span> Videos</div>
        {videoFields.map((field, i) => (
          <div key={field.id} style={{ marginBottom: 10 }}>
            <div className="row">
              <div className="input-prefix" style={{ flex: 1 }}>
                <span>▶</span>
                <input type="url" inputMode="url" placeholder="https://youtube.com/watch?v=..." {...register(`videos.${i}.val`)} />
              </div>
              {videoFields.length > 1 && (
                <button type="button" className="icon-btn" onClick={() => remove(i)}>{Ic.close}</button>
              )}
            </div>
            <FieldError msg={errors.videos?.[i]?.val?.message} />
          </div>
        ))}
        <button type="button" className="add-line" onClick={() => append({ val: "" })}>
          {Ic.plus} Agregar otro video
        </button>
      </fieldset>

      <div style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 14, padding: 18, display: "flex", gap: 14, alignItems: "start" }}>
        <div style={{ width: 36, height: 36, borderRadius: 999, background: "var(--accent)", color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {Ic.help}
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Revisión antes de publicar</div>
          <div style={{ color: "var(--ink-2)", fontSize: 13, lineHeight: 1.55 }}>
            Tu publicación pasará por una revisión antes de aparecer en Konbini. Te notificaremos cuando esté lista.
          </div>
        </div>
      </div>
    </form>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function PasoPage() {
  const params   = useParams<{ paso: string }>();
  const router   = useRouter();
  const pathname = usePathname();
  const { user, token, ready } = useUser();
  const { values, update, updateStep, resetForm } = useFormCtx();

  // Sync handlers: RHF → FormContext (y localStorage) en cada cambio de campo
  const onStep1Sync = useCallback((patch: Partial<FormValues>) => updateStep(patch), [updateStep]);
  const onStep2Sync = useCallback((patch: Partial<FormValues>) => updateStep(patch), [updateStep]);
  const onStep3Sync = useCallback((patch: Partial<FormValues>) => updateStep(patch), [updateStep]);

  const paso = Number(params.paso);

  useEffect(() => { if (![1, 2, 3].includes(paso)) router.replace("/crear/1"); }, [paso, router]);
  useEffect(() => { if (ready && !user) router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`); }, [ready, user, router, pathname]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [paso]);

  // Headroom
  const pubHeaderRef = useRef<HTMLElement>(null);
  useEffect(() => {
    let lastY = window.scrollY, ticking = false;
    const fn = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY, el = pubHeaderRef.current;
        if (el) {
          if (y < 80) el.classList.remove("headroom--hidden");
          else if (y - lastY > 4) el.classList.add("headroom--hidden");
          else if (lastY - y > 4) el.classList.remove("headroom--hidden");
        }
        lastY = y; ticking = false;
      });
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Catálogos
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [regions,    setRegions]    = useState<ApiRegion[]>([]);
  const [communes,   setCommunes]   = useState<ApiCommune[]>([]);

  useEffect(() => {
    api.categories().then(setCategories).catch(() => {});
    api.regions().then(setRegions).catch(() => {});
  }, []);

  useEffect(() => {
    const r = regions.find((r) => String(r.id) === values.regionId);
    if (!r) { setCommunes([]); return; }
    api.communes(r.slug).then(setCommunes).catch(() => setCommunes([]));
  }, [values.regionId, regions]);

  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState("");
  const [done,         setDone]         = useState(false);

  // ── Handlers de cada paso ─────────────────────────────────────────────────

  const onStep1Done = (d: Step1Values) => {
    update("title",      d.title);
    update("company",    d.company ?? "");
    update("categoryId", d.categoryId);
    update("desc",       d.desc);
    update("about",      d.about ?? "");
    update("free",       d.free);
    update("prices",     d.prices.map((p) => ({ name: p.name, amount: String(p.amount ?? "") })));
    router.push("/crear/2");
  };

  const onStep2Done = (d: Step2Values) => {
    update("dates",         d.dates);
    update("address",       d.address);
    update("addressNumber", d.addressNumber);
    update("regionId",      d.regionId ?? "");
    update("communeId",     d.communeId ?? "");
    update("web",           d.web ?? "");
    update("socials",       d.socials.map((s) => s.val));
    router.push("/crear/3");
  };

  const onStep3Done = async (d: Step3Values) => {
    setSubmitError("");
    setSubmitting(true);
    try {
      const [bannerUrl, posterUrl, galleryUrls] = await Promise.all([
        uploadSlot(values.banner, token!),
        uploadSlot(values.poster, token!),
        Promise.all(values.gallery.map((g) => uploadSlot(g, token!))),
      ]);
      const web = values.web.trim().replace(/^https?:\/\//, "");
      const payload: CreateEventInput = {
        title:         values.title.trim(),
        company:       values.company.trim() || undefined,
        description:   values.desc.trim(),
        about:         values.about.trim() || undefined,
        address:       values.address.trim(),
        addressNumber: values.addressNumber.trim(),
        ticketUrl:     web ? `https://${web}` : undefined,
        banner:        bannerUrl,
        poster:        posterUrl,
        gallery:       galleryUrls.filter((u): u is string => !!u).length
                         ? galleryUrls.filter((u): u is string => !!u) : undefined,
        regionId:    values.regionId  ? Number(values.regionId)  : undefined,
        communeId:   values.communeId ? Number(values.communeId) : undefined,
        categoryIds: values.categoryId ? [Number(values.categoryId)] : undefined,
        prices:      values.free
          ? []
          : values.prices.filter((p) => p.name.trim()).map((p) => ({ name: p.name.trim(), price: Number(p.amount) || 0 })),
        dates:       values.dates.filter((dt) => dt.date).map((dt) => ({ date: dt.date, startTime: dt.start || undefined, endTime: dt.end || undefined })),
        socialLinks: values.socials.filter((s) => s.trim()).map((s) => ({ link: s.trim() })),
        videos:      d.videos.filter((v) => v.val.trim()).map((v) => ({ link: v.val.trim() })),
      };
      await api.createEvent(payload, token!);
      resetForm();
      setDone(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "No se pudo publicar el evento");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Guards ────────────────────────────────────────────────────────────────

  if (!ready || !user || !token) {
    return (
      <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
        {ready ? "Redirigiendo al inicio de sesión…" : "Verificando acceso…"}
      </main>
    );
  }

  if (done) {
    return (
      <main className="container">
        <div className="form-shell" style={{ textAlign: "center", padding: "64px 32px" }}>
          <div className="step-num">EVENTO ENVIADO</div>
          <h1 className="step-title" style={{ marginTop: 12 }}>Tu evento fue enviado a revisión.</h1>
          <p className="step-lead" style={{ margin: "0 auto" }}>Un administrador lo revisará antes de publicarlo. Te avisaremos cuando esté aprobado.</p>
          <div className="row" style={{ gap: 12, justifyContent: "center", marginTop: 24 }}>
            <Link className="btn ghost" href="/">Volver al inicio</Link>
            <Link className="btn primary" href="/cuenta">Ver mis eventos {Ic.arrow}</Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Defaults para cada paso ───────────────────────────────────────────────

  const step1Defaults: Step1Values = {
    title: values.title, company: values.company, categoryId: values.categoryId,
    desc: values.desc, about: values.about, free: values.free,
    prices: values.prices.map((p) => ({
      name: p.name,
      amount: p.amount === "" ? (undefined as unknown as number) : Number(p.amount),
    })),
  };

  const step2Defaults: Step2Values = {
    dates: values.dates, address: values.address, addressNumber: values.addressNumber,
    regionId: values.regionId, communeId: values.communeId, web: values.web,
    socials: values.socials.map((s) => ({ val: s })),
  };

  const step3Defaults: Step3Values = {
    videos: values.videos.map((v) => ({ val: v })),
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main style={{ paddingTop: 64 }}>
      <header className="pub-header" ref={pubHeaderRef}>
        <div className="container row" style={{ justifyContent: "space-between" }}>
          <Link href="/"><BrandMark size={28} /></Link>
          <span className="mono" style={{ fontSize: 11, letterSpacing: ".15em", color: "var(--ink-3)" }}>
            PASO {paso} DE 3
          </span>
        </div>
      </header>

      <div className="container">
        <div className="form-shell">
          <div className="form-stepbar">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`seg ${n < paso ? "done" : ""} ${n === paso ? "curr" : ""}`} />
            ))}
          </div>
          <div className="step-num">PASO {paso} / 03</div>

          {paso === 1 && <Step1Form defaultValues={step1Defaults} categories={categories} userName={user.name} onDone={onStep1Done} onSync={onStep1Sync} />}
          {paso === 2 && <Step2Form defaultValues={step2Defaults} regions={regions} communes={communes} onRegionChange={(id) => update("regionId", id)} onDone={onStep2Done} onSync={onStep2Sync} />}
          {paso === 3 && <Step3Form defaultValues={step3Defaults} ctxData={{ banner: values.banner, poster: values.poster, gallery: values.gallery }} updateCtx={(k, v) => update(k as "banner", v as ImageSlot)} onDone={onStep3Done} onSync={onStep3Sync} />}

          {submitError && (
            <div style={{ color: "var(--err)", fontSize: 13, margin: "18px 0 0" }}>{submitError}</div>
          )}

          <div className="form-foot">
            <div className="container">
              <button type="button" className="btn ghost"
                onClick={() => { if (paso > 1) router.push(`/crear/${paso - 1}`); }}
                disabled={paso === 1} style={{ opacity: paso === 1 ? 0.3 : 1 }}>
                {Ic.chevL} Volver
              </button>
              {/* type="submit" + form="crear-form" dispara el handleSubmit del step activo */}
              <button type="submit" form="crear-form" className="btn primary" disabled={submitting}>
                {paso === 3 ? (submitting ? "Publicando…" : "Publicar evento") : "Continuar"} {Ic.arrow}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
