import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";
export async function GET() {
  const perfil = await prisma.usuarios.findMany();
  console.log("perfil-get", perfil);
  return NextResponse.json(perfil);
}

export async function POST(request) {
  const {
    nombrePerfil,
    tipoDocumento,
    numeroDocumento,
    celular,
    direccionRecogida,
    detalleDireccion,
    recomendaciones,
    correo,
    nickname,
  } = await request.json();

  try {
    const existingUser = await prisma.usuarios.findUnique({
      where: { correo },
    });

    // Si el usuario ya existe, devolvemos el perfil existente
    if (existingUser) {
      return NextResponse.json(
        { message: "El usuario ya existe", user: existingUser },
        { status: 200 } // Puedes devolver 409 Conflict si prefieres
      );
    }

    // Si no existe, creamos el nuevo perfil
    const newRemitente = await prisma.usuarios.create({
      data: {
        nombre: nombrePerfil,
        tipo_documento: tipoDocumento,
        numero_documento: numeroDocumento,
        celular,
        direccion_recogida: direccionRecogida,
        detalle_direccion: detalleDireccion,
        recomendaciones,
        correo,
       
      },
    });
    console.log("newRemitente", newRemitente);
    return NextResponse.json(newRemitente);
  } catch (error) {
    // Manejo específico para errores de clave única
    if (error.code === "P2002") {
      console.error("Intento de crear un duplicado detectado.");
      return NextResponse.json(
        { message: "Error: El usuario ya existe." },
        { status: 409 }
      );
    }

    // Otros errores
    console.error("Error creando el usuario:", error);
    return NextResponse.json(
      { message: "Error al crear el usuario", error: error.message },
      { status: 500 }
    );
  }
}
