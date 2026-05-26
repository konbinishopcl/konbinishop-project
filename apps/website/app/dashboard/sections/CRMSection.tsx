"use client";

const CARDS: Record<string, { t: "contact" | "foto" | "creat"; nm: string; ev: string; d: string }[]> = {
  Nuevo: [
    { t: "contact", nm: "María Pérez",    ev: "Aniversario AnimeShop", d: "Hace 2h" },
    { t: "foto",    nm: "Pedro Sánchez",  ev: "Cosplay Meetup",        d: "Hace 5h" },
  ],
  Contactado: [
    { t: "creat",   nm: "Sofía L.",       ev: "Concierto J-Rock",      d: "Ayer" },
    { t: "foto",    nm: "Diego A.",        ev: "ComicCon 2024",         d: "Hace 2d" },
  ],
  "En negociación": [
    { t: "foto",    nm: "Productora Tepuy", ev: "Festival Anime Sur",  d: "Hace 3d" },
  ],
  "Cerrado ganado": [
    { t: "creat",   nm: "Cinépolis",       ev: "Demon Slayer Premiere", d: "Hace 1 sem" },
    { t: "foto",    nm: "Kawaii Shop",     ev: "Aniversario",           d: "Hace 2 sem" },
  ],
  "Cerrado perdido": [
    { t: "contact", nm: "Anónimo",         ev: "Spam",                  d: "Hace 3 sem" },
  ],
};

const TAG_LABEL: Record<string, string> = {
  contact: "Contacto",
  foto:    "Fotografía",
  creat:   "Creadores",
};

export default function CRMSection() {
  return (
    <div className="kanban">
      {Object.entries(CARDS).map(([col, items]) => (
        <div key={col} className="kanban-col">
          <div className="ch">
            <span className="nm">{col}</span>
            <span className="ct">{items.length}</span>
          </div>
          {items.map((c, i) => (
            <div key={i} className="kan-card">
              <div className="ts">
                <span className={`tag ${c.t}`}>{TAG_LABEL[c.t]}</span>
              </div>
              <div className="nm">{c.nm}</div>
              <div className="ev">{c.ev}</div>
              <div className="ts2">{c.d}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
