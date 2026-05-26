import { redirect } from "next/navigation";

// La página de upsell vive dentro del flujo /crear para no heredar el header público.
export default function UpsellRedirect() {
  redirect("/crear/upsell");
}
