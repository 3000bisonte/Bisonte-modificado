import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .min(7, "Teléfono muy corto")
  .max(20, "Teléfono muy largo")
  .regex(/^[0-9+\-\s()]+$/, "Formato de teléfono inválido");

// Core object without transforms; use it to build variants
const remitenteCore = z.object({
  nombre: z.string().trim().min(1, "Nombre requerido").max(100),
  ciudad: z.string().trim().min(1, "Ciudad requerida").max(100),
  celular: phoneSchema.optional(),
  telefono: phoneSchema.optional(),
  direccion: z.string().trim().max(255).optional(),
  documento: z.string().trim().max(30).optional(),
  email: z.string().trim().email("Email inválido").toLowerCase().optional(),
});

export const remitenteCreateSchema = remitenteCore
  .refine((d) => !!(d.celular || d.telefono), {
    message: "Celular o telefono es requerido",
    path: ["celular"],
  })
  .transform((d) => ({
    ...d,
    celular: d.celular || d.telefono,
  }));

export const remitenteUpdateSchema = z.object({
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

export type RemitenteCreate = z.infer<typeof remitenteCreateSchema>;
export type RemitenteUpdate = z.infer<typeof remitenteUpdateSchema>;

// Query schema for GET /remitente?id=...&email=...
export const remitenteQuerySchema = z
  .object({
    id: z.string().regex(/^\d+$/).optional(),
    email: z.string().trim().email().optional(),
  })
  .refine((_q) => true, {
    // Permit empty query to list all; this refine is a no-op placeholder for future rules
    message: "",
    path: [],
  });

export type RemitenteQuery = z.infer<typeof remitenteQuerySchema>;
