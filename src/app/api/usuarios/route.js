import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const usuarios = await prisma.usuarios.findMany({
      select: {
        id: true,
        nombre: true,
        celular: true,
        ciudad: true,
        //tipo_documento: true,
        //numero_documento: true,
        email: true,
        //direccion_recogida: true,
        //detalle_direccion: true,
        //esAdministrador: true,
        envios: true
      },
      orderBy: { id: "desc" },
    });
    return NextResponse.json(usuarios);
  } catch (error) {
    // Devuelve un array vacío en caso de error para evitar el crash
    return NextResponse.json([], { status: 500 });
  }
}