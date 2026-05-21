import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import "./admin.css";

export const metadata: Metadata = {
  title: "Konbini · Admin",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin">
      <AdminSidebar />
      <main className="content">
        <AdminTopbar />
        {children}
      </main>
    </div>
  );
}
