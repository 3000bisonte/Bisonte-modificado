import { z } from 'zod';

export const remitenteCreateSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  ciudad: z.string().min(1, 'Ciudad requerida'),
  celular: z.string().optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  documento: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
}).refine((data) => !!(data.celular || data.telefono), {
  message: 'Celular o telefono es requerido',
  path: ['celular'],
});

export const remitenteUpdateSchema = z.object({
  id: z.union([z.number(), z.string()]),
  nombre: z.string().optional(),
  ciudad: z.string().optional(),
  celular: z.string().optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  documento: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
});

export type RemitenteCreate = z.infer<typeof remitenteCreateSchema>;
export type RemitenteUpdate = z.infer<typeof remitenteUpdateSchema>;
