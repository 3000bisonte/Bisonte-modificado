import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";

export async function POST(request) {
  try {
    const {
      numeroGuia,
      paymentId,
      origen,
      destino,
      destinatario,
      remitente,
      usuarioEmail
    } = await request.json();

    console.log("📦 Datos recibidos para guardar envío:", {
      numeroGuia,
      paymentId,
      origen,
      destino,
      destinatario,
      remitente,
      usuarioEmail
    });

    // Validar datos requeridos
    if (!numeroGuia || !origen || !destino || !destinatario || !remitente) {
      return NextResponse.json(
        { error: "Faltan datos requeridos para crear el envío (numeroGuia, origen, destino, destinatario, remitente)" },
        { status: 400 }
      );
    }

    // Buscar el usuario por email
    let usuarioId = null;
    if (usuarioEmail) {
      const usuario = await prisma.usuarios.findUnique({
        where: { email: usuarioEmail }
      });
      usuarioId = usuario?.id || null;
      console.log("👤 Usuario encontrado:", { email: usuarioEmail, id: usuarioId });
    }

    // Guardar en la base de datos
    const nuevoEnvio = await prisma.historialEnvio.create({
      data: {
        NumeroGuia: numeroGuia,
        PaymentId: paymentId || null, // ✅ Corregido: PaymentId con mayúscula
        Origen: origen,
        Destino: destino,
        Destinatario: destinatario,
        Remitente: remitente,
        Estado: "RECOLECCION_PENDIENTE",
        FechaSolicitud: new Date(),
        usuarioId: usuarioId,
      },
    });

    console.log("✅ Envío guardado exitosamente:", nuevoEnvio);

    return NextResponse.json({
      success: true,
      envio: nuevoEnvio,
      message: "Envío registrado exitosamente"
    });

  } catch (error) {
    console.error("❌ Error al guardar envío:", error);
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        details: error.message 
      },
      { status: 500 }
    );
  }
}