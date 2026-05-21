import { HeroBlock } from "@/components/HeroBlock";
import { Rail } from "@/components/Rail";
import { EVENTS, FEATURED } from "@/lib/data";

export default function HomePage() {
  const conciertos = EVENTS.filter((e) => e.cat === "Conciertos")
    .concat(EVENTS.filter((e) => e.cat === "Conciertos"))
    .slice(0, 6);
  const cine = EVENTS.filter((e) => e.cat === "Cine")
    .concat(EVENTS.filter((e) => e.cat === "Cine"))
    .slice(0, 6);

  return (
    <main className="container">
      <HeroBlock />
      <Rail title="Destacados" ja="注目の作品" items={FEATURED} />
      <Rail title="Conciertos" ja="ライブ" items={conciertos} landscape />
      <Rail title="Cine" ja="シネマ" items={cine} landscape />
    </main>
  );
}
