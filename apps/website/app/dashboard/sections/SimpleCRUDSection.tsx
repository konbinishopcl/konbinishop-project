"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { api, type ApiCountry, type ApiRegion, type ApiCommune } from "@/lib/api";

// ── KindKey ─────────────────────────────────────────────────────────────────

type KindKey = "tags" | "countries" | "states" | "cities";

// ── Slug helper ──────────────────────────────────────────────────────────────

const toSlug = (s: string) =>
  s.toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ── Helpers para las secciones con API real ─────────────────────────────────

async function authedFetch(path: string, init: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(path, { ...init, headers });
}

// ── Sección de Tags real (kind === "tags") ──────────────────────────────────

const TAG_FIELDS = [
  { k: "name", label: "Nombre del tag", required: true, placeholder: "shonen" },
  { k: "slug", label: "Slug",           required: true, placeholder: "shonen" },
] as const;

type RealTagItem = { id: number; name: string; slug: string };

type TagModalState =
  | { type: "create" }
  | { type: "edit";   item: RealTagItem }
  | { type: "delete"; item: RealTagItem }
  | null;

function RealTagsSection() {
  const [items, setItems] = useState<RealTagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<TagModalState>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/article-tags");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error("No se pudieron cargar los tags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const onCreate = async (d: Record<string, string>) => {
    const res = await authedFetch("/api/article-tags", {
      method: "POST",
      body: JSON.stringify({ name: d.name.trim(), slug: d.slug.trim() }),
    });
    if (!res.ok) { toast.error("No se pudo crear el tag"); return; }
    toast.success("Tag creado", { description: `"${d.name}" agregado al sistema` });
    load();
  };

  const onEdit = async (id: number, d: Record<string, string>) => {
    const res = await authedFetch(`/api/article-tags/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: d.name.trim(), slug: d.slug.trim() }),
    });
    if (!res.ok) { toast.error("No se pudo actualizar el tag"); return; }
    toast.success("Tag actualizado");
    load();
  };

  const onDelete = async (id: number) => {
    const res = await authedFetch(`/api/article-tags/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("No se pudo eliminar el tag"); return; }
    toast.warning("Tag eliminado");
    load();
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ color: "var(--ink-3)", fontSize: 13 }}>
          {loading ? "Cargando…" : `${items.length} tags en el sistema`}
        </div>
        <button className="btn primary" onClick={() => setModal({ type: "create" })}>＋ Nuevo tag</button>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <table className="a-table">
          <thead>
            <tr>
              <th>NOMBRE</th>
              <th>SLUG</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td><strong>{it.name}</strong></td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>#{it.slug}</td>
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
                <td colSpan={3} style={{ textAlign: "center", color: "var(--ink-3)", padding: "24px 0" }}>
                  No hay tags. Crea el primero.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal?.type === "create" && (
        <TagsFormModal
          title="Nuevo tag"
          initial={{}}
          onClose={() => setModal(null)}
          onSave={onCreate}
        />
      )}
      {modal?.type === "edit" && (
        <TagsFormModal
          title={`Editar ${modal.item.name}`}
          initial={{ name: modal.item.name, slug: modal.item.slug }}
          onClose={() => setModal(null)}
          onSave={(d) => onEdit(modal.item.id, d)}
        />
      )}
      {modal?.type === "delete" && (
        <TagsConfirmDialog
          title={`¿Eliminar tag "${modal.item.name}"?`}
          message="Esta acción es permanente."
          onConfirm={() => onDelete(modal.item.id)}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

function TagsFormModal({
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
          {TAG_FIELDS.map((f) => (
            <div key={f.k} className="field" style={{ margin: 0 }}>
              <label>
                {f.label}
                {f.required && <span style={{ color: "var(--err)" }}> *</span>}
              </label>
              <input
                type="text"
                value={data[f.k] || ""}
                onChange={(e) => set(f.k, e.target.value)}
                placeholder={f.placeholder}
              />
            </div>
          ))}
        </div>
        <div className="row-act">
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn dark" onClick={() => { onSave(data); onClose(); }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function TagsConfirmDialog({
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
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="ELIMINAR"
          />
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

// ── GeoSelectFormModal (modal with id-valued select for states & cities) ─────

function GeoSelectFormModal({
  title,
  initial,
  selectLabel,
  selectOptions,
  selectKey,
  onClose,
  onSave,
}: {
  title: string;
  initial?: Record<string, string>;
  selectLabel: string;
  selectOptions: { id: number; name: string }[];
  selectKey: "countryId" | "stateId";
  onClose: () => void;
  onSave: (data: Record<string, string>) => void;
}) {
  const [data, setData] = useState<Record<string, string>>(initial ?? {});
  const set = (k: string, v: string) => setData((d) => ({ ...d, [k]: v }));
  return (
    <div className="confirm-bg" onClick={onClose}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <h3 className="h">{title}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
          <div className="field" style={{ margin: 0 }}>
            <label>Nombre <span style={{ color: "var(--err)" }}>*</span></label>
            <input
              type="text"
              value={data.name || ""}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Nombre"
            />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Slug</label>
            <input
              type="text"
              value={data.slug || ""}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="slug-automatico"
            />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>{selectLabel} <span style={{ color: "var(--err)" }}>*</span></label>
            <select
              value={data[selectKey] || ""}
              onChange={(e) => set(selectKey, e.target.value)}
            >
              <option value="">Selecciona…</option>
              {selectOptions.map((o) => (
                <option key={o.id} value={String(o.id)}>{o.name}</option>
              ))}
            </select>
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

// ── RealCountriesSection ─────────────────────────────────────────────────────

type CountryModalState =
  | { type: "create" }
  | { type: "edit";   item: ApiCountry }
  | { type: "delete"; item: ApiCountry }
  | null;

function RealCountriesSection() {
  const { token } = useUser();
  const [countries, setCountries] = useState<ApiCountry[]>([]);
  const [states, setStates] = useState<ApiRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<CountryModalState>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([api.countries(), api.regions()]);
      setCountries(c);
      setStates(s);
    } catch {
      toast.error("No se pudieron cargar los países");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const onCreate = async (d: Record<string, string>) => {
    try {
      await api.createCountry({ name: d.name.trim(), slug: (d.slug || toSlug(d.name)).trim() }, token!);
      toast.success("País creado", { description: `"${d.name}" agregado al sistema` });
      load();
    } catch {
      toast.error("No se pudo crear el país");
    }
  };

  const onEdit = async (id: number, d: Record<string, string>) => {
    try {
      await api.updateCountry(id, { name: d.name.trim(), slug: (d.slug || toSlug(d.name)).trim() }, token!);
      toast.success("País actualizado");
      load();
    } catch {
      toast.error("No se pudo actualizar el país");
    }
  };

  const onDelete = async (id: number) => {
    try {
      await api.deleteCountry(id, token!);
      toast.warning("País eliminado");
      load();
    } catch {
      toast.error("No se pudo eliminar el país (puede tener divisiones asociadas)");
    }
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ color: "var(--ink-3)", fontSize: 13 }}>
          {loading ? "Cargando…" : `${countries.length} países en el sistema`}
        </div>
        <button className="btn primary" onClick={() => setModal({ type: "create" })}>＋ Nuevo país</button>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <table className="a-table">
          <thead>
            <tr>
              <th>NOMBRE</th>
              <th>SLUG</th>
              <th>DIVISIONES</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {countries.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.name}</strong></td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{c.slug}</td>
                <td style={{ color: "var(--ink-3)" }}>{states.filter((st) => st.countryId === c.id).length}</td>
                <td>
                  <div className="row-act">
                    <button onClick={() => setModal({ type: "edit", item: c })}>Editar</button>
                    <button className="bad" onClick={() => setModal({ type: "delete", item: c })}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && countries.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "var(--ink-3)", padding: "24px 0" }}>
                  No hay países. Crea el primero.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal?.type === "create" && (
        <TagsFormModal
          title="Nuevo país"
          initial={{}}
          onClose={() => setModal(null)}
          onSave={onCreate}
        />
      )}
      {modal?.type === "edit" && (
        <TagsFormModal
          title={`Editar ${modal.item.name}`}
          initial={{ name: modal.item.name, slug: modal.item.slug }}
          onClose={() => setModal(null)}
          onSave={(d) => onEdit(modal.item.id, d)}
        />
      )}
      {modal?.type === "delete" && (
        <TagsConfirmDialog
          title={`¿Eliminar país "${modal.item.name}"?`}
          message="Esta acción es permanente. Si el país tiene divisiones asociadas, no se podrá eliminar."
          onConfirm={() => onDelete(modal.item.id)}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

// ── RealStatesSection ────────────────────────────────────────────────────────

type StateModalState =
  | { type: "create" }
  | { type: "edit";   item: ApiRegion }
  | { type: "delete"; item: ApiRegion }
  | null;

function RealStatesSection() {
  const { token } = useUser();
  const [statesList, setStatesList] = useState<ApiRegion[]>([]);
  const [countries, setCountries] = useState<ApiCountry[]>([]);
  const [cities, setCities] = useState<ApiCommune[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<StateModalState>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [s, c, ci] = await Promise.all([api.regions(), api.countries(), api.communes()]);
      setStatesList(s);
      setCountries(c);
      setCities(ci);
    } catch {
      toast.error("No se pudieron cargar las divisiones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const onCreate = async (d: Record<string, string>) => {
    try {
      await api.createState({
        name: d.name.trim(),
        slug: (d.slug || toSlug(d.name)).trim(),
        countryId: Number(d.countryId),
      }, token!);
      toast.success("División creada", { description: `"${d.name}" agregada al sistema` });
      load();
    } catch {
      toast.error("No se pudo crear la división");
    }
  };

  const onEdit = async (id: number, d: Record<string, string>) => {
    try {
      await api.updateState(id, {
        name: d.name.trim(),
        slug: (d.slug || toSlug(d.name)).trim(),
        countryId: Number(d.countryId),
      }, token!);
      toast.success("División actualizada");
      load();
    } catch {
      toast.error("No se pudo actualizar la división");
    }
  };

  const onDelete = async (id: number) => {
    try {
      await api.deleteState(id, token!);
      toast.warning("División eliminada");
      load();
    } catch {
      toast.error("No se pudo eliminar la división (puede tener ciudades asociadas)");
    }
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ color: "var(--ink-3)", fontSize: 13 }}>
          {loading ? "Cargando…" : `${statesList.length} divisiones en el sistema`}
        </div>
        <button className="btn primary" onClick={() => setModal({ type: "create" })}>＋ Nueva división</button>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <table className="a-table">
          <thead>
            <tr>
              <th>NOMBRE</th>
              <th>SLUG</th>
              <th>PAÍS</th>
              <th>CIUDADES</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {statesList.map((s) => (
              <tr key={s.id}>
                <td><strong>{s.name}</strong></td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{s.slug}</td>
                <td style={{ color: "var(--ink-3)" }}>
                  {countries.find((co) => co.id === s.countryId)?.name ?? "—"}
                </td>
                <td style={{ color: "var(--ink-3)" }}>
                  {cities.filter((ci) => ci.stateId === s.id).length}
                </td>
                <td>
                  <div className="row-act">
                    <button onClick={() => setModal({ type: "edit", item: s })}>Editar</button>
                    <button className="bad" onClick={() => setModal({ type: "delete", item: s })}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && statesList.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--ink-3)", padding: "24px 0" }}>
                  No hay divisiones. Crea la primera.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal?.type === "create" && (
        <GeoSelectFormModal
          title="Nueva división"
          initial={{}}
          selectLabel="País"
          selectOptions={countries}
          selectKey="countryId"
          onClose={() => setModal(null)}
          onSave={onCreate}
        />
      )}
      {modal?.type === "edit" && (
        <GeoSelectFormModal
          title={`Editar ${modal.item.name}`}
          initial={{ name: modal.item.name, slug: modal.item.slug, countryId: String(modal.item.countryId) }}
          selectLabel="País"
          selectOptions={countries}
          selectKey="countryId"
          onClose={() => setModal(null)}
          onSave={(d) => onEdit(modal.item.id, d)}
        />
      )}
      {modal?.type === "delete" && (
        <TagsConfirmDialog
          title={`¿Eliminar división "${modal.item.name}"?`}
          message="Esta acción es permanente. Si la división tiene ciudades asociadas, no se podrá eliminar."
          onConfirm={() => onDelete(modal.item.id)}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

// ── RealCitiesSection ────────────────────────────────────────────────────────

type CityModalState =
  | { type: "create" }
  | { type: "edit";   item: ApiCommune }
  | { type: "delete"; item: ApiCommune }
  | null;

function RealCitiesSection() {
  const { token } = useUser();
  const [citiesList, setCitiesList] = useState<ApiCommune[]>([]);
  const [statesList, setStatesList] = useState<ApiRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<CityModalState>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [ci, s] = await Promise.all([api.communes(), api.regions()]);
      setCitiesList(ci);
      setStatesList(s);
    } catch {
      toast.error("No se pudieron cargar las ciudades");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const onCreate = async (d: Record<string, string>) => {
    try {
      await api.createCity({
        name: d.name.trim(),
        slug: (d.slug || toSlug(d.name)).trim(),
        stateId: Number(d.stateId),
      }, token!);
      toast.success("Ciudad creada", { description: `"${d.name}" agregada al sistema` });
      load();
    } catch {
      toast.error("No se pudo crear la ciudad");
    }
  };

  const onEdit = async (id: number, d: Record<string, string>) => {
    try {
      await api.updateCity(id, {
        name: d.name.trim(),
        slug: (d.slug || toSlug(d.name)).trim(),
        stateId: Number(d.stateId),
      }, token!);
      toast.success("Ciudad actualizada");
      load();
    } catch {
      toast.error("No se pudo actualizar la ciudad");
    }
  };

  const onDelete = async (id: number) => {
    try {
      await api.deleteCity(id, token!);
      toast.warning("Ciudad eliminada");
      load();
    } catch {
      toast.error("No se pudo eliminar la ciudad");
    }
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ color: "var(--ink-3)", fontSize: 13 }}>
          {loading ? "Cargando…" : `${citiesList.length} ciudades en el sistema`}
        </div>
        <button className="btn primary" onClick={() => setModal({ type: "create" })}>＋ Nueva ciudad</button>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <table className="a-table">
          <thead>
            <tr>
              <th>NOMBRE</th>
              <th>SLUG</th>
              <th>DIVISIÓN</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {citiesList.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.name}</strong></td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{c.slug}</td>
                <td style={{ color: "var(--ink-3)" }}>
                  {statesList.find((st) => st.id === c.stateId)?.name ?? "—"}
                </td>
                <td>
                  <div className="row-act">
                    <button onClick={() => setModal({ type: "edit", item: c })}>Editar</button>
                    <button className="bad" onClick={() => setModal({ type: "delete", item: c })}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && citiesList.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "var(--ink-3)", padding: "24px 0" }}>
                  No hay ciudades. Crea la primera.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal?.type === "create" && (
        <GeoSelectFormModal
          title="Nueva ciudad"
          initial={{}}
          selectLabel="División"
          selectOptions={statesList}
          selectKey="stateId"
          onClose={() => setModal(null)}
          onSave={onCreate}
        />
      )}
      {modal?.type === "edit" && (
        <GeoSelectFormModal
          title={`Editar ${modal.item.name}`}
          initial={{ name: modal.item.name, slug: modal.item.slug, stateId: String(modal.item.stateId) }}
          selectLabel="División"
          selectOptions={statesList}
          selectKey="stateId"
          onClose={() => setModal(null)}
          onSave={(d) => onEdit(modal.item.id, d)}
        />
      )}
      {modal?.type === "delete" && (
        <TagsConfirmDialog
          title={`¿Eliminar ciudad "${modal.item.name}"?`}
          message="Esta acción es permanente."
          onConfirm={() => onDelete(modal.item.id)}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

// ── Pure router ──────────────────────────────────────────────────────────────

export default function SimpleCRUDSection({ kind }: { kind: KindKey }) {
  if (kind === "tags")      return <RealTagsSection />;
  if (kind === "countries") return <RealCountriesSection />;
  if (kind === "states")    return <RealStatesSection />;
  if (kind === "cities")    return <RealCitiesSection />;
  return null;
}
