"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BrandMark } from "@/components/BrandMark";
import { Ic } from "@/components/icons";
import { useUser } from "@/components/providers";
import { imageUrl } from "@/lib/api";
import { useForm as useFormCtx, type ImageSlot } from "../FormContext";
import { step3Schema, type Step3Values } from "../schemas";
import { FieldError, noSpaces, urlChange, useHeadroom } from "../shared";

const PASO = 3;

// ─── Uploader — imágenes en memoria hasta el submit ───────────────────────────

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
    value?.kind === "pending"  ? value.preview :
    value?.kind === "uploaded" ? imageUrl(value.url) : null;

  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: "block" }}>{label}</label>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={onFile} />
      {src ? (
        <div className={`upload-box ${tall ? "tall" : ""}`} style={{ padding: 0, overflow: "hidden", position: "relative" }}>
          <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <button
            type="button"
            className="icon-btn"
            onClick={() => {
              if (value?.kind === "pending") URL.revokeObjectURL(value.preview);
              onChange(null);
            }}
            style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,.6)", color: "white" }}
          >
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

// ─── Componente principal ─────────────────────────────────────────────────────

export function Step3Client() {
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
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<Step3Values>({
    resolver: zodResolver(step3Schema),
    mode: "onTouched",
    defaultValues: {
      videos: values.videos.map((v) => ({ val: v })),
    },
  });

  // Sincronizar videos con FormContext
  useEffect(() => {
    const { unsubscribe } = watch((d) => {
      updateStep({ videos: d.videos?.map((v) => v?.val ?? "") });
    });
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { fields: videoFields, append, remove } = useFieldArray({ control, name: "videos" });

  // Galería — se maneja directamente en FormContext (no en RHF)
  const galRef = useRef<HTMLInputElement>(null);
  const [galErr, setGalErr] = useState("");

  const onGalleryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setGalErr("");
    if (file.size > 5 * 1024 * 1024) { setGalErr("La imagen no debe superar 5 MB."); return; }
    update("gallery", [...values.gallery, { kind: "pending", file, preview: URL.createObjectURL(file) }]);
  };

  const onDone = (d: Step3Values) => {
    updateStep({
      videos: d.videos?.map((v) => v?.val ?? "") ?? [],
    });
    router.push("/crear/4");
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
            PASO {PASO} DE 4
          </span>
        </div>
      </header>

      <div className="container">
        <div className="form-shell">
          <div className="form-stepbar">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className={`seg ${n < PASO ? "done" : ""} ${n === PASO ? "curr" : ""}`} />
            ))}
          </div>
          <div className="step-num">PASO {PASO} / 04</div>

          <form id="crear-form" onSubmit={handleSubmit(onDone)}>
            <h1 className="step-title">Imágenes y video.</h1>
            <p className="step-lead">
              Una buena imagen es decisiva. El banner destaca el evento; el poster va en los listados verticales.
            </p>

            {/* 3.1 Imágenes principales */}
            <fieldset>
              <div className="field-set-title"><span className="n">3.1</span> Imágenes principales</div>
              <div className="upload-grid">
                <ImageUploader
                  label="Banner (horizontal · 16:9)"
                  value={values.banner}
                  onChange={(s) => update("banner", s)}
                />
                <ImageUploader
                  label="Poster (vertical · 2:3)"
                  value={values.poster}
                  onChange={(s) => update("poster", s)}
                  tall
                />
              </div>
            </fieldset>

            {/* 3.2 Galería */}
            <fieldset>
              <div className="field-set-title"><span className="n">3.2</span> Galería</div>
              <input
                ref={galRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={onGalleryFile}
              />
              <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {values.gallery.map((slot, i) => {
                  const src =
                    slot?.kind === "pending"  ? slot.preview :
                    slot?.kind === "uploaded" ? imageUrl(slot.url) : null;
                  return src ? (
                    <div
                      key={i}
                      className="upload-box"
                      style={{ aspectRatio: "1/1", padding: 0, overflow: "hidden", position: "relative" }}
                    >
                      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => {
                          if (slot?.kind === "pending") URL.revokeObjectURL(slot.preview);
                          update("gallery", values.gallery.filter((_, j) => j !== i));
                        }}
                        style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,.6)", color: "white" }}
                      >
                        {Ic.close}
                      </button>
                    </div>
                  ) : null;
                })}
                {values.gallery.length < 10 && (
                  <div
                    className="upload-box"
                    style={{ aspectRatio: "1/1", padding: 14 }}
                    onClick={() => galRef.current?.click()}
                  >
                    <div className="ic" style={{ width: 28, height: 28 }}>{Ic.plus}</div>
                    <small style={{ fontSize: 10 }}>Agregar</small>
                  </div>
                )}
              </div>
              {galErr && <div style={{ color: "var(--err)", fontSize: 12, marginTop: 8 }}>{galErr}</div>}
              <div className="help" style={{ marginTop: 10 }}>
                Hasta 10 imágenes. Aparecen en la sección &quot;Galería&quot; del evento.
              </div>
            </fieldset>

            {/* 3.3 Videos */}
            <fieldset>
              <div className="field-set-title"><span className="n">3.3</span> Videos</div>
              {videoFields.map((field, i) => {
                const reg = register(`videos.${i}.val`);
                return (
                  <div key={field.id} style={{ marginBottom: 10 }}>
                    <div className="row">
                      <div className="input-prefix" style={{ flex: 1 }}>
                        <span>▶</span>
                        <input
                          type="url"
                          autoComplete="url"
                          placeholder="https://youtube.com/watch?v=..."
                          onKeyDown={noSpaces}
                          {...reg}
                          onChange={urlChange(reg.onChange)}
                        />
                      </div>
                      {videoFields.length > 1 && (
                        <button type="button" className="icon-btn" onClick={() => remove(i)}>{Ic.close}</button>
                      )}
                    </div>
                    <FieldError msg={errors.videos?.[i]?.val?.message} />
                  </div>
                );
              })}
              <button type="button" className="add-line" onClick={() => append({ val: "" })}>
                {Ic.plus} Agregar otro video
              </button>
            </fieldset>

            {/* Nota de revisión */}
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

          <div className="form-foot">
            <div className="container">
              <button type="button" className="btn ghost" onClick={() => router.push("/crear/2")}>
                {Ic.chevL} Volver
              </button>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" className="btn ghost" onClick={() => toast.success("Borrador guardado ✓")}>
                  Guardar borrador
                </button>
                <button type="submit" form="crear-form" className="btn primary">
                  Continuar {Ic.arrow}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
