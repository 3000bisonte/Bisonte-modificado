import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import prisma from '@/libs/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: env.NODE_ENV,
      hasDatabase: !!env.DATABASE_URL,
      databaseHost: env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'NOT_FOUND'
    },
    prisma: {
      connected: false,
      error: null,
      tableChecks: {}
    }
  };

  try {
    // Test basic Prisma connection
    const testQuery = await prisma.$queryRaw`SELECT 1 as test`;
    diagnostics.prisma.connected = true;

    // Test main tables
    try {
      const userCount = await prisma.usuarios.count();
      diagnostics.prisma.tableChecks.usuarios = { accessible: true, count: userCount };
    } catch (e) {
      diagnostics.prisma.tableChecks.usuarios = { accessible: false, error: e.message };
    }

    try {
      const enviosCount = await prisma.historial_envio.count();
      diagnostics.prisma.tableChecks.historialEnvio = { accessible: true, count: enviosCount };
    } catch (e) {
      diagnostics.prisma.tableChecks.historialEnvio = { accessible: false, error: e.message };
    }

  } catch (error) {
    diagnostics.prisma.connected = false;
    diagnostics.prisma.error = {
      name: error.constructor.name,
      message: error.message,
      code: error.code
    };
  }

  return NextResponse.json(diagnostics, { status: 200 });
}