"use client";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { api, ApiSubscription } from "@/lib/api";
import { TablePagination, useClientPagination } from "@/components/TablePagination";

// ── Plan config state ─────────────────────────────────────────────────────────

type PlanSettings = {
  sub_monthly_price:     string;
  sub_credits_per_month: string;
  sub_aviso_discount:    string;
  sub_portada_discount:  string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function subDisplayName(s: ApiSubscription): string {
  if (s.org) return s.org.handle ? `@${s.org.handle}` : s.org.email;
  if (s.user) return s.user.handle ? `@${s.user.handle}` : s.user.email;
  return `Sub #${s.id}`;
}

function subEmail(s: ApiSubscription): string {
  return s.org?.email ?? s.user?.email ?? '—';
}

const MESES = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
}

function SubRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
      <span style={{ color:'var(--ink-3)', fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:'.1em' }}>{label}</span>
      <span style={{ fontWeight:500 }}>{value}</span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SubsSection() {
  const { token } = useUser();

  const [plan, setPlan] = useState<PlanSettings>({
    sub_monthly_price:     "29990",
    sub_credits_per_month: "10",
    sub_aviso_discount:    "20",
    sub_portada_discount:  "20",
  });
  const [saving, setSaving] = useState(false);

  async function savePlan() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(plan),
      });
      if (!res.ok) throw new Error("Error al guardar");
      toast.success("Plan actualizado");
    } catch {
      toast.error("No se pudo guardar la configuración");
    } finally {
      setSaving(false);
    }
  }

  const [subs, setSubs] = useState<ApiSubscription[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const { page, goPage, perPage, changePerPage, total: pTotal, totalPages, from, to, paginated: paginatedSubs } = useClientPagination(subs);
  const [openSub, setOpenSub] = useState<ApiSubscription | null>(null);

  const loadSubs = useCallback(async () => {
    if (!token) return;
    setLoadingSubs(true);
    try {
      const res = await api.subscriptions(token);
      setSubs(res.items);
      setTotal(res.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error cargando suscriptores");
    } finally {
      setLoadingSubs(false);
    }
  }, [token]);

  useEffect(() => { loadSubs(); }, [loadSubs]);

  useEffect(() => {
    if (!token) return;
    fetch("/api/settings", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!Array.isArray(data)) return;
        const keys: (keyof PlanSettings)[] = [
          "sub_monthly_price",
          "sub_credits_per_month",
          "sub_aviso_discount",
          "sub_portada_discount",
        ];
        const patch: Partial<PlanSettings> = {};
        data.forEach(({ key, value }: { key: string; value: string }) => {
          if (keys.includes(key as keyof PlanSettings)) {
            patch[key as keyof PlanSettings] = value;
          }
        });
        if (Object.keys(patch).length) setPlan((p) => ({ ...p, ...patch }));
      })
      .catch(() => {});
  }, [token]);

  const activeCount = subs.filter((s) => s.status === 'ACTIVE').length;

  return (
    <>
      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi">
          <div className="l">ACTIVOS</div>
          <div className="v">{activeCount}</div>
        </div>
        <div className="kpi">
          <div className="l">TOTAL</div>
          <div className="v">{total}</div>
        </div>
      </div>

      {/* Table */}
      <div className="panel" style={{ padding: 0, marginBottom: 18 }}>
        <table className="a-table">
          <thead>
            <tr>
              <th>USUARIO</th>
              <th>INICIO</th>
              <th>RENUEVA</th>
              <th>CRÉDITOS</th>
              <th>ESTADO</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loadingSubs && subs.length === 0 ? (
              <tr><td colSpan={6} style={{textAlign:'center',padding:16}}>Cargando…</td></tr>
            ) : paginatedSubs.map((s) => (
              <tr key={s.id}>
                <td>{subDisplayName(s)}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtDate(s.cycleStart)}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtDate(s.cycleEnd)}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{s.creditsUsed}/{s.creditsTotal}</td>
                <td>
                  <span className={`stat-pill ${s.status === 'ACTIVE' ? 'pub' : 'exp'}`}>
                    <span className="dot" />
                    {s.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <div className="row-act">
                    <button onClick={() => setOpenSub(s)}>Ver</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loadingSubs && (
        <TablePagination
          page={page} totalPages={totalPages} total={pTotal} from={from} to={to}
          perPage={perPage} noun="suscripción"
          onPageChange={goPage} onPerPageChange={changePerPage}
        />
      )}

      {/* Plan config */}
      <div className="panel">
        <div className="ph">
          <h3>Configuración del plan</h3>
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Precio mensual (CLP)</label>
            <input
              type="number"
              value={plan.sub_monthly_price}
              onChange={(e) => setPlan((p) => ({ ...p, sub_monthly_price: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Créditos por mes</label>
            <input
              type="number"
              value={plan.sub_credits_per_month}
              onChange={(e) => setPlan((p) => ({ ...p, sub_credits_per_month: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>% descuento avisos para suscriptores</label>
            <input
              type="number"
              value={plan.sub_aviso_discount}
              onChange={(e) => setPlan((p) => ({ ...p, sub_aviso_discount: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>% descuento portadas para suscriptores</label>
            <input
              type="number"
              value={plan.sub_portada_discount}
              onChange={(e) => setPlan((p) => ({ ...p, sub_portada_discount: e.target.value }))}
            />
          </div>
        </div>
        <button className="btn dark" onClick={savePlan} disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>

      {openSub && (
        <div className="confirm-bg" onClick={() => setOpenSub(null)}>
          <div className="confirm-card" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:14 }}>
              <h3 className="h" style={{ margin:0 }}>Detalle de suscripción</h3>
              <button className="icon-btn" onClick={() => setOpenSub(null)}>✕</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <SubRow label="Usuario / Org" value={subDisplayName(openSub)} />
              <SubRow label="Email" value={subEmail(openSub)} />
              <SubRow label="Estado" value={openSub.status === 'ACTIVE' ? 'Activo' : 'Inactivo'} />
              <SubRow label="Inicio ciclo" value={fmtDate(openSub.cycleStart)} />
              <SubRow label="Fin ciclo" value={fmtDate(openSub.cycleEnd)} />
              <SubRow label="Créditos" value={`${openSub.creditsUsed} / ${openSub.creditsTotal}`} />
            </div>
            <div className="modal-acts" style={{ marginTop:16 }}>
              <button className="btn dark" onClick={() => setOpenSub(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
