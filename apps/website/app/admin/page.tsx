import { redirect } from "next/navigation";

// /admin redirige a la vista por defecto del panel.
export default function AdminIndex() {
  redirect("/admin/dashboard");
}
