#!/usr/bin/env node

import { performance } from 'node:perf_hooks';

/**
 * 🔧 PRUEBAS RÁPIDAS DE APIs DE SOPORTE - BISONTE LOGÍSTICA
 *
 * Verifica un conjunto secundario de endpoints útiles para monitoreo, soporte y diagnóstico.
 */

let baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

const supportApis = [
  { name: 'Admin Dashboard', endpoint: '/api/admin', method: 'GET' },
  { name: 'Clients List', endpoint: '/api/clients', method: 'GET' },
  { name: 'Contacto (Mensajes)', endpoint: '/api/contacto', method: 'GET' },
  { name: 'Configuración', endpoint: '/api/config', method: 'GET' },
  { name: 'Debug Diagnóstico', endpoint: '/api/debug', method: 'GET' },
  { name: 'Guardar Envío (status)', endpoint: '/api/guardarenvio', method: 'GET' },
  { name: 'Test Google Auth', endpoint: '/api/test-google-auth', method: 'GET' },
  { name: 'Admin Stats', endpoint: '/api/admin/stats', method: 'GET' }
];

const stats = {
  total: 0,
  success: 0,
  failed: 0,
  warnings: 0,
  errors: []
};

function logResult(icon, message) {
  console.log(`  ${icon} ${message}`);
}

async function resolveServer() {
  const candidates = [
    baseUrl,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      const response = await fetch(`${candidate}/api/health`, { method: 'GET', signal: AbortSignal.timeout(4000) });
      if (response.ok) {
        baseUrl = candidate;
        console.log(`✅ Servidor detectado en ${baseUrl}`);
        return true;
      }
    } catch (error) {
      // Intentaremos con el siguiente candidato
    }
  }

  console.log('❌ No se pudo contactar al servidor en ninguno de los puertos habituales (3000/3001).');
  console.log('   Asegúrate de ejecutar "npm run dev" antes de correr este script.');
  return false;
}

async function testApi(api) {
  console.log(`
🔎 Probando ${api.name} (${api.method} ${api.endpoint})`);
  stats.total++;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const start = performance.now();
  const response = await fetch(`${baseUrl}${api.endpoint}`, {
      method: api.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Bisonte-Support-API-Test/1.0'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    const duration = Math.round(performance.now() - start);

    if (response.ok) {
      logResult('✅', `${api.name}: ${response.status} (${duration}ms)`);
      stats.success++;
      return;
    }

    if ([401, 403].includes(response.status)) {
      logResult('🔐', `${api.name}: ${response.status} - requiere autenticación (${duration}ms)`);
      stats.success++;
      stats.warnings++;
      return;
    }

    if (response.status === 404) {
      logResult('⚠️', `${api.name}: 404 - endpoint no disponible (${duration}ms)`);
      stats.failed++;
      stats.errors.push(`${api.name}: 404`);
      return;
    }

    logResult('❌', `${api.name}: ${response.status} ${response.statusText} (${duration}ms)`);
    stats.failed++;
    stats.errors.push(`${api.name}: ${response.status} ${response.statusText}`);
  } catch (error) {
    if (error.name === 'AbortError') {
      logResult('⏱️', `${api.name}: Timeout (>6s)`);
      stats.failed++;
      stats.errors.push(`${api.name}: Timeout`);
    } else {
      logResult('💥', `${api.name}: ${error.message}`);
      stats.failed++;
      stats.errors.push(`${api.name}: ${error.message}`);
    }
  }
}

(async function run() {
  console.log('🔧 VERIFICACIÓN DE APIs DE SOPORTE\n');
  if (!(await resolveServer())) {
    process.exit(1);
  }

  for (const api of supportApis) {
    await testApi(api);
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 RESULTADOS FINALES');
  console.log('='.repeat(50));
  console.log(`Total: ${stats.total}`);
  console.log(`✅ Éxitos: ${stats.success}`);
  console.log(`❌ Fallos: ${stats.failed}`);
  if (stats.warnings > 0) {
    console.log(`⚠️ Advertencias (auth esperada): ${stats.warnings}`);
  }

  if (stats.errors.length > 0) {
    console.log('\nErrores detectados:');
    for (const error of stats.errors) {
      console.log(`  • ${error}`);
    }
  }

  const successRate = stats.total ? (stats.success / stats.total) * 100 : 0;
  console.log(`\nTasa de éxito: ${successRate.toFixed(1)}%`);

  if (stats.failed === 0) {
    console.log('\n🎉 Todas las APIs de soporte respondieron correctamente.');
    process.exit(0);
  } else {
    console.log('\n⚠️ Revisa las APIs con fallos listadas arriba.');
    process.exit(1);
  }
})();
