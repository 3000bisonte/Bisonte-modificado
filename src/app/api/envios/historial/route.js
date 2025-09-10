import { NextResponse } from "next/server";
// Ensure this route is always dynamic (uses request.url)
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import prisma from '../../../../libs/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    console.log('🔍 Consultando historial para:', email);

    // ✅ STEP 1: Buscar el usuario por email
    const usuario = await prisma.usuarios.findUnique({
      where: { email: email }
    });

    if (!usuario) {
      console.log('⚠️ Usuario no encontrado:', email);
      return NextResponse.json([]);
    }

    console.log('👤 Usuario encontrado:', usuario.id);

    // ✅ STEP 2: Usar HistorialEnvio (con H mayúscula) como está en tu schema
  // Modelo Prisma: HistorialEnvio -> cliente: prisma.historialEnvio
  const envios = await prisma.historialEnvio.findMany({
      where: {
        usuarioId: usuario.id  // Según tu schema
      },
      orderBy: {
        FechaSolicitud: 'desc'  // PascalCase como en tu schema
      },
      include: {
        usuario: {
          select: {
            nombre: true,
            email: true
          }
        }
      }
    });

    console.log(`✅ Encontrados ${envios.length} envíos para usuario ID ${usuario.id}`);

    return NextResponse.json(envios);

  } catch (error) {
    console.error('❌ Error consultando historial:', error);
    console.error('❌ Detalle completo:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}