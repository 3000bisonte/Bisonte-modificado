import { NextResponse, type NextRequest } from 'next/server';
import { compose, handle, withErrorBoundary, withValidation } from '@/lib/http';
import { remitenteCreateSchema, remitenteUpdateSchema, remitenteQuerySchema } from '@/schemas/remitente';
import { createRemitenteSvc, updateRemitenteSvc } from '@/server/services/remitenteService';

// Simulamos datos de remitente para pruebas
const mockRemitente = {
  id: 1,
  nombre: 'Juan Pérez',
  celular: '1234567890',
  direccion: 'Calle Principal 123',
  ciudad: 'Bogotá',
  documento: '12345678',
  email: 'juan.perez@email.com',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const GET = compose(withValidation(remitenteQuerySchema, { source: 'query' }), handle(), withErrorBoundary())(async (_req, { body }) => {
  const { id, email } = body as any;
  if (id) {
    return NextResponse.json({ success: true, remitente: { ...mockRemitente, id: parseInt(id, 10) } });
  }
  if (email) {
    return NextResponse.json({ success: true, remitente: { ...mockRemitente, email } });
  }
  return NextResponse.json({ success: true, remitentes: [mockRemitente] });
});

export const POST = compose(withValidation(remitenteCreateSchema), handle(), withErrorBoundary())(async (_req, { body }) => {
  const nuevo = await createRemitenteSvc(body as any);
  return NextResponse.json({ success: true, message: 'Remitente creado exitosamente', remitente: nuevo }, { status: 201 });
});

export const PUT = compose(withValidation(remitenteUpdateSchema), handle(), withErrorBoundary())(async (_req, { body }) => {
  const actualizado = await updateRemitenteSvc(body as any);
  return NextResponse.json({ success: true, message: 'Remitente actualizado exitosamente', remitente: actualizado });
});

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    console.log('DELETE /api/remitente - Eliminando remitente:', { id });

    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID del remitente es requerido' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Remitente con ID ${id} eliminado exitosamente`
    });

  } catch (error: any) {
    console.error('Error en DELETE /api/remitente:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error?.message ?? String(error)
      },
      { status: 500 }
    );
  }
}
