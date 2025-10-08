import { NextResponse } from 'next/server';

import { compose, handle, withErrorBoundary, withValidation, withRateLimit } from '@/lib/http';
import { destinatarioCreateSchema, destinatarioUpdateSchema, destinatarioQuerySchema } from '@/schemas/destinatario';

// Simulamos datos de destinatario para pruebas
const mockDestinatario = {
  id: 1,
  nombre: 'María García',
  celular: '0987654321',
  direccion: 'Avenida Secundaria 456',
  ciudad: 'Medellín',
  documento: '87654321',
  email: 'maria.garcia@email.com',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const GET = compose(withValidation(destinatarioQuerySchema, { source: 'query' }), handle(), withErrorBoundary())(async (request, { body }) => {
  try {
  const { id, email } = body || {};

    console.log('GET /api/destinatario - Parámetros:', { id, email });

    // Si solicita un destinatario específico por ID
    if (id) {
      return NextResponse.json({
        success: true,
    destinatario: { ...mockDestinatario, id: parseInt(id) }
      });
    }

    // Si solicita por email
    if (email) {
      return NextResponse.json({
        success: true,
        destinatario: { ...mockDestinatario, email }
      });
    }

    // Devolver todos los destinatarios
    return NextResponse.json({
      success: true,
      destinatarios: [mockDestinatario]
    });

  } catch (error) {
    console.error('Error en GET /api/destinatario:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error.message 
      },
      { status: 500 }
    );
  }
});

export const POST = compose(withRateLimit({ limit: 10, windowSec: 60 }), withValidation(destinatarioCreateSchema), handle(), withErrorBoundary())(async (_req, { body }) => {
  const nuevoDestinatario = {
    ...mockDestinatario,
    id: Date.now(),
    ...body,
    celular: body.celular || body.telefono,
    direccion: body.direccion || 'Dirección no especificada',
    documento: body.documento || 'Sin documento',
    email: body.email || 'sin-email@ejemplo.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return NextResponse.json({ success: true, message: 'Destinatario creado exitosamente', destinatario: nuevoDestinatario }, { status: 201 });
});

export const PUT = compose(withValidation(destinatarioUpdateSchema), handle(), withErrorBoundary())(async (_req, { body }) => {
  const { id, ...updateData } = body;
  const destinatarioActualizado = {
    ...mockDestinatario,
    ...updateData,
    id: typeof id === 'string' ? parseInt(id) : id,
    updatedAt: new Date().toISOString(),
  };
  return NextResponse.json({ success: true, message: 'Destinatario actualizado exitosamente', destinatario: destinatarioActualizado });
});

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    console.log('DELETE /api/destinatario - Eliminando destinatario:', { id });

    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID del destinatario es requerido' 
        },
        { status: 400 }
      );
    }

    // Simular eliminación
    return NextResponse.json({
      success: true,
      message: `Destinatario con ID ${id} eliminado exitosamente`
    });

  } catch (error) {
    console.error('Error en DELETE /api/destinatario:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
