"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
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

// ---------------------------------------------------------------------------
// Helpers de validación (sin dependencias externas)
// ---------------------------------------------------------------------------

/** Precio mínimo en CLP para eventos de pago. */
const MIN_PRICE = 500;
/** Longitud mínima del título. */
const MIN_TITLE_LEN = 3;

/** Devuelve la fecha de hoy en formato YYYY-MM-DD (zona local). */
function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Valida que `value` sea una URL http/https bien formada.
 * Devuelve false para string vacío o malformado.
 */
function isValidUrl(value: string): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

type Price = { name: string; amount: string };
type DateRow = { date: string; start: string; end: string };

type FormData = {
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
  banner: string;
  poster: string;
  gallery: string[];
};

type Update = <K extends keyof FormData>(k: K, v: FormData[K]) => void;
type FieldErrors = Record<string, string>;

const EMPTY: FormData = {
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
  banner: "",
  poster: "",
  gallery: [],
};

export default function FormPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, ready } = useUser();

  const pubHeaderRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState(1);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);
  const [data, setData] = useState<FormData>(EMPTY);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [regions, setRegions] = useState<ApiRegion[]>([]);
  const [communes, setCommunes] = useState<ApiCommune[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const update: Update = (k, v) => {
    setData((d) => ({ ...d, [k]: v }));
    setFieldErrors((e) => {
      const n = { ...e };
      delete n[k as string];
      if (k === "prices") {
        Object.keys(n).filter((x) => x.startsWith("price_")).forEach((x) => delete n[x]);
      }
      if (k === "dates") {
        Object.keys(n).filter((x) => x.startsWith("date_") || x === "dates").forEach((x) => delete n[x]);
      }
      if (k === "socials") {
        Object.keys(n).filter((x) => x.startsWith("social_")).forEach((x) => delete n[x]);
      }
      if (k === "videos") {
        Object.keys(n).filter((x) => x.startsWith("video_")).forEach((x) => delete n[x]);
      }
      return n;
    });
  };

  const validateStep = (s: number): FieldErrors => {
    const e: FieldErrors = {};

    if (s === 1) {
      if (!data.title.trim()) {
        e.title = "El título es obligatorio.";
      } else if (data.title.trim().length < MIN_TITLE_LEN) {
        e.title = "El título debe tener al menos 3 caracteres.";
      }
      if (!data.categoryId) e.categoryId = "Selecciona una categoría.";
      if (data.desc.trim().length < 10) e.desc = "Mínimo 10 caracteres.";
      if (!data.free) {
        data.prices.forEach((p, i) => {
          if (!p.name.trim()) e[`price_${i}`] = "El nombre es obligatorio.";
          const n = Number(p.amount);
          if (p.amount === "" || !Number.isInteger(n)) {
            e[`price_amount_${i}`] = "Ingresa un monto válido.";
          } else if (n < MIN_PRICE) {
            e[`price_amount_${i}`] = "El precio mínimo es $500 CLP.";
          }
        });
      }
    }

    if (s === 2) {
      if (!data.address.trim()) e.address = "La dirección es obligatoria.";
      if (!data.addressNumber.trim()) e.addressNumber = "El número es obligatorio.";

      // Fechas: al menos una con fecha no vacía
      const filledDates = data.dates.filter((d) => d.date);
      if (!filledDates.length) {
        e.dates = "Agrega al menos una fecha para el evento.";
      }
      data.dates.forEach((d, i) => {
        if (!d.date) return;
        if (d.date < todayISO()) {
          e[`date_${i}`] = "La fecha no puede estar en el pasado.";
        } else if (d.start && d.end && d.end <= d.start) {
          e[`date_${i}`] = "La hora de término debe ser posterior al inicio.";
        }
      });

      // URL ticketera (opcional)
      const webTrimmed = data.web.trim();
      if (webTrimmed && !isValidUrl(`https://${webTrimmed}`)) {
        e.web = "Ingresa una dirección web válida.";
      }

      // Redes sociales (opcionales): normalizar @ inicial y validar como URL
      data.socials.forEach((s, i) => {
        const raw = s.trim();
        if (!raw) return;
        // Quitar @ inicial si lo tiene
        const withoutAt = raw.startsWith("@") ? raw.slice(1) : raw;
        // Si ya tiene esquema, validar tal cual; si no, anteponerlo
        const toValidate =
          withoutAt.startsWith("http://") || withoutAt.startsWith("https://")
            ? withoutAt
            : `https://${withoutAt}`;
        if (!isValidUrl(toValidate)) {
          e[`social_${i}`] = "Ingresa una URL de red social válida.";
        }
      });
    }

    if (s === 3) {
      // Videos (opcionales): validar URLs completas
      data.videos.forEach((v, i) => {
        const raw = v.trim();
        if (!raw) return;
        if (!isValidUrl(raw)) {
          e[`video_${i}`] = "Ingresa una URL de video válida.";
        }
      });
    }

    return e;
  };

  // Headroom — oculta el header al bajar, lo muestra al subir.
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const el = pubHeaderRef.current;
        if (el) {
          if (y < 80) el.classList.remove("headroom--hidden");
          else if (y - lastY > 4) el.classList.add("headroom--hidden");
          else if (lastY - y > 4) el.classList.remove("headroom--hidden");
        }
        lastY = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Sin sesión → al login.
  useEffect(() => {
    if (ready && !user) router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
  }, [ready, user, router, pathname]);

  // Catálogos.
  useEffect(() => {
    api.categories().then(setCategories).catch(() => {});
    api.regions().then(setRegions).catch(() => {});
  }, []);

  // Comunas según la región elegida.
  useEffect(() => {
    const region = regions.find((r) => String(r.id) === data.regionId);
    if (!region) {
      setCommunes([]);
      return;
    }
    api.communes(region.slug).then(setCommunes).catch(() => setCommunes([]));
  }, [data.regionId, regions]);

  if (!ready || !user || !token) {
    return (
      <main
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ink-3)",
          fontFamily: "var(--font-mono)",
          fontSize: 13,
        }}
      >
        {ready ? "Redirigiendo al inicio de sesión…" : "Verificando acceso…"}
      </main>
    );
  }

  if (done) {
    return (
      <main className="container">
        <div className="form-shell" style={{ textAlign: "center", padding: "64px 32px" }}>
          <div className="step-num">EVENTO ENVIADO</div>
          <h1 className="step-title" style={{ marginTop: 12 }}>
            Tu evento fue enviado a revisión.
          </h1>
          <p className="step-lead" style={{ margin: "0 auto" }}>
            Un administrador lo revisará antes de publicarlo. Te avisaremos cuando esté
            aprobado.
          </p>
          <div className="row" style={{ gap: 12, justifyContent: "center", marginTop: 24 }}>
            <Link className="btn ghost" href="/">
              Volver al inicio
            </Link>
            <Link className="btn primary" href="/cuenta">
              Ver mis eventos {Ic.arrow}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const submit = async () => {
    setSubmitError("");
    const errs = validateStep(3);
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSubmitting(true);
    try {
      const web = data.web.trim().replace(/^https?:\/\//, "");
      const payload: CreateEventInput = {
        title: data.title.trim(),
        company: data.company.trim() || undefined,
        description: data.desc.trim(),
        about: data.about.trim() || undefined,
        address: data.address.trim(),
        addressNumber: data.addressNumber.trim(),
        ticketUrl: web ? `https://${web}` : undefined,
        banner: data.banner || undefined,
        poster: data.poster || undefined,
        gallery: data.gallery.length ? data.gallery : undefined,
        regionId: data.regionId ? Number(data.regionId) : undefined,
        communeId: data.communeId ? Number(data.communeId) : undefined,
        categoryIds: data.categoryId ? [Number(data.categoryId)] : undefined,
        prices: data.free
          ? []
          : data.prices
              .filter((p) => p.name.trim())
              .map((p) => ({ name: p.name.trim(), price: Number(p.amount) || 0 })),
        dates: data.dates
          .filter((d) => d.date)
          .map((d) => ({
            date: d.date,
            startTime: d.start || undefined,
            endTime: d.end || undefined,
          })),
        socialLinks: data.socials.filter((s) => s.trim()).map((s) => ({ link: s.trim() })),
        videos: data.videos.filter((v) => v.trim()).map((v) => ({ link: v.trim() })),
      };
      await api.createEvent(payload, token);
      setDone(true);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "No se pudo publicar el evento");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ paddingTop: 64 }}>
      <header className="pub-header" ref={pubHeaderRef}>
        <div className="container row" style={{ justifyContent: "space-between" }}>
          <Link href="/"><BrandMark size={28} /></Link>
          <span className="mono" style={{ fontSize: 11, letterSpacing: ".15em", color: "var(--ink-3)" }}>
            PASO {step} DE 3
          </span>
        </div>
      </header>

      <div className="container">
        <div className="form-shell">
          <div className="form-stepbar">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`seg ${n < step ? "done" : ""} ${n === step ? "curr" : ""}`} />
            ))}
          </div>

          <div className="step-num">PASO {step} / 03</div>
          {step === 1 && <Step1 data={data} update={update} categories={categories} userName={user.name} errors={fieldErrors} />}
          {step === 2 && (
            <Step2 data={data} update={update} regions={regions} communes={communes} errors={fieldErrors} />
          )}
          {step === 3 && <Step3 data={data} update={update} token={token} errors={fieldErrors} />}

          {submitError && (
            <div style={{ color: "var(--err)", fontSize: 13, margin: "18px 0 0" }}>{submitError}</div>
          )}

          <div className="form-foot">
            <div className="container">
            <button
              className="btn ghost"
              onClick={() => { if (step > 1) { setFieldErrors({}); setSubmitError(""); setStep(step - 1); } }}
              disabled={step === 1}
              style={{ opacity: step === 1 ? 0.3 : 1 }}
            >
              {Ic.chevL} Volver
            </button>
            <button
              className="btn primary"
              disabled={submitting}
              onClick={() => {
                if (step < 3) {
                  const errs = validateStep(step);
                  if (Object.keys(errs).length) {
                    setFieldErrors(errs);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    return;
                  }
                  setFieldErrors({});
                  setStep(step + 1);
                } else {
                  submit();
                }
              }}
            >
              {step === 3
                ? submitting
                  ? "Publicando…"
                  : "Publicar evento"
                : "Continuar"}{" "}
              {Ic.arrow}
            </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <div style={{ color: "var(--err)", fontSize: 12, marginTop: 5 }}>{msg}</div>;
}

function Step1({
  data,
  update,
  categories,
  userName,
  errors,
}: {
  data: FormData;
  update: Update;
  categories: ApiCategory[];
  userName: string;
  errors: FieldErrors;
}) {
  const firstName = userName.split(" ")[0] || userName;
  return (
    <div>
      <h1 className="step-title">
        Hola, {firstName}.
        <br />
        Cuéntanos sobre tu evento.
      </h1>
      <p className="step-lead">
        Esta información se mostrará en tu publicación. Podrás editarla antes de que se apruebe.
      </p>

      <fieldset>
        <div className="field-set-title">
          <span className="n">1.1</span> Información básica
        </div>
        <div className="field">
          <label>Título del evento</label>
          <input
            type="text"
            placeholder="Ej: Konbini Live Fest 2026"
            value={data.title}
            minLength={MIN_TITLE_LEN}
            maxLength={120}
            onChange={(e) => update("title", e.target.value)}
          />
          <FieldError msg={errors.title} />
          <div className="help">Sé claro y descriptivo. Este es el nombre que verán los asistentes.</div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Empresa / Productor</label>
            <input
              type="text"
              placeholder="Ej: Konbini Producciones"
              value={data.company}
              onChange={(e) => update("company", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Categoría</label>
            <select value={data.categoryId} onChange={(e) => update("categoryId", e.target.value)}>
              <option value="">Selecciona una categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name ?? c.slug}
                </option>
              ))}
            </select>
            <FieldError msg={errors.categoryId} />
          </div>
        </div>
        <div className="field">
          <label>Descripción general</label>
          <textarea
            placeholder="Describe brevemente el evento, su temática y formato."
            value={data.desc}
            onChange={(e) => update("desc", e.target.value)}
          />
          <FieldError msg={errors.desc} />
          <div className="help">Aparece en las tarjetas de búsqueda. Mínimo 10 caracteres.</div>
        </div>
        <div className="field">
          <label>
            Acerca de <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>(opcional)</span>
          </label>
          <textarea
            placeholder="Cuenta lo que los asistentes pueden esperar: artistas invitados, actividades…"
            value={data.about}
            onChange={(e) => update("about", e.target.value)}
            style={{ minHeight: 140 }}
          />
        </div>
      </fieldset>

      <fieldset>
        <div className="field-set-title">
          <span className="n">1.2</span> Valores de entrada
        </div>
        <div
          className="ck-row"
          onClick={() => {
            const goingFree = !data.free;
            update("free", goingFree);
            if (goingFree) {
              update("prices", data.prices.map((p) => ({ ...p, amount: "0" })));
            }
          }}
          style={{ marginBottom: 16 }}
        >
          <div className={`ck ${data.free ? "on" : ""}`}>{data.free && Ic.check}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Evento gratuito</div>
            <div style={{ color: "var(--ink-3)", fontSize: 12 }}>
              Marca esta opción si la entrada es liberada.
            </div>
          </div>
        </div>

        {!data.free && (
          <div>
            {data.prices.map((p, i) => (
              <div className="price-row" key={i}>
                <div className="field" style={{ margin: 0 }}>
                  <label>Nombre de tarifa</label>
                  <input
                    type="text"
                    placeholder="Ej: Entrada General, VIP"
                    value={p.name}
                    onChange={(e) =>
                      update(
                        "prices",
                        data.prices.map((pp, j) => (j === i ? { ...pp, name: e.target.value } : pp)),
                      )
                    }
                  />
                  <FieldError msg={errors[`price_${i}`]} />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>Precio</label>
                  <div className="input-prefix">
                    <span>$</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      min={MIN_PRICE}
                      step="1"
                      value={p.amount}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Solo aceptar dígitos enteros (sin decimales ni texto)
                        if (val !== "" && !/^\d+$/.test(val)) return;
                        update(
                          "prices",
                          data.prices.map((pp, j) =>
                            j === i ? { ...pp, amount: val } : pp,
                          ),
                        );
                      }}
                    />
                    <span className="suffix">CLP</span>
                  </div>
                  <FieldError msg={errors[`price_amount_${i}`]} />
                </div>
                <div style={{ display: "flex", alignItems: "end" }}>
                  {data.prices.length > 1 && (
                    <button
                      className="icon-btn"
                      onClick={() => update("prices", data.prices.filter((_, j) => j !== i))}
                    >
                      {Ic.close}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              className="add-line"
              onClick={() => update("prices", [...data.prices, { name: "", amount: "" }])}
            >
              {Ic.plus} Agregar otra tarifa
            </button>
            <div className="help" style={{ marginTop: 12 }}>
              Los valores son informativos. La compra de entradas se realiza fuera de Konbini.
            </div>
          </div>
        )}
      </fieldset>
    </div>
  );
}

function Step2({
  data,
  update,
  regions,
  communes,
  errors,
}: {
  data: FormData;
  update: Update;
  regions: ApiRegion[];
  communes: ApiCommune[];
  errors: FieldErrors;
}) {
  return (
    <div>
      <h1 className="step-title">Horarios, ubicación y links.</h1>
      <p className="step-lead">
        Indica dónde y cuándo ocurre el evento, y dónde enviar a los asistentes para más
        información.
      </p>

      <fieldset>
        <div className="field-set-title">
          <span className="n">2.1</span> Día y hora del evento
        </div>
        {data.dates.map((d, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div className="grid-3">
              <div className="field" style={{ margin: 0 }}>
                <label>Fecha {i === 0 ? "" : `(día ${i + 1})`}</label>
                <input
                  type="date"
                  min={todayISO()}
                  value={d.date}
                  onChange={(e) =>
                    update(
                      "dates",
                      data.dates.map((dd, j) => (j === i ? { ...dd, date: e.target.value } : dd)),
                    )
                  }
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Hora inicio</label>
                <input
                  type="time"
                  value={d.start}
                  onChange={(e) =>
                    update(
                      "dates",
                      data.dates.map((dd, j) => (j === i ? { ...dd, start: e.target.value } : dd)),
                    )
                  }
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Hora término</label>
                <input
                  type="time"
                  value={d.end}
                  onChange={(e) =>
                    update(
                      "dates",
                      data.dates.map((dd, j) => (j === i ? { ...dd, end: e.target.value } : dd)),
                    )
                  }
                />
              </div>
            </div>
            <FieldError msg={errors[`date_${i}`]} />
          </div>
        ))}
        <FieldError msg={errors.dates} />
        <button
          className="add-line"
          onClick={() => update("dates", [...data.dates, { date: "", start: "", end: "" }])}
        >
          {Ic.plus} Agregar otro día
        </button>
      </fieldset>

      <fieldset>
        <div className="field-set-title">
          <span className="n">2.2</span> Ubicación
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Región</label>
            <select
              value={data.regionId}
              onChange={(e) => {
                update("regionId", e.target.value);
                update("communeId", "");
              }}
            >
              <option value="">Selecciona una región</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Comuna</label>
            <select
              value={data.communeId}
              onChange={(e) => update("communeId", e.target.value)}
              disabled={!data.regionId}
            >
              <option value="">
                {data.regionId ? "Selecciona una comuna" : "Elige una región primero"}
              </option>
              {communes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Dirección</label>
            <input
              type="text"
              placeholder="Ej: Av. Matta"
              value={data.address}
              maxLength={120}
              onChange={(e) => update("address", e.target.value)}
            />
            <FieldError msg={errors.address} />
          </div>
          <div className="field">
            <label>Número</label>
            <input
              type="text"
              placeholder="Ej: 890"
              value={data.addressNumber}
              maxLength={12}
              onChange={(e) => update("addressNumber", e.target.value)}
            />
            <FieldError msg={errors.addressNumber} />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <div className="field-set-title">
          <span className="n">2.3</span> Enlaces importantes
        </div>
        <div className="field">
          <label>Sitio de venta de entradas / Ticketera</label>
          <div className="input-prefix">
            <span>https://</span>
            <input
              type="text"
              inputMode="url"
              placeholder="ticketera.cl/tu-evento"
              value={data.web}
              onChange={(e) => update("web", e.target.value)}
            />
          </div>
          <FieldError msg={errors.web} />
          <div className="help">
            La compra de entradas ocurre fuera de Konbini: los asistentes serán dirigidos a este
            enlace.
          </div>
        </div>
        <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: "block" }}>
          Redes sociales
        </label>
        {data.socials.map((s, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div className="row">
              <div className="input-prefix" style={{ flex: 1 }}>
                <span>@</span>
                <input
                  type="text"
                  inputMode="url"
                  placeholder="instagram.com/tu-evento"
                  value={s}
                  onChange={(e) =>
                    update(
                      "socials",
                      data.socials.map((ss, j) => (j === i ? e.target.value : ss)),
                    )
                  }
                />
              </div>
              {data.socials.length > 1 && (
                <button
                  className="icon-btn"
                  onClick={() => update("socials", data.socials.filter((_, j) => j !== i))}
                >
                  {Ic.close}
                </button>
              )}
            </div>
            <FieldError msg={errors[`social_${i}`]} />
          </div>
        ))}
        <button className="add-line" onClick={() => update("socials", [...data.socials, ""])}>
          {Ic.plus} Agregar otra red social
        </button>
      </fieldset>
    </div>
  );
}

function ImageUploader({
  label,
  value,
  onChange,
  token,
  tall,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  token: string;
  tall?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr("");
    setBusy(true);
    try {
      const { url } = await api.uploadImage(file, token);
      onChange(url);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "No se pudo subir la imagen");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: "block" }}>
        {label}
      </label>
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={onFile}
      />
      {value ? (
        <div
          className={`upload-box ${tall ? "tall" : ""}`}
          style={{ padding: 0, overflow: "hidden", position: "relative" }}
        >
          <img
            src={imageUrl(value)}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <button
            type="button"
            className="icon-btn"
            onClick={() => onChange("")}
            style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,.6)", color: "white" }}
          >
            {Ic.close}
          </button>
        </div>
      ) : (
        <div className={`upload-box ${tall ? "tall" : ""}`} onClick={() => ref.current?.click()}>
          <div className="ic">{Ic.upl}</div>
          <div style={{ fontWeight: 500, color: "var(--ink-2)" }}>
            {busy ? "Subiendo…" : "Subir imagen"}
          </div>
          <small>JPG / PNG / WebP · máx 5MB</small>
        </div>
      )}
      {err && <div style={{ color: "var(--err)", fontSize: 12, marginTop: 6 }}>{err}</div>}
    </div>
  );
}

function Step3({ data, update, token, errors }: { data: FormData; update: Update; token: string; errors: FieldErrors }) {
  const galRef = useRef<HTMLInputElement>(null);
  const [galBusy, setGalBusy] = useState(false);
  const [galErr, setGalErr] = useState("");

  const onGalleryFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setGalErr("");
    setGalBusy(true);
    try {
      const { url } = await api.uploadImage(file, token);
      update("gallery", [...data.gallery, url]);
    } catch (ex) {
      setGalErr(ex instanceof Error ? ex.message : "No se pudo subir la imagen");
    } finally {
      setGalBusy(false);
    }
  };

  return (
    <div>
      <h1 className="step-title">Imágenes y video.</h1>
      <p className="step-lead">
        Una buena imagen es decisiva. El banner destaca el evento; el poster va en los listados
        verticales.
      </p>

      <fieldset>
        <div className="field-set-title">
          <span className="n">3.1</span> Imágenes principales
        </div>
        <div className="upload-grid">
          <ImageUploader
            label="Banner (horizontal · 16:9)"
            value={data.banner}
            onChange={(u) => update("banner", u)}
            token={token}
          />
          <ImageUploader
            label="Poster (vertical · 2:3)"
            value={data.poster}
            onChange={(u) => update("poster", u)}
            token={token}
            tall
          />
        </div>
      </fieldset>

      <fieldset>
        <div className="field-set-title">
          <span className="n">3.2</span> Galería
        </div>
        <input
          ref={galRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={onGalleryFile}
        />
        <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {data.gallery.map((g, i) => (
            <div
              key={i}
              className="upload-box"
              style={{ aspectRatio: "1/1", padding: 0, overflow: "hidden", position: "relative" }}
            >
              <img
                src={imageUrl(g)}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => update("gallery", data.gallery.filter((_, j) => j !== i))}
                style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,.6)", color: "white" }}
              >
                {Ic.close}
              </button>
            </div>
          ))}
          {data.gallery.length < 10 && (
            <div
              className="upload-box"
              style={{ aspectRatio: "1/1", padding: 14 }}
              onClick={() => galRef.current?.click()}
            >
              <div className="ic" style={{ width: 28, height: 28 }}>{Ic.plus}</div>
              <small style={{ fontSize: 10 }}>{galBusy ? "Subiendo…" : "Agregar"}</small>
            </div>
          )}
        </div>
        {galErr && <div style={{ color: "var(--err)", fontSize: 12, marginTop: 8 }}>{galErr}</div>}
        <div className="help" style={{ marginTop: 10 }}>
          Hasta 10 imágenes. Aparecen en la sección &quot;Galería&quot; del evento.
        </div>
      </fieldset>

      <fieldset>
        <div className="field-set-title">
          <span className="n">3.3</span> Videos
        </div>
        {data.videos.map((v, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div className="row">
              <div className="input-prefix" style={{ flex: 1 }}>
                <span>▶</span>
                <input
                  type="url"
                  inputMode="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={v}
                  onChange={(e) =>
                    update(
                      "videos",
                      data.videos.map((vv, j) => (j === i ? e.target.value : vv)),
                    )
                  }
                />
              </div>
              {data.videos.length > 1 && (
                <button
                  className="icon-btn"
                  onClick={() => update("videos", data.videos.filter((_, j) => j !== i))}
                >
                  {Ic.close}
                </button>
              )}
            </div>
            <FieldError msg={errors[`video_${i}`]} />
          </div>
        ))}
        <button className="add-line" onClick={() => update("videos", [...data.videos, ""])}>
          {Ic.plus} Agregar otro video
        </button>
      </fieldset>

      <div
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--line)",
          borderRadius: 14,
          padding: 18,
          display: "flex",
          gap: 14,
          alignItems: "start",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            background: "var(--accent)",
            color: "white",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {Ic.help}
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Revisión antes de publicar</div>
          <div style={{ color: "var(--ink-2)", fontSize: 13, lineHeight: 1.55 }}>
            Tu publicación pasará por una revisión antes de aparecer en Konbini. Te
            notificaremos cuando esté lista.
          </div>
        </div>
      </div>
    </div>
  );
}
