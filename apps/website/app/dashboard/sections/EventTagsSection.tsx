"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TablePagination, useClientPagination } from "@/components/TablePagination";

type TagItem = { id: number; name: string; slug: string };
type ModalState =
  | { type: "create" }
  | { type: "edit";   item: TagItem }
  | { type: "delete"; item: TagItem }
  | null;

async function authedFetch(path: string, init: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(path, { ...init, headers });
}

function TagFormModal({
  title,
  initial = {},
  onClose,
  onSave,
}: {
  title: string;
  initial?: Record<string, string>;
  onClose: () => void;
  onSave: (data: Record<string, string>) => void;
}) {
  const [data, setData] = useState<Record<string, string>>(initial);
  const set = (k: string, v: string) => setData((d) => ({ ...d, [k]: v }));
  return (
    <div className="confirm-bg" onClick={onClose}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <h3 className="h">{title}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
          <div className="field" style={{ margin: 0 }}>
            <label>Nombre del tag <span style={{ color: "var(--err)" }}>*</span></label>
            <input type="text" value={data.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="concierto" />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Slug <span style={{ color: "var(--err)" }}>*</span></label>
            <input type="text" value={data.slug || ""} onChange={(e) => set("slug", e.target.value)} placeholder="concierto" />
          </div>
        </div>
        <div className="row-act">
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn dark" onClick={() => { onSave(data); onClose(); }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [typed, setTyped] = useState("");
  return (
    <div className="confirm-bg" onClick={onClose}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="h">{title}</h3>
        <p className="p">{message}</p>
        <div className="field" style={{ margin: "0 0 14px" }}>
          <label>Escribe <strong>ELIMINAR</strong> para confirmar</label>
          <input type="text" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="ELIMINAR" />
        </div>
        <div className="row-act">
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn primary"
            style={{ background: "var(--err)" }}
            onClick={() => { onConfirm(); onClose(); }}
            disabled={typed !== "ELIMINAR"}
          >
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EventTagsSection() {
  const [items, setItems] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);

  const { page, goPage, perPage, changePerPage, total, totalPages, from, to, paginated } = useClientPagination(items);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/event-tags");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error("No se pudieron cargar los tags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onCreate = async (d: Record<string, string>) => {
    const res = await authedFetch("/api/event-tags", {
      method: "POST",
      body: JSON.stringify({ name: d.name.trim(), slug: d.slug.trim() }),
    });
    if (!res.ok) { toast.error("No se pudo crear el tag"); return; }
    toast.success("Tag creado", { description: `"${d.name}" agregado al sistema` });
    load();
  };

  const onEdit = async (id: number, d: Record<string, string>) => {
    const res = await authedFetch(`/api/event-tags/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: d.name.trim(), slug: d.slug.trim() }),
    });
    if (!res.ok) { toast.error("No se pudo actualizar el tag"); return; }
    toast.success("Tag actualizado");
    load();
  };

  const onDelete = async (id: number) => {
    const res = await authedFetch(`/api/event-tags/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("No se pudo eliminar el tag"); return; }
    toast.warning("Tag eliminado");
    load();
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ color: "var(--ink-3)", fontSize: 13 }}>
          Tags de <strong style={{ color: "var(--ink)" }}>Eventos</strong>
          {!loading && ` · ${items.length} en el sistema`}
        </div>
        <button className="btn primary" onClick={() => setModal({ type: "create" })}>＋ Nuevo tag</button>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <table className="a-table">
          <thead>
            <tr>
              <th>NOMBRE</th>
              <th>SLUG</th>
              <th>USOS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((it) => (
              <tr key={it.id}>
                <td><strong>{it.name}</strong></td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>#{it.slug}</td>
                <td style={{ fontFamily: "var(--font-mono)", color: "var(--ink-3)" }}>
                  {(it as TagItem & { _count?: { events?: number } })._count?.events ?? "—"}
                </td>
                <td>
                  <div className="row-act">
                    <button onClick={() => setModal({ type: "edit", item: it })}>Editar</button>
                    <button className="bad" onClick={() => setModal({ type: "delete", item: it })}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "var(--ink-3)", padding: "24px 0" }}>
                  No hay tags. Crea el primero.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "var(--ink-3)", padding: "24px 0" }}>
                  Cargando…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!loading && (
        <TablePagination
          page={page} totalPages={totalPages} total={total} from={from} to={to}
          perPage={perPage} noun="tag"
          onPageChange={goPage} onPerPageChange={changePerPage}
        />
      )}

      {modal?.type === "create" && (
        <TagFormModal title="Nuevo tag de evento" onClose={() => setModal(null)} onSave={onCreate} />
      )}
      {modal?.type === "edit" && (
        <TagFormModal
          title={`Editar ${modal.item.name}`}
          initial={{ name: modal.item.name, slug: modal.item.slug }}
          onClose={() => setModal(null)}
          onSave={(d) => onEdit(modal.item.id, d)}
        />
      )}
      {modal?.type === "delete" && (
        <ConfirmDialog
          title={`¿Eliminar tag "${modal.item.name}"?`}
          message="Esta acción es permanente."
          onConfirm={() => onDelete(modal.item.id)}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
