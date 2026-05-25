"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { Ic } from "@/components/icons";
import { useUser } from "@/components/providers";
import { api, imageUrl, type CreateEventInput } from "@/lib/api";
import { useForm as useFormCtx, type ImageSlot } from "../FormContext";

const PASO = 4;

async function uploadSlot(slot: ImageSlot, token: string): Promise<string | undefined> {
  if (!slot) return undefined;
  if (slot.kind === "uploaded") return slot.url;
  const { url } = await api.uploadImage(slot.file, token);
  return url;
}

function useHeadroomRef() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const el = ref.current;
      if (el) {
        if (y < 80) el.style.transform = "";
        else if (y > lastY + 4) el.style.transform = "translateY(-100%)";
        else if (lastY > y + 4) el.style.transform = "";
      }
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return ref;
}

export function Step4Client() {
  const router = useRouter();
  const pathname = usePathname();
  const headerRef = useHeadroomRef();
  const { values, resetForm } = useFormCtx();
  const { user, ready, token } = useUser();
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (ready && !user) router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
  }, [ready, user, router, pathname]);

  const summary = [
    {
      title: "Información básica", step: 1,
      rows: [
        ["Título", values.title || "—"],
        ["Empresa", values.company || "—"],
        ["Descripción", values.desc ? (values.desc.length > 80 ? values.desc.slice(0, 80) + "…" : values.desc) : "—"],
        ["Precio", values.free ? "Evento gratuito" : `${values.prices.filter(p => p.name).length} tarifa(s)`],
      ],
    },
    {
      title: "Fechas y ubicación", step: 2,
      rows: [
        ["Funciones", `${values.dates.filter(d => d.date).length} día(s)`],
        ["Dirección", values.address || "—"],
        ["Sitio web", values.web || "—"],
        ["Redes", `${values.socials.filter(Boolean).length} red(es)`],
      ],
    },
    {
      title: "Multimedia", step: 3,
      rows: [
        ["Banner", values.banner ? "✓ Cargado" : "Pendiente"],
        ["Poster", values.poster ? "✓ Cargado" : "Pendiente"],
        ["Galería", `${values.gallery.filter(Boolean).length} / 10 imágenes`],
        ["Videos", `${values.videos.filter(Boolean).length} URL(s)`],
      ],
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) { setSubmitError("Debes confirmar que la información es correcta"); return; }
    if (!token) { setSubmitError("Debes iniciar sesión"); return; }
    setSubmitError("");
    setSubmitting(true);
    try {
      const [bannerUrl, posterUrl, galleryUrls] = await Promise.all([
        uploadSlot(values.banner, token),
        uploadSlot(values.poster, token),
        Promise.all(values.gallery.map((g) => uploadSlot(g, token))),
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
                         ? galleryUrls.filter((u): u is string => !!u)
                         : undefined,
        regionId:    values.regionId  ? Number(values.regionId)  : undefined,
        communeId:   values.communeId ? Number(values.communeId) : undefined,
        categoryIds: values.categoryId ? [Number(values.categoryId)] : undefined,
        prices:      values.free
          ? []
          : values.prices
              .filter((p) => p.name.trim())
              .map((p) => ({ name: p.name.trim(), price: Number(p.amount) || 0 })),
        dates:       values.dates
          .filter((dt) => dt.date)
          .map((dt) => ({ date: dt.date, startTime: dt.start || undefined, endTime: dt.end || undefined })),
        socialLinks: values.socials.filter((s) => s.trim()).map((s) => ({ link: s.trim() })),
        videos:      values.videos.filter((v) => v.trim()).map((v) => ({ link: v.trim() })),
      };

      await api.createEvent(payload, token);
      resetForm();
      router.push("/upsell");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "No se pudo publicar el evento");
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready || !user) {
    return (
      <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
        {ready ? "Redirigiendo al inicio de sesión…" : "Verificando acceso…"}
      </main>
    );
  }

  return (
    <main style={{ paddingTop: 64 }}>
      <header className="pub-header" ref={headerRef} style={{ transition: "transform .3s ease" }}>
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

          <form id="step4-form" onSubmit={handleSubmit}>
            <h1 className="step-title">Revisa tu evento.</h1>
            <p className="step-lead">
              Una vez enviado, el evento <strong>no podrá ser editado</strong>. Asegúrate de que todo esté correcto antes de continuar.
            </p>

            {/* Warning */}
            <div style={{ background: "color-mix(in oklab, var(--warn) 10%, var(--surface))", border: "1px solid color-mix(in oklab, var(--warn) 40%, var(--line))", borderRadius: 14, padding: 18, display: "flex", gap: 14, alignItems: "center", marginBottom: 28 }}>
              <div style={{ width: 36, height: 36, borderRadius: 999, background: "var(--warn)", color: "#14110d", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0, fontSize: 18 }}>!</div>
              <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.5 }}>
                <strong>Revisa bien tu información.</strong> Si necesitas corregir algo, usa los botones "Editar" debajo. Una vez enviado a revisión, no podrás modificar el evento — solo eliminarlo.
              </div>
            </div>

            {/* Summary sections */}
            {summary.map((s) => (
              <fieldset key={s.title}>
                <div className="field-set-title" style={{ justifyContent: "space-between", display: "flex" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="n">{s.step}</span>{s.title}
                  </span>
                  <button
                    type="button"
                    className="btn ghost"
                    style={{ padding: "6px 14px", fontSize: 12 }}
                    onClick={() => router.push(`/crear/${s.step}`)}
                  >
                    Editar paso {s.step}
                  </button>
                </div>
                <div style={{ background: "var(--surface-2)", borderRadius: 12, padding: 6 }}>
                  {s.rows.map((r) => (
                    <div key={r[0]} style={{ display: "flex", padding: "12px 14px", borderBottom: "1px solid var(--line)" }}>
                      <div style={{ flex: "0 0 180px", color: "var(--ink-3)", fontSize: 12, fontFamily: "var(--font-mono)", letterSpacing: ".05em", textTransform: "uppercase" }}>{r[0]}</div>
                      <div style={{ flex: 1, fontWeight: 500, fontSize: 14 }}>{r[1]}</div>
                    </div>
                  ))}
                </div>
              </fieldset>
            ))}

            {/* Confirmation checkbox */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 22, marginTop: 16 }}>
              <div className="ck-row" style={{ background: "transparent", border: 0, padding: 0 }} onClick={() => setConfirmed(c => !c)}>
                <div className={`ck ${confirmed ? "on" : ""}`}>
                  {confirmed && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Confirmo que la información es correcta y aceptable</div>
                  <div style={{ color: "var(--ink-3)", fontSize: 12, marginTop: 2 }}>Konbini puede rechazar el evento si la información es engañosa o incompleta.</div>
                </div>
              </div>
            </div>

            {submitError && (
              <div style={{ color: "var(--err)", fontSize: 13, margin: "14px 0 0" }}>{submitError}</div>
            )}
          </form>

          <div className="form-foot">
            <div className="container">
              <button type="button" className="btn ghost" onClick={() => router.push("/crear/3")}>
                {Ic.chevL} Volver
              </button>
              <div className="row" style={{ gap: 14 }}>
                <button
                  type="submit"
                  form="step4-form"
                  className="btn primary"
                  disabled={submitting || !confirmed}
                  onClick={handleSubmit}
                >
                  {submitting ? "Enviando…" : "Enviar evento a revisión"} {Ic.arrow}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
