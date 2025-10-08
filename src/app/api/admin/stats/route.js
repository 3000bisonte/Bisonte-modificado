import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Contar usuarios (tabla: usuarios)
    const usuarios = await prisma.usuarios.count();

    // Contar envíos (tabla: historialEnvio)
  const envios = await prisma.historial_envio.count();

  // Contar mensajes de contacto (modelo: contacto)
  const mensajes = await prisma.contacto.count();

    return NextResponse.json({ usuarios, envios, mensajes });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener estadísticas", detalle: error.message },
      { status: 500 }
    );
  }
}