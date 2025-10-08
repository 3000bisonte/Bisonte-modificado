import { NextResponse } from "next/server";

import prisma from "../../../lib/prisma";

// Ensure this route always runs dynamically on Node.js runtime (needed for Prisma)
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET() {
  try {
    const envios = await prisma.historial_envio.findMany({
      orderBy: { FechaSolicitud: "desc" },
      include: {
        usuarios: {
          select: {
            nombre: true,
            email: true,
            celular: true,
          },
        },
      },
    });

    const formatted = envios.map((envio) => {
      const { usuarios, ...rest } = envio;
      return {
        ...rest,
        usuario: usuarios || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
      message: `${formatted.length} envíos obtenidos desde obtenerenvios`
    });
  } catch (error) {
    console.error("Error al obtener envíos:", error);
    return NextResponse.json({
      success: false,
      error: "Error al obtener envíos",
      details: error.message
    }, { status: 500 });
  }
}
