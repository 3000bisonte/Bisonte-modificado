import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { env } from '@/lib/env';

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
    const one = await prisma.$queryRaw`SELECT 1 as ok`;
  } catch (e) {
    info.errors = { name: e.constructor?.name, message: e.message, code: e.code };
  } finally {
    try { await prisma.$disconnect(); } catch {}
  }

  return NextResponse.json(info, { status: 200 });
}
