import { z } from "zod";

export const mpPayerSchema = z.object({
  email: z.string().trim().email(),
  entity_type: z.enum(["individual", "association", "company"]).optional().default("individual"),
  identification: z
    .object({
      type: z.string().trim().max(5).default("CC"),
      number: z.string().trim().max(30),
    })
    .optional(),
});

export const mercadoPagoCreateSchema = z.object({
  transaction_amount: z
    .union([z.number(), z.string().regex(/^\d+(\.\d+)?$/)])
    .transform((v) => (typeof v === "string" ? Number(v) : v))
    .pipe(z.number().positive().max(5_000_000)),
  payment_method_id: z.string().trim().max(30).optional(),
  description: z.string().trim().max(255).optional(),
  installments: z
    .union([z.number().int(), z.string().regex(/^\d+$/)])
    .transform((v) => (typeof v === "string" ? Number(v) : v))
    .pipe(z.number().int().min(1).max(48))
    .optional()
    .default(1),
  payer: mpPayerSchema,
});

export type MercadoPagoCreate = z.infer<typeof mercadoPagoCreateSchema>;
