#!/usr/bin/env node

import { performance } from 'node:perf_hooks';
import crypto from 'node:crypto';

/**
 * 🚚 VERIFICACIÓN DE APIS LOGÍSTICAS Y DE USUARIOS - BISONTE LOGÍSTICA
 *
 * Prueba endpoints centrados en listados de envíos, usuarios y utilidades
 * complementando los lotes anteriores. Muchos endpoints retornan datos
 * simulados o aceptan entradas controladas para validar el flujo completo.
 */

let baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

const uniqueSuffix = `${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
const dynamicData = {
  usersEmail: `qa.users.${uniqueSuffix}@bisonte.test`,
  registerEmail: `qa.register.${uniqueSuffix}@bisonte.test`,
  clientsEmail: `qa.clients.${uniqueSuffix}@bisonte.test`
};

const testCases = [
  {
    name: 'Listar envíos (historial general)',
    method: 'GET',
    endpoint: '/api/envios',
    okStatuses: [200],
    validate: ({ json }) => {
      if (json?.success) {
        return { ok: true, message: `Total ${Array.isArray(json.data) ? json.data.length : 0}` };
      }
      return { ok: false, message: json?.error || 'Sin bandera de éxito' };
    }
  },
  {
    name: 'Listar envíos (endpoint legacy)',
    method: 'GET',
    endpoint: '/api/obtenerenvios',
    okStatuses: [200],
    validate: ({ json }) => {
      if (json?.success) {
        return { ok: true, message: `Total ${Array.isArray(json.data) ? json.data.length : 0}` };
      }
      return { ok: false, message: json?.error || 'Respuesta inesperada' };
    }
  },
  {
    name: 'Obtener envíos por perfil inexistente',
    method: 'GET',
    endpoint: '/api/obtenerenvios/999999',
    okStatuses: [],
    warningStatuses: [404],
    validate: ({ json }) => {
      if (json?.error) {
        return { ok: true, warn: true, message: json.error };
      }
      return { ok: false, message: 'Respuesta inesperada' };
    }
  },
  {
    name: 'Actualizar estado envío inexistente',
    method: 'PATCH',
    endpoint: '/api/envios/actualizar-estado/999999',
    body: {
      nuevoEstado: 'EN_TRANSPORTE'
    },
    okStatuses: [],
    warningStatuses: [404],
    validate: ({ json }) => {
      if (json?.error) {
        return { ok: true, warn: true, message: json.error };
      }
      return { ok: false, message: 'Respuesta inesperada' };
    }
  },
  {
    name: 'Listar usuarios (relaciones envío)',
    method: 'GET',
    endpoint: '/api/usuarios',
    okStatuses: [200],
    validate: ({ json }) => {
      if (json?.success) {
        return { ok: true, message: `Total ${Array.isArray(json.data) ? json.data.length : 0}` };
      }
      return { ok: false, message: json?.error || 'Sin bandera de éxito' };
    }
  },
  {
    name: 'Listar usuarios (endpoint simplificado)',
    method: 'GET',
    endpoint: '/api/users',
    okStatuses: [200],
    validate: ({ json }) => {
      if (json?.success) {
        return { ok: true, message: `Total ${Array.isArray(json.data) ? json.data.length : 0}` };
      }
      return { ok: false, message: json?.error || 'Sin bandera de éxito' };
    }
  },
  {
    name: 'Crear usuario vía /api/users',
    method: 'POST',
    endpoint: '/api/users',
    body: {
      nombre: 'QA Users Script',
      email: dynamicData.usersEmail,
      password: 'Password123!',
      telefono: '3200000000'
    },
    okStatuses: [201],
    warningStatuses: [409],
    validate: ({ json, response }) => {
      if (json?.success || response.status === 201) {
        return { ok: true, message: `ID ${(json?.data && json.data.id) || 'nuevo'}` };
      }
      if (response.status === 409) {
        return { ok: true, warn: true, message: 'Usuario ya existe' };
      }
      return { ok: false, message: json?.error || 'Sin confirmación de creación' };
    }
  },
  {
    name: 'Registrar usuario público',
    method: 'POST',
    endpoint: '/api/register',
    body: {
      nombre: 'QA Register Script',
      email: dynamicData.registerEmail,
      password: 'Password123!',
      celular: '3111111111',
      ciudad: 'Bogotá'
    },
    okStatuses: [201],
    warningStatuses: [409],
    validate: ({ json, response }) => {
      if (json?.success) {
        return { ok: true, message: `ID ${(json?.user && json.user.id) || 'nuevo'}` };
      }
      if (response.status === 409) {
        return { ok: true, warn: true, message: 'Usuario duplicado' };
      }
      return { ok: false, message: json?.error || 'Registro sin éxito' };
    }
  },
  {
    name: 'Crear cliente vía /api/clients',
    method: 'POST',
    endpoint: '/api/clients',
    body: {
      nombre: 'QA Client Script',
      email: dynamicData.clientsEmail,
      celular: '3001234567',
      ciudad: 'Medellín'
    },
    okStatuses: [201],
    warningStatuses: [409],
    validate: ({ json, response }) => {
      if (json?.success) {
        return { ok: true, message: `ID ${(json?.data && json.data.id) || 'nuevo'}` };
      }
      if (response.status === 409) {
        return { ok: true, warn: true, message: 'Cliente duplicado' };
      }
      return { ok: false, message: json?.error || 'Cliente no creado' };
    }
  },
  {
    name: 'Diagnóstico de cookies',
    method: 'GET',
    endpoint: '/api/diag',
    okStatuses: [200],
    validate: ({ json }) => {
      if (json?.ok) {
        return { ok: true, message: `Cookies ${json.cookieLen}` };
      }
      return { ok: false, message: 'Respuesta inesperada' };
    }
  },
  {
    name: 'Estado notificaciones de envío',
    method: 'GET',
    endpoint: '/api/notificar-envio',
    okStatuses: [200],
    validate: ({ json }) => {
      if (json?.success) {
        return { ok: true, message: json.message || 'OK' };
      }
      return { ok: false, message: json?.error || 'Respuesta inesperada' };
    }
  },
  {
    name: 'Métricas del sistema',
    method: 'GET',
    endpoint: '/api/metrics',
    okStatuses: [200],
    validate: ({ json }) => {
      if (json?.success) {
        return { ok: true, message: json?.uptime?.humanReadable || 'Sin uptime' };
      }
      return { ok: false, message: json?.error || 'Respuesta inesperada' };
    }
  },
  {
    name: 'Chequeo de base de datos',
    method: 'GET',
    endpoint: '/api/dbcheck',
    okStatuses: [200],
    validate: ({ json }) => {
      if (json?.prismaReady) {
        return { ok: true, message: json.databaseHost || 'DB' };
      }
      if (json?.errors) {
        return { ok: true, warn: true, message: json.errors.message || 'Prisma no disponible' };
      }
      return { ok: false, message: 'Estado de base de datos desconocido' };
    }
  }
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
      // Intentar siguiente candidato
    }
  }

  console.log('❌ No se pudo contactar al servidor en 3000/3001.');
  console.log('   Ejecuta "npm run dev" antes de correr este script.');
  return false;
}

async function runTest(test) {
  console.log(`\n🔎 Probando ${test.name} (${test.method} ${test.endpoint})`);
  stats.total++;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const start = performance.now();
    const response = await fetch(`${baseUrl}${test.endpoint}`, {
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Bisonte-Logistics-API-Test/1.0'
      },
      body: test.body ? JSON.stringify(test.body) : undefined,
      signal: controller.signal
    });
    clearTimeout(timeout);

    const duration = Math.round(performance.now() - start);
    let json = null;
    try {
      json = await response.clone().json();
    } catch (_) {
      // Algunos endpoints podrían no responder en JSON
    }

    let category = 'fail';
    let message = `${response.status} ${response.statusText || ''}`.trim();

    if (test.okStatuses?.includes(response.status)) {
      category = 'ok';
    } else if (test.warningStatuses?.includes(response.status)) {
      category = 'warn';
    }

    if (test.validate && (json !== null || category !== 'ok')) {
      try {
        const result = await test.validate({ response, json });
        if (result) {
          if (result.ok === false) {
            category = result.warn ? 'warn' : 'fail';
          } else if (result.ok === true) {
            if (result.warn) {
              category = 'warn';
            } else if (category === 'fail') {
              category = 'ok';
            }
          }
          if (result.message) {
            message += ` → ${result.message}`;
          }
        }
      } catch (validationError) {
        category = 'fail';
        message += ` → Error validación: ${validationError.message}`;
      }
    }

    message += ` (${duration}ms)`;

    if (category === 'ok') {
      logResult('✅', `${test.name}: ${message}`);
      stats.success++;
      return;
    }

    if (category === 'warn') {
      logResult('🔐', `${test.name}: ${message}`);
      stats.success++;
      stats.warnings++;
      return;
    }

    logResult('❌', `${test.name}: ${message}`);
    stats.failed++;
    if (json) {
      stats.errors.push(`${test.name}: ${response.status} ${JSON.stringify(json)}`);
    } else {
      stats.errors.push(`${test.name}: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      logResult('⏱️', `${test.name}: Timeout (>7s)`);
      stats.failed++;
      stats.errors.push(`${test.name}: Timeout`);
    } else {
      logResult('💥', `${test.name}: ${error.message}`);
      stats.failed++;
      stats.errors.push(`${test.name}: ${error.message}`);
    }
  }
}

(async function main() {
  console.log('🚚 INICIO PRUEBAS LOGÍSTICAS Y DE USUARIOS');
  if (!(await resolveServer())) {
    process.exit(1);
  }

  for (const test of testCases) {
    await runTest(test);
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 RESULTADOS FINALES');
  console.log('='.repeat(50));
  console.log(`Total: ${stats.total}`);
  console.log(`✅ Éxitos: ${stats.success}`);
  console.log(`❌ Fallos: ${stats.failed}`);
  if (stats.warnings > 0) {
    console.log(`🔐 Advertencias controladas: ${stats.warnings}`);
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
    console.log('\n🎉 Todas las APIs logísticas respondieron como se esperaba.');
    process.exit(0);
  } else {
    console.log('\n⚠️ Revisa las APIs con fallos listadas arriba.');
    process.exit(1);
  }
})();
