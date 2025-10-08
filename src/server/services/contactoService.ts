import { createContactoRepo } from '../repositories/contactoRepository';
import type { ContactoCreate } from '../schemas/contacto';

export function createContactoSvc(input: ContactoCreate) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
  const correo = (input as any).correo || (input as any).email || 'anonimo@bisonte.com';
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return
  return createContactoRepo({
    nombre: input.nombre,
    mensaje: input.mensaje,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    correo,
    celular: input.celular,
    ciudad: input.ciudad,
  });
}
