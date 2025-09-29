import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';


// GET handler
export async function GET() {
  try {
    const orders = await prisma.historial_envio.findMany({
      orderBy: { FechaSolicitud: 'desc' },
      select: {
        id: true,
        NumeroGuia: true,
        Origen: true,
        Destino: true,
        Destinatario: true,
        Remitente: true,
        Estado: true,
        FechaSolicitud: true,
        usuarioId: true,
      },
    });
    return NextResponse.json({ success: true, data: orders }, { status: 200 });
  } catch (error) {
    console.error('orders GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener órdenes', details: error.message },
      { status: 500 }
    );
  }
}

// POST handler
export async function POST(request) {
  try {
    const body = await request.json();

    const created = await prisma.historial_envio.create({
      data: {
        NumeroGuia: body.NumeroGuia || `BST-${Date.now()}`,
        Origen: body.Origen,
        Destino: body.Destino,
        Destinatario: body.Destinatario,
        Remitente: body.Remitente,
        Estado: body.Estado || 'Pendiente',
        usuarioId: body.usuarioId || null,
      },
      select: {
        id: true, NumeroGuia: true, Origen: true, Destino: true, Destinatario: true, Remitente: true, Estado: true, FechaSolicitud: true, usuarioId: true
      }
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('orders POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear orden', details: error.message },
      { status: 500 }
    );
  }
}
