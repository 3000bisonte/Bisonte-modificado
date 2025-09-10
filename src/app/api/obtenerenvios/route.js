import { NextResponse } from "next/server";
import prisma from "../../../libs/prisma";

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

    return NextResponse.json({
      success: true,
      data: envios,
      message: `${envios.length} envíos obtenidos desde obtenerenvios`
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
