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
  tags: Tag[];          // legacy — backend lo sigue devolviendo durante la transición
  articleTags?: Tag[];  // Phase 18+ — se prefiere sobre tags
  events?: { id: number; title: string }[];
};

interface Props {
  mode: "create" | "edit";
  variant: "admin" | "sponsored";
  initial?: InitialArticle;
}

// ── ImageUploadBox (banner 16:9 — replicado de EventForm, solo variant banner) ─

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
      <div className="upload-box" onClick={() => inputRef.current?.click()}>
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
  const [image, setImage] = useState<ImageSlot>({ file: null, url: initial?.image ?? "" });
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>((initial?.articleTags ?? initial?.tags)?.map(t => t.id) ?? []);
  const [tagSearch, setTagSearch] = useState("");
  const [myEvents, setMyEvents] = useState<EventMine[]>([]);

  const redirectTo = variant === "admin" ? "/dashboard/articles" : "/cuenta/articulos";

  let initStatus: ArticleValues["status"] = variant === "admin" ? "PENDING_MODERATION" : "DRAFT";
  if (initial?.status === "APPROVED") initStatus = "APPROVED";
  else if (initial?.status === "DRAFT") initStatus = "DRAFT";

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<ArticleValues>({
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

  // Load tags
  useEffect(() => {
    fetch("/api/article-tags").then(r => r.json()).then(d => setTags(Array.isArray(d) ? d : [])).catch(() => setTags([]));
  }, []);

  // Load own events when sponsored variant
  useEffect(() => {
    if (variant !== "sponsored" || !token) return;
    fetch("/api/events/mine", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setMyEvents(Array.isArray(d) ? d : []))
      .catch(() => setMyEvents([]));
  }, [variant, token]);

  // Toggle tag selection
  const toggleTag = (id: number) => {
    setSelectedTagIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const filteredTags = tags.filter(t => !tagSearch.trim() || t.name.toLowerCase().includes(tagSearch.toLowerCase()));

  const onSubmit = async (values: ArticleValues) => {
    if (!token) { toast.error("No autenticado"); return; }
    setBusy(true);
    try {
      // 1) Upload pending image
      let imageUrlPath = image.url;
      if (image.file) {
        const r = await api.uploadImage(image.file, token);
        imageUrlPath = r.url;
        setImage({ file: null, url: r.url });
      }

      // 2) Build payload (campos comunes)
      const basePayload = {
        title:      values.title.trim(),
        slug:       values.slug?.trim() || undefined,
        excerpt:    values.excerpt?.trim() || undefined,
        content:    values.content.trim(),
        image:      imageUrlPath || undefined,
        youtubeUrl: values.youtubeUrl?.trim() || undefined,
        articleTagIds: selectedTagIds.length ? selectedTagIds : undefined,
      };

      // 3) Choose endpoint based on mode + variant
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
        // admin create
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

      // 4) Admin variant: explicit approve if requested
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

  // CTA label dinámico
  const ctaLabel = busy
    ? "Guardando…"
    : variant === "admin"
      ? (mode === "create"
          ? (watchStatus === "APPROVED" ? "Crear y publicar →" : watchStatus === "PENDING_MODERATION" ? "Crear en revisión →" : "Crear borrador →")
          : (watchStatus === "APPROVED" ? "Guardar y publicar →" : watchStatus === "PENDING_MODERATION" ? "Guardar en revisión →" : "Guardar borrador →"))
      : (mode === "create" ? "Solicitar artículo →" : "Guardar cambios →");

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>

      {/* Back link */}
      <Link href={redirectTo} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink-3)", fontSize: 13, marginBottom: 18 }}>
        ◀ Volver a artículos
      </Link>

      {/* Admin panel: solo si variant=admin */}
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
        </div>
      )}

      {/* Form fields (NO accordion — campos planos) */}
      <div className="panel">

        <div className="field">
          <label>Título <span style={{ color: "var(--err)" }}>*</span></label>
          <input type="text" placeholder="Ej: Los mejores festivales de verano en Santiago" maxLength={200} {...register("title")} />
          {errors.title?.message && <div style={{ color: "var(--err)", fontSize: 12, marginTop: 5 }}>{errors.title.message}</div>}
        </div>

        <div className="field">
          <label>Slug <small style={{ color: "var(--ink-3)" }}>(opcional — se genera del título)</small></label>
          <input type="text" placeholder="los-mejores-festivales-de-verano" {...register("slug")} />
        </div>

        <div className="field">
          <label>Extracto</label>
          <textarea rows={2} placeholder="Resumen breve que aparece en las cards (máx. 200 chars)" maxLength={200} {...register("excerpt")} />
        </div>

        <div className="field">
          <label>Imagen principal (16:9)</label>
          <ImageUploadBox
            slot={image}
            onPick={(f) => setImage({ file: f, url: image.url })}
            onRemove={() => setImage({ file: null, url: "" })}
            label="Sube una imagen horizontal"
            hint="JPG / PNG / WebP · 1600×900 · máx 5MB"
          />
        </div>

        <div className="field">
          <label>URL de YouTube <small style={{ color: "var(--ink-3)" }}>(opcional)</small></label>
          <input type="url" placeholder="https://www.youtube.com/watch?v=..." {...register("youtubeUrl")} />
          <div className="help">Si hay un video asociado al artículo, se mostrará embebido debajo de la imagen principal.</div>
        </div>

        <div className="field">
          <label>Contenido <span style={{ color: "var(--err)" }}>*</span></label>
          <Controller
            control={control}
            name="content"
            render={({ field }) => (
              <MarkdownEditor
                value={field.value}
                onChange={field.onChange}
                helpText="El admin de Konbini puede editar el texto para alinearlo al estilo editorial."
              />
            )}
          />
          {errors.content?.message && <div style={{ color: "var(--err)", fontSize: 12, marginTop: 5 }}>{errors.content.message}</div>}
        </div>

        <div className="field">
          <label>Tags <small style={{ color: "var(--ink-3)" }}>({selectedTagIds.length} seleccionados)</small></label>
          <input type="text" placeholder="Buscar tag…" value={tagSearch} onChange={(e) => setTagSearch(e.target.value)} />
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
        </div>

        {/* Sponsored variant: select evento vinculado — SOLO en create (UpdateArticleDto no soporta eventId) */}
        {variant === "sponsored" && mode === "create" && (
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Vincular a evento <small style={{ color: "var(--ink-3)" }}>(opcional)</small></label>
            <select {...register("eventId")}>
              <option value="">Sin evento vinculado</option>
              {myEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title} · {ev.status}</option>
              ))}
            </select>
            <div className="help">Si vinculas un evento, el artículo aparecerá en el bloque "Relacionados" de la página del evento.</div>
          </div>
        )}

      </div>

      {/* Sticky footer */}
      <div style={{
        position: "sticky", bottom: 0, marginTop: 24,
        padding: "18px 0",
        borderTop: "1px solid var(--line)",
        background: "color-mix(in oklab, var(--bg) 92%, transparent)",
        backdropFilter: "blur(8px)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 13, color: "var(--ink-3)" }}>
          {variant === "admin"
            ? mode === "create" ? "Creando como admin · sin moderación." : `Editando artículo #${initial?.id}`
            : mode === "create" ? "Pasa por revisión editorial antes de publicar." : `Editando tu artículo #${initial?.id}`}
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href={redirectTo} className="btn ghost">Cancelar</Link>
          <button type="button" className="btn primary" disabled={busy} onClick={() => handleSubmit(onSubmit)()}>
            {ctaLabel}
          </button>
        </div>
      </div>

    </div>
  );
}
