import prisma from "@/libs/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  console.log("desde-id-server-", params.id);
  const perfil = await prisma.perfil.findUnique({
    where: {
      id: Number(params.id),
    },
  });
  console.log("desde-id-server-2", perfil);
  return NextResponse.json(perfil);
}
export async function PUT(request, { params }) {
  const data = await request.json();
  console.log("data-servidor", data);
  // Mapear los datos del formulario a los campos de la base de datos
  const mappedData = {
    nombre: data.nombrePerfil,
    tipo_documento: data.tipoDocumento, // nombre del formulario "tipoDocumento" mapeado a la BD "tipo_documento"
    numero_documento: data.numeroDocumento,
    celular: data.celular,
    direccion_recogida: data.direccionRecogida,
    detalle_direccion: data.detalleDireccion,
    recomendaciones: data.recomendaciones,
  };

  const perfil = await prisma.perfil.update({
    where: {
      id: Number(params.id),
    },
    data: mappedData, // Utilizar el objeto mapeado
  });

  return NextResponse.json(perfil);
}

export function DELETE(request, { params }) {
  return NextResponse.json("eliminado remitente" + params.id);
}
