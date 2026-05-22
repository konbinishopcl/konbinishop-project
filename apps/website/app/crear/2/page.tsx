import { api, type ApiRegion } from "@/lib/api";
import { Step2Client } from "./Step2Client";

// Fetcha regiones en el servidor — el select las tiene disponibles desde el primer render.
// Comunas se cargan en el cliente porque dependen de la región que elija el usuario.
export default async function Paso2Page() {
  const regions = await api.regions().catch((): ApiRegion[] => []);
  return <Step2Client regions={regions} />;
}
