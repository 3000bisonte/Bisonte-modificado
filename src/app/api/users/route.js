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
});

// POST handler
export const POST = withErrorHandler(async (request) => {
  try {
    const body = await request.json();

    const validated = await validateRequest(body, {
      nombre: { type: 'string', required: true, min: 2, max: 100 },
      email: { type: 'string', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      celular: { type: 'string', required: false },
      ciudad: { type: 'string', required: false },
    });

    const created = await prisma.usuarios.create({
      data: {
        nombre: validated.nombre,
        email: validated.email.toLowerCase(),
        celular: validated.celular ?? null,
        ciudad: validated.ciudad ?? null,
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
});
