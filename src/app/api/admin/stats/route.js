import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Contar usuarios (tabla: usuarios)
    const usuarios = await prisma.usuarios.count();

    // Contar envíos (tabla: historialEnvio)
    const envios = await prisma.historialEnvio.count();

    // Contar mensajes de contacto (tabla: contacto)
    const mensajes = await prisma.Contacto.count();

    return NextResponse.json({ usuarios, envios, mensajes });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener estadísticas", detalle: error.message },
      { status: 500 }
    );
  }
}