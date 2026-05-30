"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser } from "@/components/providers";
import { api, imageUrl } from "@/lib/api";
import { MarkdownEditor } from "@/components/MarkdownEditor";

// ── Zod schema ────────────────────────────────────────────────────────────────

const articleSchema = z.object({
  title:      z.string().min(3, "Mínimo 3 caracteres"),
  slug:       z.string().optional().or(z.literal("")),
  excerpt:    z.string().optional().or(z.literal("")),
  content:    z.string().min(10, "El contenido es requerido (mín. 10 caracteres)"),
  youtubeUrl: z.string().optional().or(z.literal("")),
  eventId:    z.string().optional().or(z.literal("")),
  status:     z.enum(["APPROVED", "PENDING_MODERATION", "DRAFT"]),
});
type ArticleValues = z.infer<typeof articleSchema>;

// ── Tipos ─────────────────────────────────────────────────────────────────────

type ImageSlot = { file: File | null; url: string };
type Tag = { id: number; name: string; slug: string };
type Cat = { id: number; name: string | null; slug: string };
type EventMine = { id: number; title: string; status: string };

export type InitialArticle = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image: string | null;
  youtubeUrl: string | null;
  status: string;
  tags: Tag[];
  articleTags?: Tag[];
  articleCategories?: { id: number; name: string | null; slug: string }[];
  events?: { id: number; title: string }[];
};

interface Props {
  mode: "create" | "edit";
  variant: "admin" | "sponsored";
  initial?: InitialArticle;
}

// ── AccItem ────────────────────────────────────────────────────────────────────

function AccItem({ n, title, meta, open, onToggle, children }: {
  n: string | number;
  title: string;
  meta?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`form-acc-item${open ? " open" : ""}`}>
      <div className="form-acc-head" onClick={onToggle}>
        <div className="form-acc-num">{n}</div>
        <div style={{ flex: 1 }}>
          <span className="form-acc-title">{title}</span>
          {meta && <span className="form-acc-meta">{meta}</span>}
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ opacity: .5, transition: "transform .2s", transform: open ? "rotate(180deg)" : "none" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {open && <div className="form-acc-body">{children}</div>}
    </div>
  );
}

// ── ImageUploadBox ─────────────────────────────────────────────────────────────

function ImageUploadBox({ slot, onPick, onRemove, label, hint }: {
  slot: ImageSlot;
  onPick: (file: File) => void;
  onRemove: () => void;
  label: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewSrc = slot.file ? URL.createObjectURL(slot.file) : slot.url ? imageUrl(slot.url) : "";

  useEffect(() => {
    if (!slot.file) return;
    const u = URL.createObjectURL(slot.file);
    return () => URL.revokeObjectURL(u);
  }, [slot.file]);

  if (previewSrc) {
    return (
      <div style={{ position: "relative", aspectRatio: "16/9", borderRadius: "var(--r)", overflow: "hidden", background: "var(--surface-2)" }}>
        <img src={previewSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <button type="button" onClick={onRemove} aria-label="Eliminar imagen" className="icon-btn"
          style={{ position: "absolute", top: 8, right: 8, width: 32, height: 32, background: "rgba(15,12,10,.75)", color: "#fff", borderColor: "rgba(255,255,255,.15)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="upload-box" style={{ aspectRatio: "16/9" }} onClick={() => inputRef.current?.click()}>
        <div className="ic">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
        </div>
        <div style={{ fontWeight: 500, color: "var(--ink-2)", fontSize: 14 }}>{label}</div>
        {hint && <small style={{ fontSize: 11 }}>{hint}</small>}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }}
      />
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ArticleForm({ mode, variant, initial }: Props) {
  const router = useRouter();
  const { token, user } = useUser();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [image, setImage] = useState<ImageSlot>({ file: null, url: initial?.image ?? "" });
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>((initial?.articleTags ?? initial?.tags)?.map(t => t.id) ?? []);
  const [tagSearch, setTagSearch] = useState("");
  const [cats, setCats] = useState<Cat[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(initial?.articleCategories?.map(c => c.id) ?? []);
  const [catSearch, setCatSearch] = useState("");
  const [myEvents, setMyEvents] = useState<EventMine[]>([]);
  const [sponsoredLocal, setSponsoredLocal] = useState(false);
  const [open, setOpen] = useState<Record<number, boolean>>({ 1: true });
  const toggle = (n: number) => setOpen(o => ({ ...o, [n]: !o[n] }));

  const isSponsored = variant === "sponsored" || sponsoredLocal;
  const redirectTo = variant === "admin" ? "/dashboard/articles" : "/cuenta/articulos";

  let initStatus: ArticleValues["status"] = variant === "admin" ? "PENDING_MODERATION" : "DRAFT";
  if (initial?.status === "APPROVED") initStatus = "APPROVED";
  else if (initial?.status === "DRAFT") initStatus = "DRAFT";

  const { register, control, handleSubmit, watch, getValues, setValue, formState: { errors } } = useForm<ArticleValues>({
    resolver: zodResolver(articleSchema),
    mode: "onTouched",
    defaultValues: {
      title:      initial?.title      ?? "",
      slug:       initial?.slug       ?? "",
      excerpt:    initial?.excerpt    ?? "",
      content:    initial?.content    ?? "",
      youtubeUrl: initial?.youtubeUrl ?? "",
      eventId:    initial?.events?.[0]?.id ? String(initial.events[0].id) : "",
      status:     initStatus,
    },
  });

  const watchStatus = watch("status");
  const watchTitle = watch("title");
  const watchContent = watch("content");
  const watchSlug = watch("slug");

  // Auto-generate slug from title unless user has manually edited it
  const slugLockedRef = useRef(!!initial?.slug);
  useEffect(() => {
    if (slugLockedRef.current) return;
    const auto = watchTitle.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
    setValue("slug", auto, { shouldDirty: false });
  }, [watchTitle, setValue]);

  useEffect(() => {
    fetch("/api/article-tags").then(r => r.json()).then(d => setTags(Array.isArray(d) ? d : [])).catch(() => setTags([]));
  }, []);

  useEffect(() => {
    fetch("/api/article-categories").then(r => r.json()).then(d => setCats(Array.isArray(d) ? d : [])).catch(() => setCats([]));
  }, []);

  useEffect(() => {
    if (!isSponsored || !token) return;
    fetch("/api/events/mine", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setMyEvents(Array.isArray(d) ? d : []))
      .catch(() => setMyEvents([]));
  }, [isSponsored, token]);

  const toggleTag = (id: number) => setSelectedTagIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  const toggleCat = (id: number) => setSelectedCategoryIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  const filteredTags = tags.filter(t => !tagSearch.trim() || t.name.toLowerCase().includes(tagSearch.toLowerCase()));
  const filteredCats = cats.filter(c => !catSearch.trim() || (c.name ?? "").toLowerCase().includes(catSearch.toLowerCase()));

  const aiSuggestTags = () => {
    if (!watchTitle && !watchContent) { toast.error("Ingresa título o contenido primero"); return; }
    setAiBusy(true);
    setTimeout(() => {
      setAiBusy(false);
      toast.info("Sugerencia de IA próximamente — integración con backend pendiente");
    }, 800);
  };

  const aiCorrect = () => {
    if (!watchContent) { toast.error("Ingresa el contenido primero"); return; }
    toast.info("Corrección con IA próximamente — integración con backend pendiente");
  };

  const onSubmit = async (values: ArticleValues) => {
    if (!token) { toast.error("No autenticado"); return; }
    setBusy(true);
    try {
      let imageUrlPath = image.url;
      if (image.file) {
        const r = await api.uploadImage(image.file, token);
        imageUrlPath = r.url;
        setImage({ file: null, url: r.url });
      }

      const basePayload = {
        title:      values.title.trim(),
        slug:       values.slug?.trim() || undefined,
        excerpt:    values.excerpt?.trim() || undefined,
        content:    values.content.trim(),
        image:      imageUrlPath || undefined,
        youtubeUrl: values.youtubeUrl?.trim() || undefined,
        articleTagIds: selectedTagIds.length ? selectedTagIds : undefined,
        articleCategoryIds: selectedCategoryIds.length ? selectedCategoryIds : undefined,
      };

      let url: string;
      let method: "POST" | "PATCH";
      let payload: Record<string, unknown> = basePayload;

      if (mode === "edit") {
        url = `/api/articles/${initial!.id}`;
        method = "PATCH";
      } else if (variant === "sponsored") {
        url = "/api/articles/sponsored";
        method = "POST";
        if (values.eventId) payload = { ...basePayload, eventId: Number(values.eventId) };
      } else {
        url = "/api/articles";
        method = "POST";
      }

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

      if (variant === "admin" && values.status === "APPROVED" && saved.status !== "APPROVED") {
        await fetch(`/api/articles/${saved.id}/approve`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      toast.success(mode === "create" ? "Artículo creado" : "Artículo actualizado");
      router.push(redirectTo);
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al guardar");
    } finally {
      setBusy(false);
    }
  };

  const ctaLabel = busy
    ? "Guardando…"
    : variant === "admin"
      ? (mode === "create"
          ? (watchStatus === "APPROVED" ? "Crear y publicar →" : watchStatus === "PENDING_MODERATION" ? "Crear en revisión →" : "Crear borrador →")
          : (watchStatus === "APPROVED" ? "Guardar y publicar →" : watchStatus === "PENDING_MODERATION" ? "Guardar en revisión →" : "Guardar borrador →"))
      : (mode === "create" ? "Solicitar artículo →" : "Guardar cambios →");

  // Metas para acordeón
  const meta1 = watchTitle ? `· "${watchTitle.slice(0, 30)}"` : "Título, categoría, resumen";
  const meta2 = watchContent ? `${watchContent.length} caracteres` : "Editor Markdown";
  const meta3 = image.url || image.file ? "Imagen ✓" : "Imagen principal, video";
  const meta4 = selectedTagIds.length ? `${selectedTagIds.length} tags` : "Opcional";

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>

      <Link href={redirectTo} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink-3)", fontSize: 13, marginBottom: 18 }}>
        ◀ Volver a artículos
      </Link>

      {/* Admin top panel */}
      {variant === "admin" && isAdmin && (
        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="field" style={{ margin: 0 }}>
            <label>Estado al guardar</label>
            <select {...register("status")}>
              <option value="APPROVED">Publicado (directo)</option>
              <option value="PENDING_MODERATION">En revisión</option>
              <option value="DRAFT">Borrador</option>
            </select>
            <div className="help">Como admin puedes publicar de inmediato sin pasar por revisión.</div>
          </div>
          <div
            className="ck-row"
            style={{ marginTop: 14, cursor: "pointer" }}
            onClick={() => setSponsoredLocal(v => !v)}
          >
            <span className={`ck ${sponsoredLocal ? "on" : ""}`}>
              {sponsoredLocal && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Marcar como Artículo patrocinado</div>
              <div style={{ color: "var(--ink-3)", fontSize: 12 }}>Aparecerá con badge &quot;Artículo patrocinado&quot; en el sitio.</div>
            </div>
          </div>
        </div>
      )}

      <div className="form-acc">
        {/* 1 — Información básica */}
        <AccItem n="1" title="Información básica" meta={meta1} open={!!open[1]} onToggle={() => toggle(1)}>
          <div className="field">
            <label>Título <span style={{ color: "var(--err)" }}>*</span></label>
            <input type="text" placeholder="Ej: Demon Slayer confirma estreno mundial" maxLength={200} {...register("title")} />
            {errors.title?.message && <div style={{ color: "var(--err)", fontSize: 12, marginTop: 5 }}>{errors.title.message}</div>}
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Slug <small style={{ color: "var(--ink-3)" }}>(auto)</small></label>
              <input type="text" placeholder="demon-slayer-estreno-mundial" {...register("slug")} onInput={() => { slugLockedRef.current = true; }} />
            </div>
            <div className="field">
              <label>Tiempo de lectura (min)</label>
              <input type="number" placeholder="5" min="1" max="60" />
              <div className="help">No se guarda aún — pendiente soporte en API.</div>
            </div>
          </div>

          <div className="field">
            <label>Resumen / Bajada</label>
            <textarea rows={2} placeholder="2-3 líneas que aparecen en el listado y debajo del título." maxLength={200} {...register("excerpt")} />
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label>Categorías <small style={{ color: "var(--ink-3)" }}>({selectedCategoryIds.length} seleccionadas)</small></label>
            <input type="text" placeholder="Buscar categoría…" value={catSearch} onChange={(e) => setCatSearch(e.target.value)} />
            <div style={{ marginTop: 8, maxHeight: 160, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 8, padding: 8 }}>
              {filteredCats.length === 0 ? (
                <div style={{ color: "var(--ink-3)", fontSize: 12, textAlign: "center", padding: 12 }}>Sin categorías</div>
              ) : filteredCats.map((c) => (
                <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
                  <input type="checkbox" checked={selectedCategoryIds.includes(c.id)} onChange={() => toggleCat(c.id)} />
                  <span>{c.name}</span>
                </label>
              ))}
            </div>
          </div>
        </AccItem>

        {/* 2 — Contenido */}
        <AccItem n="2" title="Contenido del artículo" meta={meta2} open={!!open[2]} onToggle={() => toggle(2)}>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>Contenido <span style={{ color: "var(--err)" }}>*</span></label>
            <Controller
              control={control}
              name="content"
              render={({ field }) => (
                <MarkdownEditor
                  value={field.value}
                  onChange={field.onChange}
                  helpText="El editor trabaja en Markdown — **negrita**, *cursiva*, ## títulos, > citas, listas, links."
                />
              )}
            />
            {errors.content?.message && <div style={{ color: "var(--err)", fontSize: 12, marginTop: 5 }}>{errors.content.message}</div>}
          </div>

          {/* AI correction block */}
          <div style={{ background: "color-mix(in oklab, var(--accent) 6%, var(--surface-2))", border: "1px solid color-mix(in oklab, var(--accent) 25%, var(--line))", borderRadius: 12, padding: 14, display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: 999, background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
              ✦
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Corrección con IA</div>
              <div style={{ color: "var(--ink-3)", fontSize: 12 }}>Sugiere una versión revisada en estilo editorial Konbini. El original siempre se preserva.</div>
            </div>
            <button type="button" className="btn dark" style={{ padding: "8px 14px", fontSize: 12, flexShrink: 0 }} onClick={aiCorrect}>
              Revisar con IA
            </button>
          </div>
        </AccItem>

        {/* 3 — Multimedia */}
        <AccItem n="3" title="Multimedia" meta={meta3} open={!!open[3]} onToggle={() => toggle(3)}>
          <div className="field">
            <label>Imagen principal <span style={{ color: "var(--err)" }}>*</span></label>
            <ImageUploadBox
              slot={image}
              onPick={(f) => setImage({ file: f, url: image.url })}
              onRemove={() => setImage({ file: null, url: "" })}
              label="Sube una imagen horizontal"
              hint="JPG / PNG / WebP · 1600×900 mín · máx 5MB"
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Video destacado (YouTube)</label>
            <div className="input-prefix">
              <span>▶</span>
              <input type="url" placeholder="https://youtube.com/watch?v=..." {...register("youtubeUrl")} />
            </div>
            <div className="help">Se mostrará embebido debajo de la imagen principal.</div>
          </div>
        </AccItem>

        {/* 4 — Tags y vinculaciones */}
        <AccItem n="4" title="Tags y vinculaciones" meta={meta4} open={!!open[4]} onToggle={() => toggle(4)}>
          <div className="field">
            <label>Tags <small style={{ color: "var(--ink-3)" }}>({selectedTagIds.length} seleccionados)</small></label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Buscar tag…"
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                className="icon-btn"
                title="Sugerir tags con IA"
                onClick={aiSuggestTags}
                style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }}
              >
                <span style={{ animation: aiBusy ? "spin 1s linear infinite" : "none", display: "inline-block" }}>✦</span>
              </button>
            </div>
            <div style={{ marginTop: 8, maxHeight: 180, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 8, padding: 8 }}>
              {filteredTags.length === 0 ? (
                <div style={{ color: "var(--ink-3)", fontSize: 12, textAlign: "center", padding: 12 }}>Sin tags</div>
              ) : filteredTags.map((t) => (
                <label key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
                  <input type="checkbox" checked={selectedTagIds.includes(t.id)} onChange={() => toggleTag(t.id)} />
                  <span>{t.name}</span>
                </label>
              ))}
            </div>
            <div className="help">Los tags conectan el artículo con eventos y otros artículos.</div>
          </div>

          {isSponsored && (
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Evento vinculado <small style={{ color: "var(--ink-3)" }}>(artículo patrocinado)</small></label>
              <select {...register("eventId")}>
                <option value="">Sin evento vinculado</option>
                {myEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title} · {ev.status}</option>
                ))}
              </select>
              <div className="help">Aparecerá destacado en el bloque de eventos relacionados del artículo.</div>
            </div>
          )}
        </AccItem>
      </div>

      {/* Sticky footer */}
      <div style={{
        position: "sticky", bottom: 0, marginTop: 24,
        padding: "18px 0",
        borderTop: "1px solid var(--line)",
        background: "color-mix(in oklab, var(--bg) 92%, transparent)",
        backdropFilter: "blur(8px)",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10,
      }}>
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
          {variant === "admin"
            ? mode === "create" ? "Creando como admin · sin moderación obligatoria." : `Editando artículo #${initial?.id}`
            : mode === "create" ? "Pasa por revisión editorial antes de publicar." : `Editando tu artículo #${initial?.id}`}
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href={redirectTo} className="btn ghost">Cancelar</Link>
          {variant === "admin" && (
            <button type="button" className="btn dark" disabled={busy} onClick={() => { /* set draft then submit */ handleSubmit(onSubmit)(); }}>
              Guardar borrador
            </button>
          )}
          <button type="button" className="btn primary" disabled={busy} onClick={() => handleSubmit(onSubmit)()}>
            {ctaLabel}
          </button>
        </div>
      </div>

    </div>
  );
}
