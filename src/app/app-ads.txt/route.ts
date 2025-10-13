/**
 * API Route para servir app-ads.txt
 * Este archivo es requerido por Google AdMob para autorizar la venta de inventario publicitario
 */

import { NextResponse } from 'next/server';

export function GET() {
  const publisherId = 'pub-1352045169606160';
  
  const appAdsTxt = `# app-ads.txt para Bisonte Logística
# Este archivo autoriza a Google AdMob a vender inventario publicitario en esta app
# Más info: https://iabtechlab.com/ads-txt/

# Google AdMob
google.com, ${publisherId}, DIRECT, f08c47fec0942fa0
`;

  return new NextResponse(appAdsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400', // Cache por 24 horas
    },
  });
}
