import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export function GET(_request, { params }) {
  return NextResponse.json({ success: true, message: `obteniendo remitente ${params.id}` });
}

export function PUT(_request, { params }) {
  return NextResponse.json({ success: true, message: `Actualizando remitente ${params.id}` });
}

export function DELETE(_request, { params }) {
  return NextResponse.json({ success: true, message: `Eliminado remitente ${params.id}` });
}

export async function POST(request) {
  try {
    const {
      nombre,
      tipoDocumento,
      numeroDocumento,
      celular,
      direccionRecogida,
      detalleDireccion,
      recomendaciones,
    } = await request.json();

    const newRemitente = await prisma.remitente.create({
      data: {
        nombre,
        tipo_documento: tipoDocumento,
        numero_documento: numeroDocumento,
        celular,
        direccion_recogida: direccionRecogida,
        detalle_direccion: detalleDireccion,
        recomendaciones,
      },
    });

    return NextResponse.json({ success: true, remitente: newRemitente }, { status: 201 });
  } catch (error) {
    console.error("Error creando remitente:", error);
    return NextResponse.json(
      { success: false, error: "No fue posible crear el remitente" },
      { status: 500 }
    );
  }
}
