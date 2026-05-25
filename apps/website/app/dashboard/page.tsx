import { Suspense } from "react";
import AdminPage from "./AdminPage";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "var(--ink-3)" }}>Cargando…</div>}>
      <AdminPage />
    </Suspense>
  );
}
