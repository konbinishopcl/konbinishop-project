import { redirect } from "next/navigation";

// /crear → redirige al paso 1
export default function CrearPage() {
  redirect("/crear/1");
}
