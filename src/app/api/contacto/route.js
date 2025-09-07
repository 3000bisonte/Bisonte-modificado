import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";

export async function GET() {
  try {
  // Modelo Prisma: Contacto -> cliente: prisma.contacto (camelCase)
  const mensajes = await prisma.contacto.findMany({
      orderBy: { id: "desc" },
    });
    return NextResponse.json(mensajes);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener mensajes" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { 
      nombre, 
      tipo_documento, 
      numero_documento, 
      celular, 
      ciudad, 
      email, 
      correo, 
      mensaje 
    } = await request.json();

    // Validar que los campos requeridos estén presentes
    if (!nombre || !mensaje) {
      return NextResponse.json(
        { error: "Nombre y mensaje son requeridos" },
        { status: 400 }
      );
    }

    // Crear el registro en la base de datos
  const nuevoMensaje = await prisma.contacto.create({
      data: {
        nombre,
        tipo_documento,
        numero_documento,
        celular,
        ciudad,
        email,
        correo: correo || email || 'anonimo@bisonte.com',
        mensaje,
      },
    });

    return NextResponse.json({
      success: true,
      mensaje: "Mensaje enviado correctamente",
      data: nuevoMensaje,
    });

  } catch (error) {
    console.error("Error al guardar mensaje:", error);
    return NextResponse.json(
      { error: "Error al enviar mensaje", detalle: error.message },
      { status: 500 }
    );
  }
}