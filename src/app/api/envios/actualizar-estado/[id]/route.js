import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const VALID_STATUSES = [
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

export async function PATCH(request, { params }) {
  try {
    const id = Number(params.id); // ✅ Cambiar de guiaId a id
    const { nuevoEstado } = await request.json();

    console.log("🔄 Actualizando estado del envío:", { id, nuevoEstado });

    if (!id) {
      return NextResponse.json(
        { error: "ID de envío requerido" },
        { status: 400 }
      );
    }

    if (!nuevoEstado || !VALID_STATUSES.includes(nuevoEstado)) {
      return NextResponse.json(
        {
          error: "Estado nuevo inválido o no proporcionado",
          estadosValidos: VALID_STATUSES,
        },
        { status: 400 }
      );
    }

    // Buscar el envío existente
    const envioExistente = await prisma.historialEnvio.findUnique({
      where: {
        id: id,
      },
    });

    if (!envioExistente) {
      return NextResponse.json(
        { error: "Envío no encontrado" },
        { status: 404 }
      );
    }

    const estadoActual = envioExistente.Estado;

    // Verificar si ya está en ese estado
    if (estadoActual === nuevoEstado) {
      return NextResponse.json(
        {
          message:
            "El envío ya se encuentra en este estado. No se requiere actualización.",
          envio: envioExistente,
        },
        { status: 200 }
      );
    }

    // Actualizar el estado
    const updatedEnvio = await prisma.historialEnvio.update({
      where: {
        id: id,
      },
      data: {
        Estado: nuevoEstado,
      },
    });

    console.log("✅ Envío actualizado exitosamente:", updatedEnvio);

    return NextResponse.json({
      success: true,
      envio: updatedEnvio,
      message: "Estado actualizado exitosamente",
    });
  } catch (error) {
    console.error("❌ Error al actualizar el estado del envío:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Envío no encontrado al intentar actualizar" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
