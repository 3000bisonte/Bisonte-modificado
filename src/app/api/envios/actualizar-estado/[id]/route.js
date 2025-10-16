import { NextResponse } from "next/server";

import { actualizarEstadoEnvioSchema, EstadoEnvio } from "@/schemas/envios";

import prisma from "../../../../../libs/prisma";
import { enviarNotificacionEstado } from "../../../../../lib/emailService";

// Estados terminales que no pueden ser actualizados
const ESTADOS_TERMINALES = [
  EstadoEnvio.ENTREGADO,
  EstadoEnvio.ENVIO_CANCELADO,
  EstadoEnvio.DEVUELTO_ORIGEN,
];

export async function PATCH(request, { params }) {
  try {
    const id = Number(params.id);
    const body = await request.json();

    console.log("🔄 Actualizando estado del envío:", { id, body });

    if (!id) {
      return NextResponse.json(
        { error: "ID de envío requerido" },
        { status: 400 }
      );
    }

    // Validar datos de entrada con Zod
    const validationResult = actualizarEstadoEnvioSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos para actualización de estado",
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { nuevoEstado } = validationResult.data;

    // Actualizar el estado dentro de una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Buscar el envío existente
      const envioExistente = await tx.historial_envio.findUnique({
        where: { id },
      });

      if (!envioExistente) {
        throw { code: "NOT_FOUND", message: "Envío no encontrado" };
      }

      const estadoActual = envioExistente.Estado;

      // Verificar si el estado actual es terminal
      if (ESTADOS_TERMINALES.includes(estadoActual)) {
        throw {
          code: "INVALID_STATE",
          message: `No se puede actualizar un envío en estado terminal: ${estadoActual}`,
        };
      }

      // Verificar si ya está en ese estado
      if (estadoActual === nuevoEstado) {
        return {
          unchanged: true,
          envio: envioExistente,
        };
      }

      // Actualizar el estado
      const updatedEnvio = await tx.historial_envio.update({
        where: { id },
        data: {
          Estado: nuevoEstado,
          // FechaActualizacion no existe en el schema - se omite
        },
      });

      return {
        unchanged: false,
        envio: updatedEnvio,
      };
    });

    if (result.unchanged) {
      return NextResponse.json(
        {
          message:
            "El envío ya se encuentra en este estado. No se requiere actualización.",
          envio: result.envio,
        },
        { status: 200 }
      );
    }

    console.log("✅ Envío actualizado exitosamente:", result.envio);

    // Enviar notificación por email al usuario
    try {
      // Obtener el email del usuario desde el envío
      const envioCompleto = await prisma.historial_envio.findUnique({
        where: { id },
        include: {
          usuario: {
            select: {
              email: true,
              nombre: true,
            },
          },
        },
      });

      if (envioCompleto?.usuario?.email) {
        console.log(`📧 Enviando notificación a: ${envioCompleto.usuario.email}`);
        
        // Enviar email de forma asíncrona (no bloqueante)
        enviarNotificacionEstado(result.envio, envioCompleto.usuario.email)
          .then((emailResult) => {
            if (emailResult.success) {
              console.log(`✅ Email enviado exitosamente a ${envioCompleto.usuario.email}`);
            } else {
              console.warn(`⚠️ No se pudo enviar email: ${emailResult.error}`);
            }
          })
          .catch((err) => {
            console.error(`❌ Error al enviar email: ${err.message}`);
          });
      } else {
        console.warn('⚠️ No se encontró email del usuario para notificación');
      }
    } catch (emailError) {
      // No bloqueamos la respuesta si falla el email
      console.error('❌ Error al procesar notificación por email:', emailError);
    }

    return NextResponse.json({
      success: true,
      envio: result.envio,
      message: "Estado actualizado exitosamente. Notificación enviada al usuario.",
    });
  } catch (error) {
    console.error("❌ Error al actualizar el estado del envío:", error);

    if (error.code === "NOT_FOUND") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error.code === "INVALID_STATE") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

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
  }
}
