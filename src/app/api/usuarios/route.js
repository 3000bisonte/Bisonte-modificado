import { NextResponse } from "next/server";
// Usar el singleton central en lugar de instanciar PrismaClient aquí para evitar demasiadas conexiones.
import prisma from "@/libs/prisma";

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
    return NextResponse.json([], { status: 500 });
  }
}