import { z } from 'zod';

// Accept both 'correo' and legacy 'email' and normalize to 'correo'
export const contactoCreateSchema = z
  .object({
    nombre: z.string().min(1, 'Nombre requerido'),
    mensaje: z.string().min(1, 'Mensaje requerido'),
    celular: z.string().optional(),
    ciudad: z.string().optional(),
    tipo_documento: z.string().optional(),
    numero_documento: z.string().optional(),
  correo: z.string().email('Email inválido').optional().or(z.literal('').transform(() => undefined)),
  email: z.string().email('Email inválido').optional().or(z.literal('').transform(() => undefined)),
  })
  .transform((data) => ({
    nombre: data.nombre,
    mensaje: data.mensaje,
    celular: data.celular,
    ciudad: data.ciudad,
    tipo_documento: data.tipo_documento,
    numero_documento: data.numero_documento,
  correo: (data.correo ?? data.email ?? 'anonimo@bisonte.com') as string,
  }));

export type ContactoCreate = z.infer<typeof contactoCreateSchema>;
