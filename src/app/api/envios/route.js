import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
    return NextResponse.json(envios);
  } catch (error) {
    console.error("Error al obtener envíos:", error);
    return NextResponse.json(
      { error: "Error al obtener envíos", detalle: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}