import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .min(7, "Teléfono muy corto")
  .max(20, "Teléfono muy largo")
  .regex(/^[0-9+\-\s()]+$/, "Formato de teléfono inválido");

const destinatarioCore = z.object({
  nombre: z.string().trim().min(1, "Nombre requerido").max(100),
  ciudad: z.string().trim().min(1, "Ciudad requerida").max(100),
  celular: phoneSchema.optional(),
  telefono: phoneSchema.optional(),
  direccion: z.string().trim().max(255).optional(),
  documento: z.string().trim().max(30).optional(),
  email: z.string().trim().email("Email inválido").toLowerCase().optional(),
});

export const destinatarioCreateSchema = destinatarioCore
  .refine((d) => !!(d.celular || d.telefono), {
    message: "Celular o telefono es requerido",
    path: ["celular"],
  })
  .transform((d) => ({
    ...d,
    celular: d.celular || d.telefono,
  }));

export const destinatarioUpdateSchema = z.object({
  id: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
  nombre: z.string().trim().max(100).optional(),
  ciudad: z.string().trim().max(100).optional(),
  celular: phoneSchema.optional(),
  telefono: phoneSchema.optional(),
  direccion: z.string().trim().max(255).optional(),
  documento: z.string().trim().max(30).optional(),
  email: z.string().trim().email("Email inválido").toLowerCase().optional(),
}).transform((d) => ({
  ...d,
  celular: d.celular || d.telefono,
}));

export type DestinatarioCreate = z.infer<typeof destinatarioCreateSchema>;
export type DestinatarioUpdate = z.infer<typeof destinatarioUpdateSchema>;

export const destinatarioQuerySchema = z
  .object({
    id: z.string().regex(/^\d+$/).optional(),
    email: z.string().trim().email().optional(),
  })
  .refine((q) => true, {
    message: "",
    path: [],
  });

export type DestinatarioQuery = z.infer<typeof destinatarioQuerySchema>;
