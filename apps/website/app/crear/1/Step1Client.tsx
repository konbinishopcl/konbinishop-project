"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BrandMark } from "@/components/BrandMark";
import { Ic } from "@/components/icons";
import { useUser } from "@/components/providers";
import { type ApiCategory } from "@/lib/api";
import { useForm as useFormCtx, type FormValues } from "../FormContext";
import { step1Schema, type Step1Values } from "../schemas";
import { FieldError, useHeadroom } from "../shared";

const PASO = 1;

export function Step1Client({ categories }: { categories: ApiCategory[] }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, ready } = useUser();
  const { values, update, updateStep } = useFormCtx();
  const headerRef = useRef<HTMLElement>(null);
  useHeadroom(headerRef);

  // Auth guard
  useEffect(() => {
    if (ready && !user) router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
  }, [ready, user, router, pathname]);

  // ── RHF ────────────────────────────────────────────────────────────────────
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    mode: "onTouched",
    defaultValues: {
      title:      values.title,
      company:    values.company,
      categoryId: values.categoryId,
      desc:       values.desc,
      about:      values.about,
      free:       values.free,
      prices:     values.prices.map((p) => ({
        name:   p.name,
        amount: p.amount === "" ? (undefined as unknown as number) : Number(p.amount),
      })),
    },
  });

  // Sincronizar con FormContext (y localStorage) en cada cambio
  useEffect(() => {
    const { unsubscribe } = watch((d) => {
      updateStep({
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

  const onDone = (d: Step1Values) => {
    update("title",      d.title);
    update("company",    d.company ?? "");
    update("categoryId", d.categoryId);
    update("desc",       d.desc);
    update("about",      d.about ?? "");
    update("free",       d.free);
    update("prices",     d.prices.map((p) => ({ name: p.name, amount: String(p.amount ?? "") })));
    router.push("/crear/2");
  };

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (!ready || !user) {
    return (
      <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
        {ready ? "Redirigiendo al inicio de sesión…" : "Verificando acceso…"}
      </main>
    );
  }

  const firstName = user.name.split(" ")[0] || user.name;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main style={{ paddingTop: 64 }}>
      <header className="pub-header" ref={headerRef}>
        <div className="container row" style={{ justifyContent: "space-between" }}>
          <Link href="/"><BrandMark size={28} /></Link>
          <span className="mono" style={{ fontSize: 11, letterSpacing: ".15em", color: "var(--ink-3)" }}>
            PASO {PASO} DE 3
          </span>
        </div>
      </header>

      <div className="container">
        <div className="form-shell">
          <div className="form-stepbar">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`seg ${n < PASO ? "done" : ""} ${n === PASO ? "curr" : ""}`} />
            ))}
          </div>
          <div className="step-num">PASO {PASO} / 03</div>

          <form id="crear-form" className="form-step" onSubmit={handleSubmit(onDone)}>
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
                  {/*
                    Controller (controlado) en lugar de register (ref) — así value={field.value}
                    garantiza que el select muestre la opción guardada aunque se recargue la página.
                    Las opciones vienen del servidor (SSR), por lo que existen desde el primer render.
                  */}
                  <Controller
                    control={control}
                    name="categoryId"
                    render={({ field }) => (
                      <select
                        name={field.name}
                        ref={field.ref}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      >
                        <option value="">Selecciona una categoría</option>
                        {categories.map((c) => (
                          <option key={c.id} value={String(c.id)}>{c.name ?? c.slug}</option>
                        ))}
                      </select>
                    )}
                  />
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
                  <button
                    type="button"
                    className="add-line"
                    onClick={() => append({ name: "", amount: undefined as unknown as number })}
                  >
                    {Ic.plus} Agregar otra tarifa
                  </button>
                  <div className="help" style={{ marginTop: 12 }}>
                    Los valores son informativos. La compra de entradas se realiza fuera de Konbini.
                  </div>
                </div>
              )}
            </fieldset>
          </form>

          <div className="form-foot">
            <div className="container">
              <button type="button" className="btn ghost" disabled style={{ opacity: 0.3 }}>
                {Ic.chevL} Volver
              </button>
              <button type="submit" form="crear-form" className="btn primary">
                Continuar {Ic.arrow}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
