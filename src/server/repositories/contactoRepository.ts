import prisma from '@/libs/prisma';

export function createContactoRepo(data: { nombre: string; mensaje: string; correo?: string; celular?: string; ciudad?: string; }) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  return prisma.contacto.create({
    data: {
      nombre: data.nombre,
      mensaje: data.mensaje,
      correo: data.correo || 'anonimo@bisonte.com',
      celular: data.celular,
      ciudad: data.ciudad,
    }
  });
}
