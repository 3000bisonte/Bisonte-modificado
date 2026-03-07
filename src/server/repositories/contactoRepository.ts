import prisma from '@/libs/prisma';

export function createContactoRepo(data: { nombre: string; mensaje: string; correo?: string; celular?: string; ciudad?: string; tipo_documento?: string; numero_documento?: string; }) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  return prisma.contacto.create({
    data: {
      nombre: data.nombre,
      mensaje: data.mensaje,
      correo: data.correo || 'anonimo@bisonte.com',
      celular: data.celular,
      ciudad: data.ciudad,
      tipo_documento: data.tipo_documento || null,
      numero_documento: data.numero_documento || null,
    }
  });
}
