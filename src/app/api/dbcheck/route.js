import { NextResponse } from 'next/server';

import { env } from '@/lib/env';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET() {
  const info = {
    timestamp: new Date().toISOString(),
    nodeEnv: env.NODE_ENV,
    hasDatabaseUrl: Boolean(env.DATABASE_URL),
    databaseHost: env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'NOT_SET',
    prismaReady: false,
    errors: null,
  };

  try {
    await prisma.$connect();
    info.prismaReady = true;
    // tiny query
    await prisma.$queryRaw`SELECT 1 as ok`;
  } catch (e) {
    info.errors = { name: e.constructor?.name, message: e.message, code: e.code };
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      // Silently ignore disconnect errors
      console.error('Disconnect error:', disconnectError);
    }
  }

  return NextResponse.json(info, { status: 200 });
}
