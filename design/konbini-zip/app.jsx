const { useState, useEffect, useMemo, createContext, useContext } = React;

/* ───────────────── data ───────────────── */
const CATEGORIES = [
  { id: "home", label: "Inicio", ja: "ホーム" },
  { id: "cine", label: "Cine", ja: "シネマ" },
  { id: "conciertos", label: "Conciertos", ja: "ライブ" },
  { id: "convenciones", label: "Convenciones", ja: "コンベンション" },
  { id: "streamings", label: "Streamings", ja: "配信" },
  { id: "ferias", label: "Ferias", ja: "フェア" },
];

const EVENTS = [
  { id: 1, title: "Ado: World Tour Hibana", cat: "Conciertos", ja: "ヒバナ", art: "pa-1", date: "8 ABR 2025", place: "Teatro Caupolicán", price: 65, stamp: "WORLD TOUR" },
  { id: 2, title: "Multitude", cat: "Conciertos", ja: "オーケーロック", art: "pa-2", date: "8 ABR 2025", place: "Teatro Caupolicán", price: 80, stamp: "ONE OK ROCK" },
  { id: 3, title: "Demon Slayer: Infinity Castle", cat: "Cine", ja: "鬼滅の刃", art: "pa-3", date: "8 ABR 2025", place: "Cinépolis", price: 9.99, stamp: "ESTRENO" },
  { id: 4, title: "Super Japan Expo 2025", cat: "Convenciones", ja: "ジャパン EXPO", art: "pa-4", date: "9–12 MAY 2025", place: "Estación Mapocho", price: 25, stamp: "4 DÍAS" },
  { id: 5, title: "My Hero Academia: You're Next", cat: "Cine", ja: "僕のヒーロー", art: "pa-5", date: "8 ABR 2025", place: "Cinépolis", price: 9.99, stamp: "ESTRENO" },
  { id: 6, title: "Solo Leveling: ReAwakening", cat: "Cine", ja: "俺だけレベルアップ", art: "pa-6", date: "8 ABR 2025", place: "Cinépolis", price: 9.99, stamp: "COMING SOON" },
  { id: 7, title: "Attack on Titan: Last Attack", cat: "Cine", ja: "進撃の巨人", art: "pa-9", date: "8 ABR 2025", place: "Cinépolis", price: 9.99, stamp: "ESTRENO" },
  { id: 8, title: "Creepy Nuts: One Man Tour", cat: "Conciertos", ja: "クリーピー", art: "pa-7", date: "16 JUN 2024", place: "Online", price: 22, stamp: "BEYOND LIVE" },
  { id: 9, title: "One Ok Rock: Latin Tour", cat: "Conciertos", ja: "ワンオク", art: "pa-2", date: "5 ABR 2025", place: "Pepsi Center", price: 75, stamp: "LATAM" },
  { id: 10, title: "Flow: Anime Shibari Tour", cat: "Conciertos", ja: "フロウ", art: "pa-10", date: "8 ABR 2025", place: "Teatro Caupolicán", price: 60, stamp: "ANIME SHIBARI" },
  { id: 11, title: "ComicCon Chile 2024", cat: "Convenciones", ja: "コミコン", art: "pa-11", date: "31 OCT–2 NOV", place: "Espacio Riesco", price: 35, stamp: "3 DÍAS" },
  { id: 12, title: "Anime Crunchyroll Fest", cat: "Streamings", ja: "クランチーロール", art: "pa-12", date: "Mar 2025", place: "Online", price: 0, stamp: "GRATIS" },
];

const FEATURED = [EVENTS[0], EVENTS[1], EVENTS[2], EVENTS[3], EVENTS[4], EVENTS[5]];
const HERO = {
  cat: "Cine",
  title1: "El Señor de los Anillos",
  title2: "La Guerra de los Rohirrim",
  date: "23 ABR 2025",
  place: "Cinépolis · Santiago",
  lead: "La épica regresa a la gran pantalla. Ambientada 183 años antes de los eventos de la Comunidad del Anillo.",
  badge: "ESTRENO ANIME",
};

/* ───────────────── theme ───────────────── */
const ThemeCtx = createContext(null);
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("kb-theme") || "dark");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("kb-theme", theme);
  }, [theme]);
  return <ThemeCtx.Provider value={{ theme, setTheme }}>{children}</ThemeCtx.Provider>;
}
const useTheme = () => useContext(ThemeCtx);

/* ───────────────── router ───────────────── */
const RouterCtx = createContext(null);
function RouterProvider({ children }) {
  const [route, setRoute] = useState({ name: "home", params: {} });
  const nav = (name, params = {}) => { setRoute({ name, params }); window.scrollTo({ top: 0, behavior: "instant" }); };
  return <RouterCtx.Provider value={{ route, nav }}>{children}</RouterCtx.Provider>;
}
const useRouter = () => useContext(RouterCtx);

/* ───────────────── icons (inline svg) ───────────────── */
const Ic = {
  sun: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>,
  moon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  chev: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>,
  chevL: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>,
  chevR: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>,
  plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  cal: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  pin: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  share: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>,
  ticket: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 7v3a2 2 0 0 1 0 4v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 0 1 0-4V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2zM13 5v2M13 17v2M13 11v2"/></svg>,
  play: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>,
  upl: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>,
  help: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg>,
  close: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  arrow: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>,
  google: <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>,
  insta: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01"/></svg>,
  apple: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 12.5c0-2.5 2-3.7 2.1-3.8-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-2-.9-3.3-.8-1.7 0-3.3 1-4.1 2.5-1.8 3-.4 7.5 1.3 10 .8 1.2 1.8 2.5 3.1 2.5 1.2 0 1.7-.8 3.1-.8 1.4 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.5.9-1.4 1.3-2.8 1.4-2.9-.1 0-2.6-1-2.6-4zM15.3 5.5c.7-.9 1.2-2.1 1-3.3-1.1.1-2.4.8-3.1 1.6-.7.8-1.3 2-1.1 3.2 1.2.1 2.4-.6 3.2-1.5z"/></svg>,
  fb: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.57 9.88V14.9h-2.5V12h2.5V9.8c0-2.47 1.47-3.83 3.72-3.83 1.08 0 2.2.2 2.2.2v2.42h-1.24c-1.22 0-1.6.76-1.6 1.54V12h2.72l-.43 2.9h-2.29v6.98A10 10 0 0 0 22 12z"/></svg>,
};

/* ───────────────── brand ───────────────── */
function BrandMark({ size = 28 }) {
  return (
    <div className="brand">
      <img src="konbini-logo.svg" alt="Konbini" style={{ height: size, width: "auto", display: "block" }} />
    </div>
  );
}

/* ───────────────── poster ───────────────── */
function Poster({ e, landscape = false }) {
  return (
    <div className={`poster ${landscape ? "land" : ""}`}>
      <div className={`poster-art ${e.art}`} />
      <div className="poster-label">
        <div className="jp-big">{e.ja}</div>
        <div>
          <div className="en">{e.title}</div>
          <div className="stamp">{e.stamp}</div>
        </div>
      </div>
      <div className="ribbon">{e.cat}</div>
      {e.price > 0 ? <div className="price-tag">${e.price}</div> : <div className="price-tag" style={{ background: "#1f8a5b" }}>FREE</div>}
      <div className="placeholder-note">placeholder</div>
    </div>
  );
}

function EventCard({ e, landscape = false }) {
  const { nav } = useRouter();
  return (
    <div className={`card ${landscape ? "land" : ""}`} onClick={() => nav("event", { id: e.id })}>
      <Poster e={e} landscape={landscape} />
      <div className="meta">
        <div className="title">{e.title}</div>
        <div className="sub">{e.date}<span className="dot">·</span>{e.place}</div>
      </div>
    </div>
  );
}

/* ───────────────── header ───────────────── */
function Header() {
  const { theme, setTheme } = useTheme();
  const { route, nav } = useRouter();
  const active = route.params?.cat || (route.name === "home" ? "home" : route.name === "category" ? route.params?.cat : "");

  return (
    <header className="app">
      <div className="container nav-wrap">
        <div className="row" style={{ gap: 32 }}>
          <a onClick={() => nav("home")} style={{ cursor: "pointer" }}><BrandMark /></a>
          <nav className="cats">
            {CATEGORIES.map(c => (
              <button key={c.id} className={active === c.id ? "active" : ""}
                onClick={() => c.id === "home" ? nav("home") : nav("category", { cat: c.id })}>
                {c.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="head-actions">
          <button className="icon-btn" title="Buscar">{Ic.search}</button>
          <button className="icon-btn" title="Tema" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? Ic.sun : Ic.moon}
          </button>
          <button className="btn ghost" onClick={() => nav("login")}>Ingresar</button>
          <button className="btn primary" onClick={() => nav("form")}>＋ Crear evento</button>
        </div>
      </div>
    </header>
  );
}

/* ───────────────── footer ───────────────── */
function Footer() {
  return (
    <footer className="app">
      <div className="container foot-grid">
        <div className="foot-col">
          <BrandMark size={32} />
          <p style={{ color: "var(--ink-3)", fontSize: 13, lineHeight: 1.6, marginTop: 14, maxWidth: 32 + "ch" }}>
            Todo lo que amas — anime, conciertos, ferias y conventions — en un solo lugar.
          </p>
          <div className="row" style={{ marginTop: 18, gap: 10 }}>
            <a className="icon-btn" href="#">{Ic.google}</a>
            <a className="icon-btn" href="#">{Ic.insta}</a>
            <a className="icon-btn" href="#">{Ic.fb}</a>
            <a className="icon-btn" href="#">{Ic.apple}</a>
          </div>
        </div>
        <div className="foot-col"><h4>Explora</h4><a>Cine</a><a>Conciertos</a><a>Convenciones</a><a>Ferias</a></div>
        <div className="foot-col"><h4>Organiza</h4><a>Crear evento</a><a>Guía publicación</a><a>Pasarela de pago</a><a>Soporte</a></div>
        <div className="foot-col"><h4>Comunidad</h4><a>Instagram</a><a>TikTok</a><a>Discord</a><a>Newsletter</a></div>
        <div className="foot-col"><h4>Legal</h4><a>Términos</a><a>Privacidad</a><a>Cookies</a><a>Copyright</a></div>
      </div>
      <div className="container foot-bot">
        <div>© 2025 KONBINI SHOP — コンビニショップ</div>
        <div>v2.0 / SANTIAGO · CHILE</div>
      </div>
    </footer>
  );
}

/* ───────────────── home ───────────────── */
function HeroBlock() {
  const [idx, setIdx] = useState(0);
  return (
    <section className="hero">
      <div className="hero-arrows">
        <button className="icon-btn" onClick={() => setIdx(i => (i + 3) % 4)}>{Ic.chevL}</button>
        <button className="icon-btn" onClick={() => setIdx(i => (i + 1) % 4)}>{Ic.chevR}</button>
      </div>
      <div className="hero-grid">
        <div className="hero-text">
          <div>
            <div className="row" style={{ gap: 10 }}>
              <span className="pill accent">{HERO.cat}</span>
              <span className="eyebrow">FEATURED · 注目</span>
            </div>
            <h1>{HERO.title1}<br/><em>{HERO.title2}</em></h1>
            <p className="lead">{HERO.lead}</p>
          </div>
          <div className="hero-bottom">
            <button className="btn dark lg">Comprar entradas {Ic.arrow}</button>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: ".15em" }}>FECHA</span>
              <span style={{ fontWeight: 600 }}>{HERO.date}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: ".15em" }}>LUGAR</span>
              <span style={{ fontWeight: 600 }}>{HERO.place}</span>
            </div>
            <div className="hero-dots" style={{ marginLeft: "auto" }}>
              {[0,1,2,3].map(i => <div key={i} className={`d ${i === idx ? "on" : ""}`} onClick={() => setIdx(i)} />)}
            </div>
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-poster">
            <div className="pp-jp">ロヒアリム<br/>戦記</div>
            <div className="pp-title">The War of the Rohirrim</div>
            <div className="pp-foot">2025 · WARNER BROS ANIME</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Rail({ title, ja, items, landscape = false, cols = 6 }) {
  return (
    <section>
      <div className="sec-head">
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <h2>{title}</h2>
          <span className="ja">{ja}</span>
        </div>
        <a className="more">Ver todos {Ic.arrow}</a>
      </div>
      <div className={`card-grid ${cols === 4 ? "cols-4" : ""}`}>
        {items.map(e => <EventCard key={e.id} e={e} landscape={landscape} />)}
      </div>
    </section>
  );
}

function HomePage() {
  const conciertos = EVENTS.filter(e => e.cat === "Conciertos").concat(EVENTS.filter(e => e.cat === "Conciertos")).slice(0, 6);
  const cine = EVENTS.filter(e => e.cat === "Cine").concat(EVENTS.filter(e => e.cat === "Cine")).slice(0, 6);
  return (
    <main className="container">
      <HeroBlock />
      <Rail title="Destacados" ja="注目の作品" items={FEATURED} />
      <Rail title="Conciertos" ja="ライブ" items={conciertos} landscape />
      <Rail title="Cine" ja="シネマ" items={cine} landscape />
    </main>
  );
}

/* ───────────────── category ───────────────── */
function CategoryPage() {
  const { route } = useRouter();
  const cat = route.params?.cat || "cine";
  const meta = CATEGORIES.find(c => c.id === cat) || CATEGORIES[1];
  const [filter, setFilter] = useState("todos");
  const filters = ["todos", "hoy", "esta semana", "este mes", "gratis", "destacados"];
  const items = EVENTS.filter(e => e.cat.toLowerCase() === meta.label.toLowerCase());
  const allItems = items.length ? [...items, ...items, ...items].slice(0, 12) : EVENTS.slice(0, 12);

  return (
    <main className="container">
      <div style={{ margin: "32px 0 12px", display: "flex", justifyContent: "space-between", alignItems: "end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div className="eyebrow">CATEGORÍA · カテゴリ</div>
          <h1 className="display" style={{ fontSize: 64, margin: "12px 0 6px" }}>{meta.label}<span style={{ color: "var(--accent)" }}>.</span></h1>
          <p style={{ color: "var(--ink-2)", margin: 0, maxWidth: "50ch" }}>
            {allItems.length} eventos disponibles · explora y compra tu entrada en segundos.
          </p>
        </div>
        <div className="jp" style={{ fontSize: 80, color: "var(--ink-3)", opacity: .3, lineHeight: .9, fontWeight: 900 }}>{meta.ja}</div>
      </div>
      <div className="chip-row">
        {filters.map(f => (
          <button key={f} className={`chip ${filter === f ? "on" : ""}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      <div className="filter-bar">
        <div className="left">
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: ".15em" }}>MOSTRANDO</span>
          <strong style={{ fontSize: 14 }}>{allItems.length} resultados</strong>
        </div>
        <div className="right">
          <div className="field-inline">{Ic.cal} Cualquier fecha</div>
          <div className="field-inline">{Ic.pin} Santiago, CL</div>
          <div className="field-inline">Ordenar: Relevancia</div>
        </div>
      </div>
      <div className="card-grid cols-4" style={{ margin: "24px 0 60px" }}>
        {allItems.map((e, i) => <EventCard key={e.id + "-" + i} e={e} />)}
      </div>
    </main>
  );
}

/* ───────────────── event interior ───────────────── */
function EventPage() {
  const { route, nav } = useRouter();
  const e = EVENTS.find(x => x.id === route.params?.id) || EVENTS[0];

  return (
    <main className="container">
      <div className="event-hero">
        <div className={`poster-art ${e.art}`} style={{ position: "absolute", inset: 0, opacity: .55 }} />
        <div className="haze" />
        <div className="grain" />
        <div className="event-hero-body">
          <div className="event-poster-lg">
            <Poster e={e} />
          </div>
          <div>
            <div className="row" style={{ gap: 10 }}>
              <span className="pill solid">{e.cat}</span>
              <span className="pill">{e.ja}</span>
            </div>
            <h1>{e.title}</h1>
            <div className="sub-line">{e.date} · {e.place}</div>
          </div>
          <button className="btn ghost" style={{ marginLeft: "auto" }}>{Ic.share} Compartir</button>
        </div>
      </div>

      <div className="event-grid">
        <div className="event-body">
          <h2>Sobre el evento</h2>
          <p>
            Cinépolis trae a Chile la película más esperada del año: <strong>{e.title}</strong>. Ambientada en el legendario universo creado por J.R.R. Tolkien, esta épica animación nos transporta 183 años antes de los eventos de El Señor de los Anillos, a una historia jamás contada.
          </p>
          <p>
            Un ataque sorpresivo de Wulf, un astuto y traicionero lord de Rohan en busca de venganza por la muerte de su padre, fuerza a Helm Mano de Martillo, rey de Rohan, y a su pueblo a hacer una resistencia desesperada en la antigua fortaleza de Hornburg.
          </p>

          <h2>Galería</h2>
          <div className="gallery">
            <div className="g1"><div className="poster-art pa-3" /><div style={{ position: "absolute", bottom: 12, left: 12, color: "white", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".1em" }}>▶ TRAILER OFICIAL</div></div>
            <div><div className="poster-art pa-9" /></div>
            <div><div className="poster-art pa-5" /></div>
            <div><div className="poster-art pa-1" /></div>
            <div><div className="poster-art pa-6" /></div>
          </div>

          <h2>Etiquetas</h2>
          <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
            {["anime", "fantasía", "tolkien", "warner bros", "estreno", "épica", "doblaje latino"].map(t => (
              <span key={t} className="pill">#{t}</span>
            ))}
          </div>
        </div>

        <aside>
          <div className="ticket-panel">
            <span className="eyebrow">TICKETS · チケット</span>
            <h3 style={{ marginTop: 8 }}>Compra tu entrada</h3>
            <p style={{ color: "var(--ink-3)", fontSize: 12, margin: "4px 0 8px" }}>Pago seguro vía pasarela. No solicitamos datos de tarjeta.</p>
            <div>
              <div className="ticket-row">
                <div><div className="name">General</div><div className="desc">Sala estándar · butaca libre</div></div>
                <div className="price">$9.990 <span style={{ fontWeight: 400, color: "var(--ink-3)" }}>CLP</span></div>
              </div>
              <div className="ticket-row">
                <div><div className="name">3D Premium</div><div className="desc">Lentes incluidos · sala IMAX</div></div>
                <div className="price">$14.990 <span style={{ fontWeight: 400, color: "var(--ink-3)" }}>CLP</span></div>
              </div>
              <div className="ticket-row">
                <div><div className="name">VIP · Combo</div><div className="desc">Reclinable + cabritas + bebida</div></div>
                <div className="price">$22.990 <span style={{ fontWeight: 400, color: "var(--ink-3)" }}>CLP</span></div>
              </div>
            </div>
            <button className="btn primary block" style={{ marginTop: 14 }}>Comprar entradas {Ic.arrow}</button>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)", letterSpacing: ".1em", textAlign: "center", marginTop: 10 }}>
              POWERED BY · KONBINI PAY
            </div>
          </div>

          <div className="info-block">
            <div className="lbl">{Ic.cal} FECHA Y HORA</div>
            <div className="row" style={{ justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed var(--line)" }}>
              <div><strong>23 Abril 2025</strong><div style={{ color: "var(--ink-3)", fontSize: 12 }}>Miércoles</div></div>
              <div className="mono" style={{ fontSize: 13 }}>12:00 · 15:30 · 19:00</div>
            </div>
            <div className="row" style={{ justifyContent: "space-between", padding: "8px 0" }}>
              <div><strong>24 Abril 2025</strong><div style={{ color: "var(--ink-3)", fontSize: 12 }}>Jueves</div></div>
              <div className="mono" style={{ fontSize: 13 }}>14:00 · 18:00 · 21:30</div>
            </div>
          </div>

          <div className="info-block">
            <div className="lbl">{Ic.pin} UBICACIÓN</div>
            <div style={{ fontWeight: 600 }}>Teatro Cariola</div>
            <div style={{ color: "var(--ink-3)", fontSize: 13, marginTop: 2 }}>San Diego nº 246, Santiago, Región Metropolitana</div>
            <div className="map"><div className="pin" /></div>
          </div>

          <div className="info-block">
            <div className="lbl">ENLACES</div>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <a className="pill" href="#">{Ic.insta} Instagram</a>
              <a className="pill" href="#">{Ic.fb} Facebook</a>
              <a className="pill" href="#">Sitio oficial</a>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

/* ───────────────── form ───────────────── */
function FormPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    title: "", company: "", category: "", desc: "", about: "",
    free: false, prices: [{ name: "Entrada General", amount: "" }],
    dates: [{ date: "", start: "", end: "" }],
    venue: "", address: "",
    web: "", socials: [""],
    banner: null, poster: null, gallery: [], videos: [""],
  });
  const update = (k, v) => setData(d => ({ ...d, [k]: v }));

  return (
    <main>
      <div style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--line)", padding: "18px 0" }}>
        <div className="container row" style={{ justifyContent: "space-between" }}>
          <BrandMark size={28} />
          <div className="row" style={{ gap: 10 }}>
            <span className="mono" style={{ fontSize: 11, letterSpacing: ".15em", color: "var(--ink-3)" }}>PASO {step} DE 3</span>
            <button className="btn ghost"><span style={{ marginRight: 6 }}>?</span> Ayuda</button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="form-shell">
          <div className="form-stepbar">
            {[1,2,3].map(n => <div key={n} className={`seg ${n < step ? "done" : ""} ${n === step ? "curr" : ""}`} />)}
          </div>

          <div className="step-num">PASO {step} / 03</div>
          {step === 1 && <Step1 data={data} update={update} />}
          {step === 2 && <Step2 data={data} update={update} />}
          {step === 3 && <Step3 data={data} update={update} />}

          <div className="form-foot">
            <button className="btn ghost" onClick={() => step > 1 ? setStep(step - 1) : null} disabled={step === 1} style={{ opacity: step === 1 ? .3 : 1 }}>
              {Ic.chevL} Volver
            </button>
            <div className="row" style={{ gap: 14 }}>
              <button className="btn ghost">Guardar borrador</button>
              <button className="btn primary" onClick={() => step < 3 ? setStep(step + 1) : alert("¡Publicación enviada a revisión!")}>
                {step === 3 ? "Publicar evento" : "Continuar"} {Ic.arrow}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Step1({ data, update }) {
  const cats = ["Cine", "Conciertos", "Convenciones", "Streamings", "Ferias", "Anime · TV", "Gaming", "Cosplay"];
  return (
    <div>
      <h1 className="step-title">Hola, Gabriel.<br/>Cuéntanos sobre tu evento.</h1>
      <p className="step-lead">Esta información se mostrará en tu publicación. Podrás editarla en cualquier momento antes de publicar.</p>

      <fieldset>
        <div className="field-set-title"><span className="n">1.1</span> Información básica</div>
        <div className="field">
          <label>Título del evento</label>
          <input type="text" placeholder="Ej: Concierto Anime Symphonic Orchestra 2025" value={data.title} onChange={e => update("title", e.target.value)} />
          <div className="help">Sé claro y descriptivo. Este es el nombre que verán los asistentes.</div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Empresa / Productor</label>
            <input type="text" placeholder="Ej: Cinépolis, Productora 8U" value={data.company} onChange={e => update("company", e.target.value)} />
          </div>
          <div className="field">
            <label>Categoría</label>
            <select value={data.category} onChange={e => update("category", e.target.value)}>
              <option value="">Selecciona una categoría</option>
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Descripción general</label>
          <textarea placeholder="Describe brevemente el evento, su temática y formato." value={data.desc} onChange={e => update("desc", e.target.value)} />
          <div className="help">Aparece en las tarjetas de búsqueda. 280 caracteres máx.</div>
        </div>
        <div className="field">
          <label>Acerca de <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>(opcional)</span></label>
          <textarea placeholder="Cuenta lo que los asistentes pueden esperar: artistas invitados, actividades, proyecciones especiales…" value={data.about} onChange={e => update("about", e.target.value)} style={{ minHeight: 140 }} />
        </div>
      </fieldset>

      <fieldset>
        <div className="field-set-title"><span className="n">1.2</span> Precio del evento</div>
        <div className="ck-row" onClick={() => update("free", !data.free)} style={{ marginBottom: 16 }}>
          <div className={`ck ${data.free ? "on" : ""}`}>{data.free && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Evento gratuito</div>
            <div style={{ color: "var(--ink-3)", fontSize: 12 }}>Marca esta opción si no se cobra entrada.</div>
          </div>
        </div>

        {!data.free && (
          <div>
            {data.prices.map((p, i) => (
              <div className="price-row" key={i}>
                <div className="field" style={{ margin: 0 }}>
                  <label>Nombre de tarifa</label>
                  <input type="text" placeholder="Ej: Entrada General, VIP, Estudiante" value={p.name}
                    onChange={e => update("prices", data.prices.map((pp, j) => j === i ? { ...pp, name: e.target.value } : pp))} />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>Precio</label>
                  <div className="input-prefix">
                    <span>$</span>
                    <input type="number" placeholder="0" value={p.amount}
                      onChange={e => update("prices", data.prices.map((pp, j) => j === i ? { ...pp, amount: e.target.value } : pp))} />
                    <span className="suffix">CLP</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "end" }}>
                  {data.prices.length > 1 && (
                    <button className="icon-btn" onClick={() => update("prices", data.prices.filter((_, j) => j !== i))}>{Ic.close}</button>
                  )}
                </div>
              </div>
            ))}
            <button className="add-line" onClick={() => update("prices", [...data.prices, { name: "", amount: "" }])}>{Ic.plus} Agregar otra tarifa</button>
            <div className="help" style={{ marginTop: 12 }}>El pago se procesa a través de nuestra pasarela. <strong>No solicitamos datos de tarjeta directamente.</strong></div>
          </div>
        )}
      </fieldset>
    </div>
  );
}

function Step2({ data, update }) {
  return (
    <div>
      <h1 className="step-title">Horarios, ubicación y links.</h1>
      <p className="step-lead">Indica dónde y cuándo ocurre el evento, y dónde podemos enviar a tus asistentes para más información.</p>

      <fieldset>
        <div className="field-set-title"><span className="n">2.1</span> Día y hora del evento</div>
        {data.dates.map((d, i) => (
          <div className="grid-3" key={i} style={{ marginBottom: 14 }}>
            <div className="field" style={{ margin: 0 }}>
              <label>Fecha {i === 0 ? "" : `(día ${i + 1})`}</label>
              <input type="text" placeholder="DD / MM / AAAA" value={d.date}
                onChange={e => update("dates", data.dates.map((dd, j) => j === i ? { ...dd, date: e.target.value } : dd))} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Hora inicio</label>
              <input type="text" placeholder="20:00" value={d.start}
                onChange={e => update("dates", data.dates.map((dd, j) => j === i ? { ...dd, start: e.target.value } : dd))} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Hora término</label>
              <input type="text" placeholder="23:00" value={d.end}
                onChange={e => update("dates", data.dates.map((dd, j) => j === i ? { ...dd, end: e.target.value } : dd))} />
            </div>
          </div>
        ))}
        <button className="add-line" onClick={() => update("dates", [...data.dates, { date: "", start: "", end: "" }])}>{Ic.plus} Agregar otro día</button>
      </fieldset>

      <fieldset>
        <div className="field-set-title"><span className="n">2.2</span> Ubicación</div>
        <div className="field">
          <label>Lugar / Venue</label>
          <input type="text" placeholder="Ej: Teatro Cariola, Movistar Arena, Online" value={data.venue} onChange={e => update("venue", e.target.value)} />
        </div>
        <div className="field">
          <label>Dirección completa</label>
          <input type="text" placeholder="Calle, número, comuna, región" value={data.address} onChange={e => update("address", e.target.value)} />
          <div className="help">Si tu evento es online, escribe "Evento virtual".</div>
        </div>
      </fieldset>

      <fieldset>
        <div className="field-set-title"><span className="n">2.3</span> Enlaces importantes</div>
        <div className="field">
          <label>Sitio web / Ticketera</label>
          <div className="input-prefix">
            <span>https://</span>
            <input type="text" placeholder="ticketmaster.com/tu-evento" value={data.web} onChange={e => update("web", e.target.value)} />
          </div>
          <div className="help">Si tienes una ticketera externa, los compradores serán dirigidos ahí.</div>
        </div>
        <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: "block" }}>Redes sociales</label>
        {data.socials.map((s, i) => (
          <div className="row" key={i} style={{ marginBottom: 10 }}>
            <div className="input-prefix" style={{ flex: 1 }}>
              <span>@</span>
              <input type="text" placeholder="instagram.com/tu-evento" value={s}
                onChange={e => update("socials", data.socials.map((ss, j) => j === i ? e.target.value : ss))} />
            </div>
            {data.socials.length > 1 && <button className="icon-btn" onClick={() => update("socials", data.socials.filter((_, j) => j !== i))}>{Ic.close}</button>}
          </div>
        ))}
        <button className="add-line" onClick={() => update("socials", [...data.socials, ""])}>{Ic.plus} Agregar otra red social</button>
      </fieldset>
    </div>
  );
}

function Step3({ data, update }) {
  return (
    <div>
      <h1 className="step-title">Imágenes y video.</h1>
      <p className="step-lead">Una buena imagen es decisiva. Usa el banner para destacar y el poster para listados verticales.</p>

      <fieldset>
        <div className="field-set-title"><span className="n">3.1</span> Imágenes principales</div>
        <div className="upload-grid">
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: "block" }}>Banner (horizontal · 16:9)</label>
            <div className="upload-box">
              <div className="ic">{Ic.upl}</div>
              <div style={{ fontWeight: 500, color: "var(--ink-2)" }}>Sube una imagen horizontal</div>
              <small>JPG / PNG · máx 5MB · sin texto sobreimpreso</small>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: "block" }}>Poster (vertical · 2:3)</label>
            <div className="upload-box tall">
              <div className="ic">{Ic.upl}</div>
              <div style={{ fontWeight: 500, color: "var(--ink-2)", fontSize: 13 }}>Poster oficial</div>
              <small>JPG / PNG · 1200×1800</small>
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <div className="field-set-title"><span className="n">3.2</span> Galería</div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[0,1,2,3,4,5,6,7].map(i => (
            <div key={i} className="upload-box" style={{ aspectRatio: "1/1", padding: 14 }}>
              <div className="ic" style={{ width: 28, height: 28 }}>{Ic.plus}</div>
              <small style={{ fontSize: 10 }}>Imagen {i + 1}</small>
            </div>
          ))}
        </div>
        <div className="help" style={{ marginTop: 10 }}>Hasta 10 imágenes. Aparecerán en la sección "Galería" del evento.</div>
      </fieldset>

      <fieldset>
        <div className="field-set-title"><span className="n">3.3</span> Videos</div>
        {data.videos.map((v, i) => (
          <div className="row" key={i} style={{ marginBottom: 10 }}>
            <div className="input-prefix" style={{ flex: 1 }}>
              <span>▶</span>
              <input type="text" placeholder="https://youtube.com/watch?v=..." value={v}
                onChange={e => update("videos", data.videos.map((vv, j) => j === i ? e.target.value : vv))} />
            </div>
            {data.videos.length > 1 && <button className="icon-btn" onClick={() => update("videos", data.videos.filter((_, j) => j !== i))}>{Ic.close}</button>}
          </div>
        ))}
        <button className="add-line" onClick={() => update("videos", [...data.videos, ""])}>{Ic.plus} Agregar otro video</button>
      </fieldset>

      <div style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 14, padding: 18, display: "flex", gap: 14, alignItems: "start" }}>
        <div style={{ width: 36, height: 36, borderRadius: 999, background: "var(--accent)", color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{Ic.help}</div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Revisión antes de publicar</div>
          <div style={{ color: "var(--ink-2)", fontSize: 13, lineHeight: 1.55 }}>
            Tu publicación pasará por una revisión rápida (24–48 hrs) antes de aparecer en Konbini. Te notificaremos por correo cuando esté lista.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── login ───────────────── */
function LoginPage() {
  const { nav } = useRouter();
  const { theme, setTheme } = useTheme();
  useEffect(() => { document.body.classList.add("no-chrome"); return () => document.body.classList.remove("no-chrome"); }, []);

  const tiles = ["pa-1","pa-2","pa-3","pa-4","pa-5","pa-6","pa-7","pa-8","pa-9","pa-10","pa-11","pa-12","pa-1","pa-2","pa-3","pa-4"];
  return (
    <div className="login-shell">
      <div className="login-art">
        <div className="collage">
          {tiles.map((t, i) => <div key={i} className={`poster-art ${t}`} />)}
        </div>
        <div className="mask" />
        <a onClick={() => nav("home")} style={{ position: "relative", zIndex: 2, cursor: "pointer", display: "inline-block" }}>
          <BrandMark size={32} />
        </a>
        <div className="login-brand-card">
          <div className="jp" style={{ fontSize: 11, letterSpacing: ".2em", color: "var(--ink-3)" }}>コンビニショップ</div>
          <div className="display" style={{ fontSize: 28, margin: "10px 0 6px", color: "var(--ink)" }}>Konbini</div>
          <div style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.5 }}>El supermercado del entretenimiento geek en LATAM.</div>
        </div>
      </div>
      <div className="login-form-side">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 30 }}>
          <button className="btn ghost" onClick={() => nav("home")}>{Ic.chevL} Inicio</button>
          <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? Ic.sun : Ic.moon}
          </button>
        </div>
        <div className="eyebrow">INGRESAR · ログイン</div>
        <h2 style={{ marginTop: 12 }}>Todo lo que amas,<br/>en un solo lugar<span style={{ color: "var(--accent)" }}>.</span></h2>
        <p className="lead">Crea tu cuenta para guardar eventos, comprar entradas con un click y publicar tu propio evento.</p>

        <button className="social-btn">{Ic.google} Continuar con Google</button>
        <button className="social-btn">{Ic.insta} Continuar con Instagram</button>
        <button className="social-btn">{Ic.apple} Continuar con Apple</button>

        <div className="login-sep">o continúa con tu email</div>

        <div className="field">
          <input type="email" placeholder="tu@email.com" />
        </div>
        <button className="btn dark lg block" onClick={() => nav("home")}>Continuar {Ic.arrow}</button>

        <p className="legal">
          Al continuar aceptas nuestros <a>Términos</a> y <a>Política de privacidad</a>. Tus datos están protegidos bajo Ley 19.628 de Chile.
        </p>
      </div>
    </div>
  );
}

/* ───────────────── app ───────────────── */
function App() {
  return (
    <ThemeProvider>
      <RouterProvider>
        <Shell />
      </RouterProvider>
    </ThemeProvider>
  );
}

function Shell() {
  const { route } = useRouter();
  const isLogin = route.name === "login";
  return (
    <>
      {!isLogin && <Header />}
      {route.name === "home" && <HomePage />}
      {route.name === "category" && <CategoryPage />}
      {route.name === "event" && <EventPage />}
      {route.name === "form" && <FormPage />}
      {route.name === "login" && <LoginPage />}
      {!isLogin && <Footer />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);
