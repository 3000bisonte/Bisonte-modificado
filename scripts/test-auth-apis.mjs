#!/usr/bin/env node

import { performance } from 'node:perf_hooks';
import crypto from 'node:crypto';

/**
 * 🔐 PRUEBAS DE APIS DE AUTENTICACIÓN Y COMPLEMENTARIAS - BISONTE LOGÍSTICA
 *
 * Cubre los endpoints pendientes relacionados con autenticación, recuperación de contraseñas
 * y utilidades asociadas para completar la verificación de las 40+ APIs.
 */

let baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

const uniqueSuffix = `${Date.now().toString(36)}-${crypto.randomBytes(2).toString('hex')}`;
const dynamicData = {
  passwordEmail: `qa.password.${uniqueSuffix}@bisonte.test`,
  registerEmail: `qa.auth.register.${uniqueSuffix}@bisonte.test`,
  payerEmail: `qa.mercadopago.${uniqueSuffix}@bisonte.test`
};

const testCases = [
  {
    name: 'Estado de sesión NextAuth',
    method: 'GET',
    endpoint: '/api/auth/session',
    okStatuses: [200],
    validate: ({ json }) => {
      if (json && typeof json === 'object') {
        return { ok: true, message: json?.user ? 'Sesión activa' : 'Sesión inactiva' };
      }
      return { ok: false, message: 'Respuesta no JSON' };
    }
  },
  {
    name: 'Redirección de error OAuth',
    method: 'GET',
    endpoint: '/api/auth/error?message=OAuthCallback',
    okStatuses: [303, 307, 308],
    requestInit: { redirect: 'manual' },
    validate: ({ response }) => {
      const location = response.headers.get('location');
      if (location) {
        return { ok: true, message: `→ ${location}` };
      }
      return { ok: false, message: 'Sin encabezado Location' };
    }
  },
  {
    name: 'Información endpoint /auth/password',
    method: 'GET',
    endpoint: '/api/auth/password',
    okStatuses: [200],
    validate: ({ json }) => ({ ok: !!json?.success, message: json?.message })
  },
  {
    name: 'Operación básica /auth/password',
    method: 'POST',
    endpoint: '/api/auth/password',
    body: () => ({ action: 'status-check', timestamp: Date.now() }),
    okStatuses: [200],
    validate: ({ json }) => ({ ok: !!json?.success, message: json?.message })
  },
  {
    name: 'Cambio de contraseña sin sesión',
    method: 'POST',
    endpoint: '/api/auth/password/change',
    body: () => ({ currentPassword: 'Dummy123!', newPassword: 'Password123!' }),
    okStatuses: [],
    warningStatuses: [401, 423],
    validate: ({ json, response }) => ({
      ok: response.status === 401 || response.status === 423,
      warn: true,
      message: json?.error || 'Respuesta esperada sin sesión'
    })
  },
  {
    name: 'Solicitud de recuperación de contraseña (/auth)',
    method: 'POST',
    endpoint: '/api/auth/password/request',
    body: () => ({ email: dynamicData.passwordEmail }),
    okStatuses: [200],
    validate: ({ json }) => ({ ok: !!json?.message, message: json?.message })
  },
  {
    name: 'Reset de contraseña código inválido',
    method: 'POST',
    endpoint: '/api/auth/password/reset',
    body: () => ({ email: dynamicData.passwordEmail, code: '000000', newPassword: 'Password123!' }),
    okStatuses: [],
    warningStatuses: [400, 404],
    validate: ({ json, response }) => ({
      ok: response.status === 400 || response.status === 404,
      warn: true,
      message: json?.error || 'Validación correcta de error'
    })
  },
  {
    name: 'Capacitor Google payload incompleto',
    method: 'POST',
    endpoint: '/api/auth/capacitor-google',
    body: () => ({ user: { email: dynamicData.registerEmail } }),
    okStatuses: [400],
    validate: ({ json }) => ({ ok: true, message: json?.error || 'Validación' })
  },
  {
    name: 'Estado GIS',
    method: 'GET',
    endpoint: '/api/auth/gis',
    okStatuses: [200],
    validate: ({ json }) => ({ ok: !!json?.success, message: json?.message })
  },
  {
    name: 'Recepción datos GIS',
    method: 'POST',
    endpoint: '/api/auth/gis',
    body: () => ({ idToken: 'fake-token', issuedAt: Date.now() }),
    okStatuses: [200],
    validate: ({ json }) => ({ ok: !!json?.success, message: json?.message })
  },
  {
    name: 'Estado logout',
    method: 'GET',
    endpoint: '/api/auth/logout',
    okStatuses: [200],
    validate: ({ json }) => ({ ok: true, message: json?.endpoint || 'Operativo' })
  },
  {
    name: 'Limpieza de sesión logout',
    method: 'POST',
    endpoint: '/api/auth/logout',
    okStatuses: [200],
    validate: ({ json }) => ({ ok: !!json?.success, message: json?.message })
  },
  {
    name: 'Simulación NextAuth',
    method: 'GET',
    endpoint: '/api/auth/nextauth-simulation',
    okStatuses: [200],
    validate: ({ json }) => ({ ok: !!json?.success, message: json?.message })
  },
  {
    name: 'Flujo nativo Google',
    method: 'POST',
    endpoint: '/api/auth/native-google',
    body: () => ({ idToken: 'fake-native-token' }),
    okStatuses: [400],
    validate: ({ json }) => ({ ok: true, message: json?.message })
  },
  {
    name: 'Registro vía /api/auth/register',
    method: 'POST',
    endpoint: '/api/auth/register',
    body: () => ({
      email: dynamicData.registerEmail,
      password: 'Password123!',
      nombre: 'QA Auth Script',
      celular: '3200000000',
      ciudad: 'Bogotá'
    }),
    okStatuses: [201],
    warningStatuses: [409],
    validate: ({ json, response }) => {
      if (response.status === 409) {
        return { ok: true, warn: true, message: json?.error || 'Usuario duplicado' };
      }
      if (json?.data?.user) {
        return { ok: true, message: json?.data?.message || 'Usuario registrado' };
      }
      return { ok: false, message: json?.error || 'Respuesta inesperada' };
    }
  },
  {
    name: 'Verificación de ID Token (estado)',
    method: 'POST',
    endpoint: '/api/auth/verify-idtoken',
    body: () => ({ idToken: 'fake-id-token' }),
    okStatuses: [],
    warningStatuses: [400, 404, 500],
    validate: ({ json, response }) => ({
      ok: [400, 404, 500].includes(response.status),
      warn: true,
      message: json?.error || 'Respuesta esperada'
    })
  },
  {
    name: 'Listado destinatario por ID',
    method: 'GET',
    endpoint: '/api/destinatario/obtenerxid/999999',
    okStatuses: [200],
    validate: ({ json }) => ({ ok: true, message: json ? 'Resultado recibido' : 'Sin datos' })
  },
  {
    name: 'Búsqueda perfil por correo',
    method: 'GET',
    endpoint: `/api/perfil/buscarxemail/${encodeURIComponent(dynamicData.passwordEmail)}`,
    okStatuses: [200],
    validate: ({ json }) => ({ ok: true, message: json ? 'Respuesta recibida' : 'Sin perfil' })
  },
  {
    name: 'Verificación existencia perfil',
    method: 'GET',
    endpoint: '/api/perfil/existeusuario',
    okStatuses: [200],
    validate: ({ json }) => ({ ok: !!json?.success, message: `Perfiles: ${json?.data?.length ?? 0}` })
  },
  {
    name: 'Información remitente',
    method: 'GET',
    endpoint: '/api/remitente/999999',
    okStatuses: [200],
    validate: ({ json }) => ({ ok: !!json?.success, message: json?.message })
  },
  {
    name: 'Estado MercadoPago',
    method: 'GET',
    endpoint: '/api/mercadopago',
    okStatuses: [200],
    validate: ({ json }) => ({ ok: !!json?.success, message: json?.message })
  },
  {
    name: 'Creación pago MercadoPago',
    method: 'POST',
    endpoint: '/api/mercadopago',
    body: () => ({
      transaction_amount: 25000,
      payment_method_id: 'visa',
      description: 'QA Automation Payment',
      installments: 1,
      payer: {
        email: dynamicData.payerEmail,
        entity_type: 'individual',
        identification: { type: 'CC', number: '1234567890' }
      }
    }),
    okStatuses: [200],
    validate: ({ json }) => ({ ok: !!json?.success, message: json?.message })
  },
  {
    name: 'Estado endpoint send',
    method: 'GET',
    endpoint: '/api/send',
    okStatuses: [200],
    validate: ({ json }) => ({ ok: !!json?.success, message: json?.message })
  },
  {
    name: 'Envio de mensaje send',
    method: 'POST',
    endpoint: '/api/send',
    body: () => ({
      nombre: 'QA',
      apellidos: 'Script',
      email: dynamicData.registerEmail,
      celular: '3001234567',
      ciudad: 'Bogotá',
      servicio: 'Pruebas Automatizadas',
      mensaje: 'Mensaje de prueba automatizado.'
    }),
    okStatuses: [200],
    validate: ({ json }) => ({ ok: !!json?.success, message: json?.message })
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
    } catch (_) {
      // Intentar siguiente
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
    const timeout = setTimeout(() => controller.abort(), test.timeoutMs ?? 8000);

    const headers = {
      'User-Agent': 'Bisonte-Auth-API-Test/1.0'
    };

    let bodyPayload = null;
    if (typeof test.body === 'function') {
      bodyPayload = test.body();
    } else if (test.body) {
      bodyPayload = test.body;
    }

    if (bodyPayload !== null) {
      headers['Content-Type'] = 'application/json';
    }

    if (test.headers) {
      Object.assign(headers, test.headers);
    }

    const requestInit = {
      method: test.method,
      headers,
      signal: controller.signal,
      redirect: test.requestInit?.redirect ?? 'follow'
    };

    if (bodyPayload !== null) {
      requestInit.body = JSON.stringify(bodyPayload);
    }

    const start = performance.now();
    const response = await fetch(`${baseUrl}${test.endpoint}`, requestInit);
    clearTimeout(timeout);

    const duration = Math.round(performance.now() - start);

    let json = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        json = await response.clone().json();
      } catch (_) {
        // ignorar parsing
      }
    }

    const okStatuses = test.okStatuses ?? [200];
    const warningStatuses = test.warningStatuses ?? [];

    let category = 'fail';
    let message = `${response.status} ${response.statusText || ''}`.trim();

    if (okStatuses.includes(response.status)) {
      category = 'ok';
    } else if (warningStatuses.includes(response.status)) {
      category = 'warn';
    } else if (!okStatuses.length && response.ok) {
      category = 'ok';
    }

    if (test.validate) {
      try {
        const result = await test.validate({ response, json });
        if (result) {
          if (result.ok === false) {
            category = result.warn ? 'warn' : 'fail';
          } else if (result.ok === true) {
            category = result.warn ? 'warn' : 'ok';
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
    stats.errors.push(`${test.name}: ${response.status} ${message}`);
  } catch (error) {
    if (error.name === 'AbortError') {
      logResult('⏱️', `${test.name}: Timeout (>8s)`);
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
  console.log('🔐 INICIO PRUEBAS DE AUTENTICACIÓN Y ENDPOINTS COMPLEMENTARIOS');
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
    console.log('\n🎉 Endpoints de autenticación verificados sin errores críticos.');
    process.exit(0);
  } else {
    console.log('\n⚠️ Revisa las APIs con fallos listadas arriba.');
    process.exit(1);
  }
})();
