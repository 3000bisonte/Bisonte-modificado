import { NextResponse } from 'next/server';

// Endpoint temporal de diagnóstico - ELIMINAR después de verificar
export async function GET() {
  return NextResponse.json({
    // Valores que Next.js reemplazó en build-time
    env_vars: {
      NEXT_PUBLIC_ADMOB_APP_ID: process.env.NEXT_PUBLIC_ADMOB_APP_ID || 'NO_DEFINIDA',
      NEXT_PUBLIC_ADMOB_REWARDED_ID: process.env.NEXT_PUBLIC_ADMOB_REWARDED_ID || 'NO_DEFINIDA',
      NEXT_PUBLIC_ADMOB_BANNER_ID: process.env.NEXT_PUBLIC_ADMOB_BANNER_ID || 'NO_DEFINIDA',
      NEXT_PUBLIC_ADMOB_TEST_DEVICES: process.env.NEXT_PUBLIC_ADMOB_TEST_DEVICES || 'NO_DEFINIDA',
      NODE_ENV: process.env.NODE_ENV || 'NO_DEFINIDA',
    },
    // IDs hardcoded de producción
    production_ids: {
      APP: 'ca-app-pub-1352045169606160~5443732431',
      REWARDED: 'ca-app-pub-1352045169606160/7908962294',
      BANNER: 'ca-app-pub-1352045169606160/7029983134',
    },
    // Resultado de resolveAdId (lo que realmente se usa)
    resolved: {
      APP_ID: resolveCheck(process.env.NEXT_PUBLIC_ADMOB_APP_ID, 'ca-app-pub-1352045169606160~5443732431'),
      REWARDED: resolveCheck(process.env.NEXT_PUBLIC_ADMOB_REWARDED_ID, 'ca-app-pub-1352045169606160/7908962294'),
      BANNER: resolveCheck(process.env.NEXT_PUBLIC_ADMOB_BANNER_ID, 'ca-app-pub-1352045169606160/7029983134'),
    },
    isTesting: false,
    timestamp: new Date().toISOString(),
  });
}

function resolveCheck(envId, productionId) {
  const prefix = 'ca-app-pub-3940256099942544';
  if (envId && envId.length > 10 && !envId.includes('XXXX') && !envId.startsWith(prefix)) {
    return { source: 'env_var', value: envId };
  }
  return { source: 'hardcoded_production', value: productionId, envWas: envId || 'undefined' };
}
