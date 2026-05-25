import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { DashboardShell } from "./DashboardShell";
import "./admin.css";

export const metadata: Metadata = { title: "Konbini · Admin" };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <DashboardShell>{children}</DashboardShell>
    </AdminGuard>
  );
}
