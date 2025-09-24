import { NextResponse } from "next/server";
import prisma from "../../../libs/prisma";

// Ensure this route always runs dynamically on Node.js runtime (needed for Prisma)
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET() {
  try {
    const envios = await prisma.historialEnvio.findMany({
      orderBy: { FechaSolicitud: "desc" },
      include: {
        usuario: {
          select: {
            nombre: true,
            email: true,
            celular: true,
          },
        },
      },
    });

    console.log("Envíos obtenidos:", envios.length);
    return NextResponse.json({
      success: true,
      data: envios,
      message: `${envios.length} envíos obtenidos`
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