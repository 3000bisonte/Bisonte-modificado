import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import { validateApiInput, registerSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';


// GET handler
export async function GET() {
  try {
    const users = await prisma.usuarios.findMany({
      select: { id: true, nombre: true, email: true, celular: true, ciudad: true },
      orderBy: { id: 'desc' },
    });
    return NextResponse.json({ success: true, data: users }, { status: 200 });
  } catch (error) {
    console.error('users GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener usuarios', details: error.message },
      { status: 500 }
    );
  }
}

// POST handler
export async function POST(request) {
  try {
    const body = await request.json();

    const validation = validateApiInput(registerSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: validation.error.details },
        { status: 400 }
      );
    }

    const created = await prisma.usuarios.create({
      data: {
        nombre: validation.data.nombre,
        email: validation.data.email.toLowerCase(),
        celular: validation.data.telefono || null,
        ciudad: null,
        updatedAt: new Date(),
      },
      select: { id: true, nombre: true, email: true, celular: true, ciudad: true },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('users POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear usuario', details: error.message },
      { status: 500 }
    );
  }
}
