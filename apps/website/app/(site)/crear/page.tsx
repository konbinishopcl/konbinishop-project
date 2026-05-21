"use client";

import { useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { Ic } from "@/components/icons";

type Price = { name: string; amount: string };
type DateRow = { date: string; start: string; end: string };

type FormData = {
  title: string;
  company: string;
  category: string;
  desc: string;
  about: string;
  free: boolean;
  prices: Price[];
  dates: DateRow[];
  venue: string;
  address: string;
  web: string;
  socials: string[];
  videos: string[];
};

type Update = <K extends keyof FormData>(k: K, v: FormData[K]) => void;

export default function FormPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>({
    title: "",
    company: "",
    category: "",
    desc: "",
    about: "",
    free: false,
    prices: [{ name: "Entrada General", amount: "" }],
    dates: [{ date: "", start: "", end: "" }],
    venue: "",
    address: "",
    web: "",
    socials: [""],
    videos: [""],
  });
  const update: Update = (k, v) => setData((d) => ({ ...d, [k]: v }));

  return (
    <main>
      <div style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--line)", padding: "18px 0" }}>
        <div className="container row" style={{ justifyContent: "space-between" }}>
          <BrandMark size={28} />
          <div className="row" style={{ gap: 10 }}>
            <span className="mono" style={{ fontSize: 11, letterSpacing: ".15em", color: "var(--ink-3)" }}>
              PASO {step} DE 3
            </span>
            <button className="btn ghost">
              <span style={{ marginRight: 6 }}>?</span> Ayuda
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="form-shell">
          <div className="form-stepbar">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`seg ${n < step ? "done" : ""} ${n === step ? "curr" : ""}`} />
            ))}
          </div>

          <div className="step-num">PASO {step} / 03</div>
          {step === 1 && <Step1 data={data} update={update} />}
          {step === 2 && <Step2 data={data} update={update} />}
          {step === 3 && <Step3 data={data} update={update} />}

          <div className="form-foot">
            <button
              className="btn ghost"
              onClick={() => (step > 1 ? setStep(step - 1) : null)}
              disabled={step === 1}
              style={{ opacity: step === 1 ? 0.3 : 1 }}
            >
              {Ic.chevL} Volver
            </button>
            <div className="row" style={{ gap: 14 }}>
              <button className="btn ghost">Guardar borrador</button>
              <button
                className="btn primary"
                onClick={() =>
                  step < 3 ? setStep(step + 1) : alert("¡Publicación enviada a revisión!")
                }
              >
                {step === 3 ? "Publicar evento" : "Continuar"} {Ic.arrow}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Step1({ data, update }: { data: FormData; update: Update }) {
  const cats = ["Cine", "Conciertos", "Convenciones", "Streamings", "Ferias", "Anime · TV", "Gaming", "Cosplay"];
  return (
    <div>
      <h1 className="step-title">
        Hola, Gabriel.
        <br />
        Cuéntanos sobre tu evento.
      </h1>
      <p className="step-lead">
        Esta información se mostrará en tu publicación. Podrás editarla en cualquier momento antes de
        publicar.
      </p>

      <fieldset>
        <div className="field-set-title">
          <span className="n">1.1</span> Información básica
        </div>
        <div className="field">
          <label>Título del evento</label>
          <input
            type="text"
            placeholder="Ej: Concierto Anime Symphonic Orchestra 2025"
            value={data.title}
            onChange={(e) => update("title", e.target.value)}
          />
          <div className="help">Sé claro y descriptivo. Este es el nombre que verán los asistentes.</div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Empresa / Productor</label>
            <input
              type="text"
              placeholder="Ej: Cinépolis, Productora 8U"
              value={data.company}
              onChange={(e) => update("company", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Categoría</label>
            <select value={data.category} onChange={(e) => update("category", e.target.value)}>
              <option value="">Selecciona una categoría</option>
              {cats.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Descripción general</label>
          <textarea
            placeholder="Describe brevemente el evento, su temática y formato."
            value={data.desc}
            onChange={(e) => update("desc", e.target.value)}
          />
          <div className="help">Aparece en las tarjetas de búsqueda. 280 caracteres máx.</div>
        </div>
        <div className="field">
          <label>
            Acerca de <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>(opcional)</span>
          </label>
          <textarea
            placeholder="Cuenta lo que los asistentes pueden esperar: artistas invitados, actividades, proyecciones especiales…"
            value={data.about}
            onChange={(e) => update("about", e.target.value)}
            style={{ minHeight: 140 }}
          />
        </div>
      </fieldset>

      <fieldset>
        <div className="field-set-title">
          <span className="n">1.2</span> Precio del evento
        </div>
        <div className="ck-row" onClick={() => update("free", !data.free)} style={{ marginBottom: 16 }}>
          <div className={`ck ${data.free ? "on" : ""}`}>{data.free && Ic.check}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Evento gratuito</div>
            <div style={{ color: "var(--ink-3)", fontSize: 12 }}>
              Marca esta opción si no se cobra entrada.
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
                    placeholder="Ej: Entrada General, VIP, Estudiante"
                    value={p.name}
                    onChange={(e) =>
                      update(
                        "prices",
                        data.prices.map((pp, j) => (j === i ? { ...pp, name: e.target.value } : pp)),
                      )
                    }
                  />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>Precio</label>
                  <div className="input-prefix">
                    <span>$</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={p.amount}
                      onChange={(e) =>
                        update(
                          "prices",
                          data.prices.map((pp, j) =>
                            j === i ? { ...pp, amount: e.target.value } : pp,
                          ),
                        )
                      }
                    />
                    <span className="suffix">CLP</span>
                  </div>
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
              El pago se procesa a través de nuestra pasarela.{" "}
              <strong>No solicitamos datos de tarjeta directamente.</strong>
            </div>
          </div>
        )}
      </fieldset>
    </div>
  );
}

function Step2({ data, update }: { data: FormData; update: Update }) {
  return (
    <div>
      <h1 className="step-title">Horarios, ubicación y links.</h1>
      <p className="step-lead">
        Indica dónde y cuándo ocurre el evento, y dónde podemos enviar a tus asistentes para más
        información.
      </p>

      <fieldset>
        <div className="field-set-title">
          <span className="n">2.1</span> Día y hora del evento
        </div>
        {data.dates.map((d, i) => (
          <div className="grid-3" key={i} style={{ marginBottom: 14 }}>
            <div className="field" style={{ margin: 0 }}>
              <label>Fecha {i === 0 ? "" : `(día ${i + 1})`}</label>
              <input
                type="text"
                placeholder="DD / MM / AAAA"
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
                type="text"
                placeholder="20:00"
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
                type="text"
                placeholder="23:00"
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
        ))}
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
        <div className="field">
          <label>Lugar / Venue</label>
          <input
            type="text"
            placeholder="Ej: Teatro Cariola, Movistar Arena, Online"
            value={data.venue}
            onChange={(e) => update("venue", e.target.value)}
          />
        </div>
        <div className="field">
          <label>Dirección completa</label>
          <input
            type="text"
            placeholder="Calle, número, comuna, región"
            value={data.address}
            onChange={(e) => update("address", e.target.value)}
          />
          <div className="help">Si tu evento es online, escribe &quot;Evento virtual&quot;.</div>
        </div>
      </fieldset>

      <fieldset>
        <div className="field-set-title">
          <span className="n">2.3</span> Enlaces importantes
        </div>
        <div className="field">
          <label>Sitio web / Ticketera</label>
          <div className="input-prefix">
            <span>https://</span>
            <input
              type="text"
              placeholder="ticketmaster.com/tu-evento"
              value={data.web}
              onChange={(e) => update("web", e.target.value)}
            />
          </div>
          <div className="help">
            Si tienes una ticketera externa, los compradores serán dirigidos ahí.
          </div>
        </div>
        <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: "block" }}>
          Redes sociales
        </label>
        {data.socials.map((s, i) => (
          <div className="row" key={i} style={{ marginBottom: 10 }}>
            <div className="input-prefix" style={{ flex: 1 }}>
              <span>@</span>
              <input
                type="text"
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
        ))}
        <button className="add-line" onClick={() => update("socials", [...data.socials, ""])}>
          {Ic.plus} Agregar otra red social
        </button>
      </fieldset>
    </div>
  );
}

function Step3({ data, update }: { data: FormData; update: Update }) {
  return (
    <div>
      <h1 className="step-title">Imágenes y video.</h1>
      <p className="step-lead">
        Una buena imagen es decisiva. Usa el banner para destacar y el poster para listados
        verticales.
      </p>

      <fieldset>
        <div className="field-set-title">
          <span className="n">3.1</span> Imágenes principales
        </div>
        <div className="upload-grid">
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: "block" }}>
              Banner (horizontal · 16:9)
            </label>
            <div className="upload-box">
              <div className="ic">{Ic.upl}</div>
              <div style={{ fontWeight: 500, color: "var(--ink-2)" }}>Sube una imagen horizontal</div>
              <small>JPG / PNG · máx 5MB · sin texto sobreimpreso</small>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: "block" }}>
              Poster (vertical · 2:3)
            </label>
            <div className="upload-box tall">
              <div className="ic">{Ic.upl}</div>
              <div style={{ fontWeight: 500, color: "var(--ink-2)", fontSize: 13 }}>
                Poster oficial
              </div>
              <small>JPG / PNG · 1200×1800</small>
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <div className="field-set-title">
          <span className="n">3.2</span> Galería
        </div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="upload-box" style={{ aspectRatio: "1/1", padding: 14 }}>
              <div className="ic" style={{ width: 28, height: 28 }}>{Ic.plus}</div>
              <small style={{ fontSize: 10 }}>Imagen {i + 1}</small>
            </div>
          ))}
        </div>
        <div className="help" style={{ marginTop: 10 }}>
          Hasta 10 imágenes. Aparecerán en la sección &quot;Galería&quot; del evento.
        </div>
      </fieldset>

      <fieldset>
        <div className="field-set-title">
          <span className="n">3.3</span> Videos
        </div>
        {data.videos.map((v, i) => (
          <div className="row" key={i} style={{ marginBottom: 10 }}>
            <div className="input-prefix" style={{ flex: 1 }}>
              <span>▶</span>
              <input
                type="text"
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
            Tu publicación pasará por una revisión rápida (24–48 hrs) antes de aparecer en Konbini.
            Te notificaremos por correo cuando esté lista.
          </div>
        </div>
      </div>
    </div>
  );
}
