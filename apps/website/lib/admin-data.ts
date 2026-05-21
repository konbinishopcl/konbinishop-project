// Datos mock del panel admin — portados del prototipo de diseño.

export const ARTS = [
  "pa-1", "pa-2", "pa-3", "pa-4", "pa-5", "pa-6",
  "pa-7", "pa-8", "pa-9", "pa-10", "pa-11", "pa-12",
];

export const CATS = ["Cine", "Conciertos", "Convenciones", "Streamings", "Ferias", "Gaming"];

export const STATS = ["pub", "rev", "rej", "dr", "arc"] as const;
export type AdminStatus = (typeof STATS)[number];

export const STAT_LABEL: Record<AdminStatus, string> = {
  pub: "Publicado",
  rev: "En revisión",
  rej: "Rechazado",
  dr: "Borrador",
  arc: "Archivado",
};

export type Producer = { nm: string; em: string };

const PRODUCERS: Producer[] = [
  { nm: "Cinépolis Chile", em: "ops@cinepolis.cl" },
  { nm: "Lotus Producciones", em: "contacto@lotus.cl" },
  { nm: "DG Medios", em: "eventos@dgmedios.cl" },
  { nm: "Bizarro Live", em: "info@bizarrolive.com" },
  { nm: "Edgardo Toro", em: "edgardo.toro@gmail.com" },
  { nm: "8U Studios", em: "hi@8u.studio" },
  { nm: "Konbini Curatoría", em: "curatoria@konbini.shop" },
  { nm: "Anime Club Stgo", em: "contacto@animeclub.cl" },
];

const VENUES = [
  "Teatro Caupolicán", "Movistar Arena", "Estación Mapocho", "Cinépolis Costanera",
  "Espacio Riesco", "Online · Streaming", "Teatro Cariola", "Centro Cultural CEINA",
  "Movistar Arena",
];

const TITLES_EVT = [
  "Ado: World Tour Hibana",
  "Demon Slayer: Infinity Castle",
  "Anime Symphonic Orchestra 2025",
  "Cosplay Battle Royale Santiago",
  "Studio Ghibli Marathon Especial",
  "Festival K-Pop Chile",
  "Gaming Convention 2025",
  "One Ok Rock: Latin Tour",
  "Solo Leveling: ReAwakening",
  "Attack on Titan: Last Attack",
  "Creepy Nuts: One Man Tour",
  "Super Japan Expo 2025",
  "ComicCon Chile 2025",
  "Crunchyroll Anime Awards",
  "My Hero Academia: You're Next",
  "Flow: Anime Shibari Tour",
  "Yoasobi en Santiago",
  "Pokémon Trading Card Open",
  "Fall Out Boy: Folie à Deux Tour",
  "Vocaloid Festival LATAM",
  "Manga Café Konbini",
  "TGS Watch Party Santiago",
  "Hatsune Miku Expo 2025",
  "Cyberpunk Fest Chile",
  "Sailor Moon Sinfónico",
  "League of Legends Worlds Watch",
  "Persona Sinfónica Vol. 2",
  "Anime Karaoke Konbini Night",
  "Ghibli Pop-up Shop",
  "Devil May Cry Live in Concert",
  "Naruto Symphonic Experience",
  "Fortnite Latam Open",
];

const JA_BITS = ["コンサート", "シネマ", "フェス", "ライブ", "アニメ", "コンベンション", "ストリーミング", "オープン"];

const MON = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

export type AdminEvent = {
  id: string;
  title: string;
  ja: string;
  cat: string;
  art: string;
  date: string;
  time: string;
  venue: string;
  producer: Producer;
  price: number;
  stock: number;
  sold: number;
  status: AdminStatus;
  created: string;
  featured: boolean;
};

function seed(i: number): AdminEvent {
  const month = (i * 3) % 12;
  const day = ((i * 7) % 27) + 1;
  const dateStr = `${String(day).padStart(2, "0")} ${MON[month]} 2025`;
  const cat = CATS[i % CATS.length];
  const stat = STATS[Math.floor((i * 13) % STATS.length)];
  const free = i % 11 === 0;
  const basePrice = free ? 0 : [4990, 9990, 14990, 19990, 29990, 45000, 65000, 80000][i % 8];
  const stock = 100 + ((i * 37) % 4000);
  const sold = Math.min(stock, Math.floor(stock * (((i * 11) % 100) / 100)));
  return {
    id: `EVT-${2025000 + i}`,
    title:
      TITLES_EVT[i % TITLES_EVT.length] +
      (i >= TITLES_EVT.length ? ` · vol. ${Math.floor(i / TITLES_EVT.length) + 1}` : ""),
    ja: JA_BITS[i % JA_BITS.length],
    cat,
    art: ARTS[i % ARTS.length],
    date: dateStr,
    time: ["19:00", "20:30", "21:00", "18:00", "22:00"][i % 5],
    venue: VENUES[i % VENUES.length],
    producer: PRODUCERS[i % PRODUCERS.length],
    price: basePrice,
    stock,
    sold,
    status: stat,
    created: `${((i * 5) % 28) + 1} ABR 2025`,
    featured: i % 9 === 0,
  };
}

export const ALL_EVENTS: AdminEvent[] = Array.from({ length: 64 }, (_, i) => seed(i));

// Formato de miles determinista (sin depender de Intl, evita mismatch SSR/cliente).
export const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
export const fmtPrice = (n: number) => (n === 0 ? "Gratis" : `$${fmt(n)}`);
