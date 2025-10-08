import { NextResponse } from "next/server";

import prisma from "../../../../libs/prisma";

const ADMIN_VISIBLE_STATES = [
  "RECOLECCION_PENDIENTE",
  "RECOGIDO_TRANSPORTADORA",
  "EN_TRANSPORTE",
  "ENTREGADO",
  "DEVOLUCION",
  "REPROGRAMAR",
  "EN_CIUDAD_DESTINO",
  "EN_DISTRIBUCION",
  "NO_ENTREGADO",
  "ENVIO_CANCELADO",
  "DEVUELTO_ORIGEN",
  "EN_ESPERA_CLIENTE",
];

export async function GET(_request, { params }) {
  const perfilId = Number(params.id);

  if (!Number.isFinite(perfilId) || perfilId <= 0) {
    return NextResponse.json(
      { error: "El ID proporcionado no es válido." },
      { status: 400 }
    );
  }

  try {
    const perfil = await prisma.usuarios.findUnique({
      where: { id: perfilId },
      select: {
        id: true,
        nombre: true,
        email: true,
        esAdministrador: true,
      },
    });

    if (!perfil) {
      return NextResponse.json(
        { error: "Perfil no encontrado." },
        { status: 404 }
      );
    }

  const envios = await prisma.historial_envio.findMany({
      where: perfil.esAdministrador
        ? { Estado: { in: ADMIN_VISIBLE_STATES } }
        : { usuarioId: perfil.id },
      orderBy: { FechaSolicitud: "desc" },
    });

    return NextResponse.json({
      success: true,
      perfil: {
        id: perfil.id,
        nombre: perfil.nombre,
        email: perfil.email,
        esAdministrador: perfil.esAdministrador,
      },
      envios,
    });
  } catch (error) {
    console.error("Error en GET /obtenerenvios/[id]", error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    );
  }
}
