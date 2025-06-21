import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";
export async function GET() {
  const remitentes = await prisma.remitente.findMany();
  console.log(remitentes);
  return NextResponse.json("obteniendo remitente");
}
export async function POST(request) {
  const {
    nombre,
    tipoDocumento,
    numeroDocumento,
    celular,
    correo, // <--- Añadido aquí
    direccionRecogida,
    detalleDireccion,
    recomendaciones,
  } = await request.json();
  //console.log(data);
  try {
    // Verificar si el usuario ya existe basándote en el correo o número de documento
    const existingUser = await prisma.remitente.findUnique({
      where: {
        numero_documento: numeroDocumento, // O `numero_documento: numeroDocumento`, según lo que sea único
      },
    });

    if (existingUser) {
      // Si el usuario ya existe, puedes devolver un mensaje o manejarlo como prefieras
      return NextResponse.json(
        { message: "El remitente ya existe", user: existingUser },
        { status: 400 } // También podrías devolver un 409 Conflict si prefieres
      );
    }
    const newRemitente = await prisma.remitente.create({
      data: {
        nombre,
        tipo_documento: tipoDocumento,
        numero_documento: numeroDocumento,
        celular,
        correo, // <--- Añadido aquí
        direccion_recogida: direccionRecogida,
        detalle_direccion: detalleDireccion,
        recomendaciones,
      },
    });
    return NextResponse.json(newRemitente);
  } catch (error) {
    console.error("Error creando el usuario:", error);
    return NextResponse.json(
      { message: "Error al crear el usuario", error: error.message },
      { status: 500 }
    );
  }
}
