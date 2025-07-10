import prisma from "@/libs/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const perfilId = Number(params.id);

  // Validar que el ID sea un número válido
  if (isNaN(perfilId)) {
    return NextResponse.json(
      { error: "El ID proporcionado no es válido." },
      { status: 400 }
    );
  }

  // Obtener el perfil del usuario
  const perfil = await prisma.usuario.findUnique({
    where: { id: perfilId },
  });

  // Validar si el perfil existe
  if (!perfil) {
    return NextResponse.json(
      { error: "Perfil no encontrado." },
      { status: 404 }
    );
  }

  let envios;

  // Si el usuario es administrador, obtiene todos los envíos con estado "Recolección programada"
  if (perfil.esAdministrador) {
    envios = await prisma.historialEnvio.findMany({
      where: {
        OR: [
          { Estado: "RECOLECCION_PENDIENTE" },
          { Estado: "RECOGIDO_TRANSPORTADORA" },
          { Estado: "EN_TRANSPORTE" },
          { Estado: "ENTREGADO" },
          { Estado: "DEVOLUCION" },
          { Estado: "REPROGRAMAR" },
        ],
      },
    });
  } else {
    // Si no es administrador, obtiene solo los envíos relacionados a su perfil
    envios = await prisma.historialEnvio.findMany({
      where: {
        PerfilId: perfilId,
      },
    });
  }

  console.log("Envíos encontrados:", envios);

  return NextResponse.json(envios);
}
