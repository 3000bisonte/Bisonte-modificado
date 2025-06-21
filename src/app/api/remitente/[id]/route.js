import { NextResponse } from "next/server";

export function GET(request, { params }) {
  return NextResponse.json("obteniendo remitente" + params.id);
}
export function PUT(request, { params }) {
  return NextResponse.json("Actualizando remitente" + params.id);
}
export function DELETE(request, { params }) {
  return NextResponse.json("eliminado remitente" + params.id);
}
export async function POST(request) {
  const {
    nombre,
    tipoDocumento,
    numeroDocumento,
    celular,
    direccionRecogida,
    detalleDireccion,
    recomendaciones,
  } = await request.json();
  //console.log(data);
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
  return NextResponse.json(newRemitente);
}
