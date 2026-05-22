import { z } from "zod";

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function validUrl(raw: string): boolean {
  if (!raw.trim()) return true;
  try {
    const u = new URL(/^https?:\/\//.test(raw) ? raw : `https://${raw}`);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// ─── Paso 1 ────────────────────────────────────────────────────────────────

export const step1Schema = z
  .object({
    title:      z.string().min(3, "Mínimo 3 caracteres").max(120, "Máximo 120 caracteres"),
    company:    z.string().max(100).optional().or(z.literal("")),
    categoryId: z.string().min(1, "Selecciona una categoría"),
    desc:       z.string().min(10, "Mínimo 10 caracteres"),
    about:      z.string().optional().or(z.literal("")),
    free:       z.boolean(),
    // amount es number porque usamos type="number" + valueAsNumber
    prices: z.array(
      z.object({
        name:   z.string(),
        amount: z.number().optional(),
      })
    ),
  })
  .superRefine((val, ctx) => {
    if (!val.free) {
      val.prices.forEach((p, i) => {
        if (!p.name.trim()) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Nombre de tarifa obligatorio", path: ["prices", i, "name"] });
        }
        if (p.amount === undefined || Number.isNaN(p.amount)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ingresa un monto", path: ["prices", i, "amount"] });
        } else if (!Number.isInteger(p.amount)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Sin decimales", path: ["prices", i, "amount"] });
        } else if (p.amount < 500) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Mínimo $500 CLP", path: ["prices", i, "amount"] });
        }
      });
    }
  });

// ─── Paso 2 ────────────────────────────────────────────────────────────────

// socials/videos usan { val: string } para que useFieldArray funcione con primitivos
const socialItemSchema = z.object({
  val: z
    .string()
    .refine((v) => {
      if (!v.trim()) return true;
      const without = v.startsWith("@") ? v.slice(1) : v;
      return validUrl(/^https?:\/\//.test(without) ? without : `https://${without}`);
    }, "URL de red social no válida"),
});

export const step2Schema = z
  .object({
    dates: z.array(
      z
        .object({
          date:  z.string(),
          start: z.string().optional().or(z.literal("")),
          end:   z.string().optional().or(z.literal("")),
        })
        .superRefine((d, ctx) => {
          if (!d.date) return;
          if (d.date < today()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La fecha no puede estar en el pasado", path: ["date"] });
          }
          if (d.start && d.end && d.end <= d.start) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Hora de término debe ser posterior al inicio", path: ["end"] });
          }
        })
    ),
    address:       z.string().min(1, "Dirección obligatoria"),
    addressNumber: z.string().min(1, "Número obligatorio").regex(/^\d/, "Debe ser un número"),
    regionId:      z.string().optional().or(z.literal("")),
    communeId:     z.string().optional().or(z.literal("")),
    web: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((v) => !v?.trim() || validUrl(`https://${v}`), "Ingresa una URL válida (ej: ticketera.cl/evento)"),
    socials: z.array(socialItemSchema),
  })
  .superRefine((val, ctx) => {
    if (!val.dates.some((d) => d.date)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Agrega al menos una fecha para el evento", path: ["dates"] });
    }
  });

// ─── Paso 3 ────────────────────────────────────────────────────────────────

export const step3Schema = z.object({
  videos: z.array(
    z.object({
      val: z
        .string()
        .refine((v) => !v.trim() || validUrl(v), "URL de video no válida (debe incluir https://)"),
    })
  ),
});

export type Step1Values = z.infer<typeof step1Schema>;
export type Step2Values = z.infer<typeof step2Schema>;
export type Step3Values = z.infer<typeof step3Schema>;
