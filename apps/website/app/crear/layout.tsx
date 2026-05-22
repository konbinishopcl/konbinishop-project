import type { ReactNode } from "react";
import { FormProvider } from "./FormContext";

// Layout propio para la vista de creación de eventos.
// FormProvider mantiene el estado del formulario en memoria (+ localStorage para texto)
// y persiste entre los pasos /crear/1 → /crear/2 → /crear/3.
export default function CrearLayout({ children }: { children: ReactNode }) {
  return <FormProvider>{children}</FormProvider>;
}
