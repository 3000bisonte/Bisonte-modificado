import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    console.log('GET /api/contacto/[id] - ID:', id);

    const mockMessage = {
      id: parseInt(id),
      nombre: 'Juan Pérez',
      email: 'juan@example.com',
      telefono: '1234567890',
      mensaje: 'Consulta sobre envíos',
      leido: false,
      archivado: false,
      fecha: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      mensaje: mockMessage
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

    console.log('PUT /api/contacto/[id] - ID:', id, 'Body:', body);

    return NextResponse.json({
      success: true,
      message: "Mensaje actualizado exitosamente",
      id: parseInt(id),
      updates: body
    });

  } catch (error) {
    console.error('Error en PUT /api/contacto/[id]:', error);
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
    console.log('DELETE /api/contacto/[id] - ID:', id);

    return NextResponse.json({
      success: true,
      message: "Mensaje eliminado exitosamente",
      id: parseInt(id)
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