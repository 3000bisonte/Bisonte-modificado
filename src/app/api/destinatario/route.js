import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";

export async function POST(request) {
  const {
    nombre,
    tipoDocumento,
    numeroDocumento,
    correo,
    celular,
    direccionEntrega,
    detalleDireccion,
    noProhibidos,
  } = await request.json();

  const newDestinatario = await prisma.destinatario.create({
    data: {
      nombre,
      tipo_documento: tipoDocumento,
      numero_documento: numeroDocumento,
      correo,
      celular,
      direccion_entrega: direccionEntrega,
      detalleDireccion,
      noProhibidos,
    },
  });
  return NextResponse.json(newDestinatario);
}
