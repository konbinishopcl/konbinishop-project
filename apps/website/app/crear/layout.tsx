import type { ReactNode } from "react";
import { FormProvider } from "./FormContext";

// Layout propio para la vista de creación de eventos.
// FormProvider mantiene el estado del formulario en memoria (+ localStorage para texto)
// y persiste entre los pasos /crear/1 → /crear/2 → /crear/3.
//
// Diseño: form-shell (single-column, max-width 720px, ver globals.css)
// Cada StepNClient renderiza su propio header sticky + form-shell + form-foot.
export default function CrearLayout({ children }: { children: ReactNode }) {
  // form-shell: los pasos usan esta clase internamente para el layout del formulario
  return (
    <FormProvider>
      {children}
    </FormProvider>
  );
}
