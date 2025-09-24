import { NextResponse } from 'next/server';
import prisma from '@/libs/prisma';
import { validateRequest } from '@/lib/validation.ts';
import { withErrorHandler } from '@/lib/errorHandler';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';


// GET handler
export const GET = withErrorHandler(async () => {
  try {
    const orders = await prisma.historialEnvio.findMany({
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
});

// POST handler
export const POST = withErrorHandler(async (request) => {
  try {
    const body = await request.json();

    const validated = await validateRequest(body, {
      NumeroGuia: { type: 'string', required: true, min: 3 },
      Origen: { type: 'string', required: true },
      Destino: { type: 'string', required: true },
      Destinatario: { type: 'string', required: true },
      Remitente: { type: 'string', required: true },
      Estado: { type: 'string', required: true },
      usuarioId: { type: 'number', required: false },
    });

    const created = await prisma.historialEnvio.create({
      data: {
        NumeroGuia: validated.NumeroGuia,
        Origen: validated.Origen,
        Destino: validated.Destino,
        Destinatario: validated.Destinatario,
        Remitente: validated.Remitente,
        Estado: validated.Estado,
        usuarioId: validated.usuarioId ?? null,
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
});
