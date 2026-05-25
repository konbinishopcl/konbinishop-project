import type { Metadata } from "next";
import { RegistroView } from "./RegistroView";

export const metadata: Metadata = {
  title: "Crear cuenta - Konbini",
};

export default function RegistroPage() {
  return <RegistroView />;
}
