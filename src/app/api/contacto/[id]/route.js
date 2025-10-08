import 'server-only';

import { NextResponse } from "next/server";

import { sendContactResponseEmail } from "@/lib/email";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const contactoId = parseInt(id);

    console.log('GET /api/contacto/[id] - ID:', contactoId);

    if (isNaN(contactoId)) {
      return NextResponse.json({
        success: false,
        error: 'ID de contacto inválido'
      }, { status: 400 });
    }

    const contacto = await prisma.contacto.findUnique({
      where: { id: contactoId }
    });

    if (!contacto) {
      return NextResponse.json({
        success: false,
        error: 'Mensaje de contacto no encontrado'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      mensaje: contacto
    });

  } catch (error) {
    console.error('Error en GET /api/contacto/[id]:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const contactoId = parseInt(id);

    console.log('PUT /api/contacto/[id] - ID:', contactoId, 'Body:', body);

    // Verificar que el ID es válido
    if (isNaN(contactoId)) {
      return NextResponse.json({
        success: false,
        error: 'ID de contacto inválido'
      }, { status: 400 });
    }

    // Obtener el mensaje de contacto de la base de datos
    const contacto = await prisma.contacto.findUnique({
      where: { id: contactoId }
    });

    if (!contacto) {
      return NextResponse.json({
        success: false,
        error: 'Mensaje de contacto no encontrado'
      }, { status: 404 });
    }

    // Manejar diferentes acciones
    const { action, respuesta, leido, archivado } = body;

    // Acción: Responder al mensaje
    if (action === 'responder') {
      if (!respuesta || !respuesta.trim()) {
        return NextResponse.json({
          success: false,
          error: 'La respuesta no puede estar vacía'
        }, { status: 400 });
      }

      // Verificar que el contacto tenga email
      const clientEmail = contacto.email || contacto.correo;
      if (!clientEmail) {
        return NextResponse.json({
          success: false,
          error: 'El contacto no tiene email registrado'
        }, { status: 400 });
      }

      try {
        // Enviar email al cliente
        const emailResult = await sendContactResponseEmail({
          to: clientEmail,
          clientName: contacto.nombre || 'Cliente',
          originalMessage: contacto.mensaje,
          response: respuesta
        });

        console.log('📧 Resultado envío email:', emailResult);

        if (!emailResult.sent) {
          console.error('❌ Error al enviar email:', emailResult);
          return NextResponse.json({
            success: false,
            error: 'No se pudo enviar el email',
            details: emailResult.error || emailResult.reason,
            emailDebug: emailResult
          }, { status: 500 });
        }

        // Actualizar el registro en la base de datos
        const updatedContacto = await prisma.contacto.update({
          where: { id: contactoId },
          data: {
            respondido: true,
            respuesta: respuesta,
            fechaRespuesta: new Date(),
            leido: true // Marcar como leído al responder
          }
        });

        return NextResponse.json({
          success: true,
          message: "Respuesta enviada exitosamente al cliente",
          contacto: updatedContacto,
          emailId: emailResult.id,
          transport: emailResult.transport
        });

      } catch (emailError) {
        console.error('❌ Error crítico al enviar email:', emailError);
        
        // Aunque falle el email, guardar la respuesta en la BD
        try {
          await prisma.contacto.update({
            where: { id: contactoId },
            data: {
              respondido: true,
              respuesta: respuesta,
              fechaRespuesta: new Date(),
              leido: true
            }
          });
        } catch (dbError) {
          console.error('❌ Error al guardar en BD:', dbError);
        }

        return NextResponse.json({
          success: false,
          error: 'Error al enviar el email',
          details: emailError.message,
          note: 'La respuesta fue guardada en la base de datos'
        }, { status: 500 });
      }
    }

    // Acción: Marcar como leído/no leído
    if (typeof leido === 'boolean') {
      const updatedContacto = await prisma.contacto.update({
        where: { id: contactoId },
        data: { leido }
      });

      return NextResponse.json({
        success: true,
        message: `Mensaje marcado como ${leido ? 'leído' : 'no leído'}`,
        contacto: updatedContacto
      });
    }

    // Acción: Archivar/desarchivar
    if (typeof archivado === 'boolean') {
      const updatedContacto = await prisma.contacto.update({
        where: { id: contactoId },
        data: { archivado }
      });

      return NextResponse.json({
        success: true,
        message: `Mensaje ${archivado ? 'archivado' : 'desarchivado'}`,
        contacto: updatedContacto
      });
    }

    // Si no hay ninguna acción válida
    return NextResponse.json({
      success: false,
      error: 'Acción no especificada o inválida'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Error en PUT /api/contacto/[id]:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const contactoId = parseInt(id);

    console.log('DELETE /api/contacto/[id] - ID:', contactoId);

    if (isNaN(contactoId)) {
      return NextResponse.json({
        success: false,
        error: 'ID de contacto inválido'
      }, { status: 400 });
    }

    // Verificar que existe antes de eliminar
    const contacto = await prisma.contacto.findUnique({
      where: { id: contactoId }
    });

    if (!contacto) {
      return NextResponse.json({
        success: false,
        error: 'Mensaje de contacto no encontrado'
      }, { status: 404 });
    }

    // Eliminar el contacto
    await prisma.contacto.delete({
      where: { id: contactoId }
    });

    return NextResponse.json({
      success: true,
      message: "Mensaje eliminado exitosamente",
      id: contactoId
    });

  } catch (error) {
    console.error('Error en DELETE /api/contacto/[id]:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}