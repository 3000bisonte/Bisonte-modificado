import { NextResponse } from "next/server";

import { withValidation } from "@/server/http/withValidation";
import { contactoCreateSchema } from "@/server/schemas/contacto";

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
    correo,
      },
    });
    return NextResponse.json({ success: true, mensaje: 'Mensaje enviado correctamente', data: nuevoMensaje });
  } catch (error) {
    console.error('Error al guardar mensaje:', error);
    return NextResponse.json({ error: 'Error al enviar mensaje', detalle: error && error.message }, { status: 500 });
  }
});