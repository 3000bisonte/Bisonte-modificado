import { NextResponse } from "next/server";

import { withValidation } from "@/server/http/withValidation";
import { contactoCreateSchema } from "@/server/schemas/contacto";
import { sendContactNotificationEmail } from "@/lib/email";

import prisma from "../../../libs/prisma";

export async function GET() {
  try {
  // Modelo Prisma: Contacto -> cliente: prisma.contacto (camelCase)
  const mensajes = await prisma.contacto.findMany({
      orderBy: { id: "desc" },
    });
    return NextResponse.json({
      success: true,
      data: mensajes,
      message: `${mensajes.length} mensajes obtenidos`
    });
  } catch (error) {
    console.error("Error al obtener mensajes:", error);
    return NextResponse.json({ 
      success: false,
      error: "Error al obtener mensajes",
      details: error.message 
    }, { status: 500 });
  }
}

export const POST = withValidation(contactoCreateSchema, async (_req, body) => {
  // Persist minimal fields now (keep previous behavior for correo/email)
  try {
  const correo = (body && (body.correo || body.email)) || 'anonimo@bisonte.com';
  const nuevoMensaje = await prisma.contacto.create({
      data: {
        nombre: body.nombre,
        mensaje: body.mensaje,
        celular: body.celular,
        ciudad: body.ciudad,
        tipo_documento: body.tipo_documento || null,
        numero_documento: body.numero_documento || null,
    correo,
      },
    });

    // 📧 Enviar notificación por email a bisontepqrs@gmail.com
    try {
      const emailResult = await sendContactNotificationEmail({
        nombre: body.nombre,
        correo,
        celular: body.celular,
        ciudad: body.ciudad,
        mensaje: body.mensaje,
      });
      if (emailResult.sent) {
        console.log('📧 Notificación de contacto enviada a bisontepqrs@gmail.com:', emailResult.id);
      } else {
        console.warn('⚠️ No se pudo enviar notificación de contacto:', emailResult.reason || emailResult.error);
      }
    } catch (emailError) {
      // No fallar la solicitud si el email no se envía
      console.error('❌ Error al enviar notificación de contacto:', emailError);
    }

    return NextResponse.json({ success: true, mensaje: 'Mensaje enviado correctamente', data: nuevoMensaje });
  } catch (error) {
    console.error('Error al guardar mensaje:', error);
    return NextResponse.json({ error: 'Error al enviar mensaje', detalle: error && error.message }, { status: 500 });
  }
});