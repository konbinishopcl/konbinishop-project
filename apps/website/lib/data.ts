// Datos de la maqueta — hardcodeados, portados del prototipo de diseño.
// (Sin conexión a la API; esto es solo la maqueta del website.)

export type Category = { id: string; label: string; ja: string };

export type EventItem = {
  id: number;
  title: string;
  cat: string;
  ja: string;
  art: string;
  date: string;
  place: string;
  price: number;
  stamp: string;
};

export type Pub = {
  id: number;
  title: string;
  date: string;
  place: string;
  price: string;
  art: string;
  created: string;
  status: "rev" | "pub" | "rej" | "arc";
  reason: string | null;
};

export type User = {
  name: string;
  email: string;
  phone: string;
  initials: string;
};

export const CATEGORIES: Category[] = [
  { id: "home", label: "Inicio", ja: "ホーム" },
  { id: "cine", label: "Cine", ja: "シネマ" },
  { id: "conciertos", label: "Conciertos", ja: "ライブ" },
  { id: "convenciones", label: "Convenciones", ja: "コンベンション" },
  { id: "streamings", label: "Streamings", ja: "配信" },
  { id: "ferias", label: "Ferias", ja: "フェア" },
];

export const EVENTS: EventItem[] = [
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

export const FEATURED: EventItem[] = [EVENTS[0], EVENTS[1], EVENTS[2], EVENTS[3], EVENTS[4], EVENTS[5]];

export const HERO = {
  cat: "Cine",
  title1: "El Señor de los Anillos",
  title2: "La Guerra de los Rohirrim",
  date: "23 ABR 2025",
  place: "Cinépolis · Santiago",
  lead: "La épica regresa a la gran pantalla. Ambientada 183 años antes de los eventos de la Comunidad del Anillo.",
  badge: "ESTRENO ANIME",
};

export const PUBS: Pub[] = [
  { id: 1, title: "Creepy Nuts: One Man Tour 2025", date: "8 ABR 2025", place: "Teatro Caupolicán", price: "$50.000", art: "pa-7", created: "20 ABR 2025", status: "rev", reason: null },
  { id: 2, title: "Anime Symphonic Orchestra", date: "12 MAY 2025", place: "Movistar Arena", price: "$45.000", art: "pa-4", created: "18 ABR 2025", status: "pub", reason: null },
  { id: 3, title: "Cosplay Battle Royale", date: "1 JUN 2025", place: "Estación Mapocho", price: "$15.000", art: "pa-11", created: "15 ABR 2025", status: "rej", reason: "Imagen del banner contiene texto." },
  { id: 4, title: "Studio Ghibli Marathon", date: "20 MAY 2025", place: "Cine Hoyts", price: "$8.990", art: "pa-3", created: "12 ABR 2025", status: "pub", reason: null },
  { id: 5, title: "Festival K-Pop Chile", date: "30 JUN 2025", place: "Movistar Arena", price: "$75.000", art: "pa-12", created: "10 ABR 2025", status: "rev", reason: null },
  { id: 6, title: "Gaming Convention 2024", date: "15 NOV 2024", place: "Espacio Riesco", price: "$25.000", art: "pa-8", created: "1 OCT 2024", status: "arc", reason: null },
];

export const STATUS_META: Record<Pub["status"], { cls: string; label: string }> = {
  rev: { cls: "st-rev", label: "En revisión" },
  pub: { cls: "st-pub", label: "Publicado" },
  rej: { cls: "st-rej", label: "Rechazado" },
  arc: { cls: "", label: "Archivado" },
};

export const MOCK_USER: User = {
  name: "Edgardo Toro",
  email: "edgardo.toro@gmail.com",
  phone: "+56 9 9771 7724",
  initials: "ET",
};
