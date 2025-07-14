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

    // ✅ CONSULTAR LA TABLA historialEnvio
    const envios = await prisma.historialEnvio.findMany({
      where: {
        OR: [
          { CorreoRemitente: email },
          { CorreoDestinatario: email },
        ]
      },
      orderBy: {
        FechaSolicitud: 'desc'
      }
    });

    console.log(`✅ Encontrados ${envios.length} envíos para ${email}`);

    return NextResponse.json(envios);

  } catch (error) {
    console.error('❌ Error consultando historial:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}