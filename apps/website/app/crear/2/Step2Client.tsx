"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BrandMark } from "@/components/BrandMark";
import { Ic } from "@/components/icons";
import { useUser } from "@/components/providers";
import { api, type ApiRegion, type ApiCommune } from "@/lib/api";
import { useForm as useFormCtx, type FormValues } from "../FormContext";
import { step2Schema, type Step2Values } from "../schemas";
import { FieldError, todayISO, onlyDigits, noSpaces, urlChange, useHeadroom } from "../shared";

const PASO = 2;

export function Step2Client({ regions }: { regions: ApiRegion[] }) {
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

  // Comunas — se cargan en el cliente porque dependen de la región seleccionada
  const [communes, setCommunes] = useState<ApiCommune[]>([]);
  useEffect(() => {
    const region = regions.find((r) => String(r.id) === values.regionId);
    if (!region) { setCommunes([]); return; }
    api.communes(region.slug).then(setCommunes).catch(() => setCommunes([]));
  }, [values.regionId, regions]);

  // ── RHF ────────────────────────────────────────────────────────────────────
  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    mode: "onTouched",
    defaultValues: {
      dates:         values.dates,
      address:       values.address,
      addressNumber: values.addressNumber,
      regionId:      values.regionId,
      communeId:     values.communeId,
      web:           values.web,
      socials:       values.socials.map((s) => ({ val: s })),
    },
  });

  // Sincronizar con FormContext (y localStorage) en cada cambio
  useEffect(() => {
    const { unsubscribe } = watch((d) => {
      updateStep({
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

  const datesRootError = (errors.dates as { message?: string } | undefined)?.message;

  const onDone = (d: Step2Values) => {
    update("dates",         d.dates);
    update("address",       d.address);
    update("addressNumber", d.addressNumber);
    update("regionId",      d.regionId ?? "");
    update("communeId",     d.communeId ?? "");
    update("web",           d.web ?? "");
    update("socials",       d.socials.map((s) => s.val));
    router.push("/crear/3");
  };

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (!ready || !user) {
    return (
      <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
        {ready ? "Redirigiendo al inicio de sesión…" : "Verificando acceso…"}
      </main>
    );
  }

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

          <form id="crear-form" onSubmit={handleSubmit(onDone)}>
            <h1 className="step-title">Horarios, ubicación y links.</h1>
            <p className="step-lead">Indica dónde y cuándo ocurre el evento, y dónde enviar a los asistentes.</p>

            {/* 2.1 Fechas */}
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

            {/* 2.2 Ubicación */}
            <fieldset>
              <div className="field-set-title"><span className="n">2.2</span> Ubicación</div>

              <div className="grid-2">
                <div className="field">
                  <label>Región</label>
                  {/*
                    Controller con value explícito — las opciones vienen por SSR,
                    así el valor guardado se restaura correctamente al montar.
                  */}
                  <Controller
                    control={control}
                    name="regionId"
                    render={({ field }) => (
                      <select
                        name={field.name}
                        ref={field.ref}
                        value={field.value ?? ""}
                        onBlur={field.onBlur}
                        onChange={(e) => {
                          field.onChange(e);
                          update("regionId", e.target.value);
                        }}
                      >
                        <option value="">Selecciona una región</option>
                        {regions.map((r) => (
                          <option key={r.id} value={String(r.id)}>{r.name}</option>
                        ))}
                      </select>
                    )}
                  />
                </div>
                <div className="field">
                  <label>Comuna</label>
                  {/*
                    Controller con value explícito — las opciones se cargan async (dependen
                    de la región elegida), así el valor guardado se restaura cuando aparecen.
                  */}
                  <Controller
                    control={control}
                    name="communeId"
                    render={({ field }) => (
                      <select
                        name={field.name}
                        ref={field.ref}
                        value={field.value ?? ""}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        disabled={communes.length === 0}
                      >
                        <option value="">
                          {communes.length ? "Selecciona una comuna" : "Elige una región primero"}
                        </option>
                        {communes.map((c) => (
                          <option key={c.id} value={String(c.id)}>{c.name}</option>
                        ))}
                      </select>
                    )}
                  />
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
                  {/* onKeyDown bloquea letras — imposible escribir texto en este campo */}
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="890"
                    maxLength={8}
                    onKeyDown={onlyDigits}
                    {...register("addressNumber")}
                  />
                  <FieldError msg={errors.addressNumber?.message} />
                </div>
              </div>
            </fieldset>

            {/* 2.3 Links */}
            <fieldset>
              <div className="field-set-title"><span className="n">2.3</span> Enlaces importantes</div>

              <div className="field">
                <label>Sitio de venta de entradas / Ticketera</label>
                <div className="input-prefix">
                  <span>https://</span>
                  {(() => {
                    const reg = register("web");
                    return (
                      <input
                        type="text"
                        inputMode="url"
                        autoComplete="url"
                        placeholder="ticketera.cl/tu-evento"
                        onKeyDown={noSpaces}
                        {...reg}
                        onChange={urlChange(reg.onChange)}
                      />
                    );
                  })()}
                </div>
                <FieldError msg={errors.web?.message} />
                <div className="help">Los asistentes serán dirigidos a este enlace para comprar entradas.</div>
              </div>

              <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: "block" }}>
                Redes sociales
              </label>
              {socialFields.map((field, i) => {
                const reg = register(`socials.${i}.val`);
                return (
                  <div key={field.id} style={{ marginBottom: 10 }}>
                    <div className="row">
                      <div className="input-prefix" style={{ flex: 1 }}>
                        <span>@</span>
                        <input
                          type="text"
                          inputMode="url"
                          autoComplete="url"
                          placeholder="instagram.com/tu-evento"
                          onKeyDown={noSpaces}
                          {...reg}
                          onChange={urlChange(reg.onChange)}
                        />
                      </div>
                      {socialFields.length > 1 && (
                        <button type="button" className="icon-btn" onClick={() => removeSocial(i)}>{Ic.close}</button>
                      )}
                    </div>
                    <FieldError msg={errors.socials?.[i]?.val?.message} />
                  </div>
                );
              })}
              <button type="button" className="add-line" onClick={() => addSocial({ val: "" })}>
                {Ic.plus} Agregar otra red social
              </button>
            </fieldset>
          </form>

          <div className="form-foot">
            <div className="container">
              <button type="button" className="btn ghost" onClick={() => router.push("/crear/1")}>
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
