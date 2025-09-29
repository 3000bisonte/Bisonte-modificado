import { NextResponse } from "next/server";
// Usar el singleton central en lugar de instanciar PrismaClient aquí para evitar demasiadas conexiones.
import prisma from "../../../lib/prisma";

// Ensure this route always runs dynamically on Node.js runtime (needed for Prisma)
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

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
        historial_envio: true
      },
      orderBy: { id: "desc" },
    });
    const formatted = usuarios.map((usuario) => {
      const { historial_envio, ...rest } = usuario;
      return {
        ...rest,
        envios: historial_envio,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
      message: `${formatted.length} usuarios obtenidos`
    });
  } catch (error) {
    console.error("Error en GET /usuarios:", error);
    return NextResponse.json({
      success: false,
      error: "Error al obtener usuarios",
      details: error.message
    }, { status: 500 });
  }
}