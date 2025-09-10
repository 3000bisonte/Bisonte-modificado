import { createContactoRepo } from '../repositories/contactoRepository';
import type { ContactoCreate } from '../schemas/contacto';

export async function createContactoSvc(input: ContactoCreate) {
  const correo = (input as any).correo || (input as any).email || 'anonimo@bisonte.com';
  return createContactoRepo({
    nombre: input.nombre,
    mensaje: input.mensaje,
    correo,
    celular: input.celular,
    ciudad: input.ciudad,
  });
}
