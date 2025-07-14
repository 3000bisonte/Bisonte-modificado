import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    // ✅ STEP 2: Buscar envíos relacionados al usuario (misma lógica que obtenerenvios)
    const envios = await prisma.historial_envio.findMany({
      where: {
        OR: [
          { PerfilId: usuario.id }, // Si el envío está asociado al usuario
          // Agregar otras condiciones según tu esquema
        ]
      },
      orderBy: {
        FechaSolicitud: 'desc'
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
  } finally {
    await prisma.$disconnect();
  }
}