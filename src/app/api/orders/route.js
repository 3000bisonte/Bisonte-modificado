import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import { crearEnvioSchema } from '@/schemas/envios';

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

    // Validar datos de entrada con Zod
    const validationResult = crearEnvioSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: 'Datos de envío inválidos', 
          errors: validationResult.error.flatten().fieldErrors 
        }, 
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;
    const userEmail = typeof body.usuarioEmail === 'string' ? body.usuarioEmail.trim() : null;
    const paymentIdRaw = body.paymentId ?? body.PaymentId ?? body.pagoId ?? body.PagoId ?? null;

    let usuario = null;
    if (userEmail) {
      try {
        usuario = await prisma.usuarios.findUnique({ where: { email: userEmail } });
      } catch (error) {
        console.error('Error buscando usuario por email:', error);
      }
    }

    const serializeValue = (value) => {
      if (value === null || value === undefined) {
        return null;
      }
      if (typeof value === 'string') {
        return value;
      }
      try {
        return JSON.stringify(value);
      } catch (error) {
        console.warn('No se pudo serializar el valor, se usará cadena vacía:', error);
        return '';
      }
    };

    const destinatarioValue = serializeValue(validatedData.Destinatario);
    const remitenteValue = serializeValue(validatedData.Remitente);

    // Crear nuevo envío dentro de una transacción
    const newOrder = await prisma.$transaction(async (tx) => {
      const data = {
        NumeroGuia: validatedData.NumeroGuia,
        Estado: validatedData.Estado,
        Origen: validatedData.Origen,
        Destino: validatedData.Destino,
        Destinatario: destinatarioValue ?? '',
        Remitente: remitenteValue ?? '',
        usuarioId: usuario?.id ?? null,
      };

      if (paymentIdRaw) {
        data.PaymentId = String(paymentIdRaw);
      }

      return await tx.historial_envio.create({
        data,
      });
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    if (error?.code === 'P2002' && Array.isArray(error?.meta?.target) && error.meta.target.includes('NumeroGuia')) {
      return NextResponse.json({
        message: 'El número de guía ya existe',
        code: 'ORDER_DUPLICATE_TRACKING',
      }, { status: 409 });
    }
    return NextResponse.json({ 
      message: 'Error creating order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
