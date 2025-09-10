import prisma from '@/libs/prisma';

export async function createContactoRepo(data: { nombre: string; mensaje: string; correo?: string; celular?: string; ciudad?: string; }) {
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
