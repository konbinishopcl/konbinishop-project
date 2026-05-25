"use client";
import { use } from "react";
import { redirect } from "next/navigation";
import { CreateProductView } from "./CreateProductView";

type Kind = "spot" | "hero" | "articulo";

export default function CrearProductoPage({
  params,
}: {
  params: Promise<{ kind: string }>;
}) {
  const { kind } = use(params);

  // Evento redirects to existing Phase 3 form
  if (kind === "evento") {
    redirect("/crear");
  }

  const validKinds: Kind[] = ["spot", "hero", "articulo"];
  if (!validKinds.includes(kind as Kind)) {
    redirect("/cuenta");
  }

  return <CreateProductView kind={kind as Kind} />;
}
