import { z } from "zod";
import { remitenteCreateSchema } from "./remitente";
import { destinatarioCreateSchema } from "./destinatario";

const detallesSchema = z.object({
  descripcion: z.string().trim().max(500).optional().default(""),
  peso: z
    .union([z.string().trim(), z.number()])
    .transform((v) => (typeof v === "string" ? v.trim() : v))
    .optional(),
  valor: z
    .union([z.number(), z.string().regex(/^\d+(\.\d+)?$/)])
    .optional()
    .transform((v) => (typeof v === "string" ? Number(v) : v))
    .pipe(z.number().nonnegative().max(1_000_000).optional()),
});

export const guardarEnvioSchema = z.object({
  remitente: remitenteCreateSchema,
  destinatario: destinatarioCreateSchema,
  detalles: detallesSchema.optional(),
});

export type GuardarEnvio = z.infer<typeof guardarEnvioSchema>;
