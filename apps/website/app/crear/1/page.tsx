import { api, type ApiCategory } from "@/lib/api";
import { Step1Client } from "./Step1Client";

// Fetcha categorías en el servidor para que el select tenga opciones
// disponibles desde el primer render — sin flash ni pérdida del valor guardado.
export default async function Paso1Page() {
  const categories = await api.categories().catch((): ApiCategory[] => []);
  return <Step1Client categories={categories} />;
}
