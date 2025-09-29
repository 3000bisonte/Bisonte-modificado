#!/usr/bin/env node

import { performance } from 'node:perf_hooks';

/**
 * 🧪 VERIFICACIÓN DE FLUJOS FORMULARIO Y RECUPERACIÓN - BISONTE LOGÍSTICA
 *
 * Cubre endpoints con validaciones dinámicas, formularios simulados y rutas protegidas
 * que requieren cargas útiles específicas. Diseñado para complementar los scripts
 * anteriores y acercarnos a la cobertura completa de las 40+ APIs.
 */

let baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

const now = Date.now();

const testCases = [
  {
    name: 'Solicitud de recuperación de contraseña',
    method: 'POST',
    endpoint: '/api/recuperar',
    body: {
      email: 'qa-recuperacion@bisonte.test'
    },
    okStatuses: [200],
    validate: ({ json }) => {
      if (!json?.success) {
        return { ok: false, message: json?.error || 'Respuesta inesperada' };
      }

      const delivery = json?.emailDelivery;
      const deliveryNote = delivery
        ? `Email: ${delivery.sent ? 'enviado' : `omitido (${delivery.reason || 'motivo desconocido'})`}`
        : 'Email: oculto';

      return { ok: true, message: `${json.message || 'Código emitido'} → ${deliveryNote}` };
    }
  },
  {
    name: 'Validación de token (rechazo esperado)',
    method: 'POST',
    endpoint: '/api/recuperar/validar-token',
    body: {
      email: 'qa-recuperacion@bisonte.test',
      code: '000000',
      newPassword: 'Password123!'
    },
    okStatuses: [],
    warningStatuses: [400],
    validate: ({ json }) => {
      if (json?.error) {
        return { ok: true, warn: true, message: json.error };
      }
      return { ok: false, message: 'Respuesta inesperada' };
    }
  },
  {
    name: 'Historial de envíos por email',
    method: 'GET',
    endpoint: '/api/envios/historial?email=qa-recuperacion@bisonte.test',
    okStatuses: [200],
    validate: ({ json }) => {
      if (Array.isArray(json)) {
        return { ok: true, message: `Resultados: ${json.length}` };
      }
      return { ok: false, message: 'Respuesta no es un arreglo' };
    }
  },
  {
    name: 'Guardar envío (simulación)',
    method: 'POST',
    endpoint: '/api/guardarenvio',
    body: {
      remitente: {
        nombre: 'QA Remitente',
        ciudad: 'Bogotá',
        celular: '3001234567',
        direccion: 'Calle 123 #45-67',
        documento: '12345678',
        email: 'qa.remitente@bisonte.test'
      },
      destinatario: {
        nombre: 'QA Destinatario',
        ciudad: 'Medellín',
        telefono: '3017654321',
        direccion: 'Carrera 45 #12-34',
        documento: '87654321',
        email: 'qa.destinatario@bisonte.test'
      },
      detalles: {
        descripcion: 'Paquete de prueba automatizada',
        peso: 1.8,
        valor: 150000
      }
    },
    okStatuses: [201],
    validate: ({ json }) => {
      if (json?.success && json?.envio?.numeroGuia) {
        return { ok: true, message: `Guía generada ${json.envio.numeroGuia}` };
      }
      return { ok: false, message: json?.error || 'Sin guía generada' };
    }
  },
  {
    name: 'Enviar mensaje de contacto',
    method: 'POST',
    endpoint: '/api/contacto',
    body: {
      nombre: 'QA Contacto',
      mensaje: 'Mensaje de prueba automatizado',
      celular: '3500000000',
      ciudad: 'Bogotá',
      correo: 'qa.contacto@bisonte.test'
    },
    okStatuses: [200],
    validate: ({ json }) => {
      if (json?.success) {
        return { ok: true, message: json.mensaje || 'Mensaje guardado' };
      }
      return { ok: false, message: json?.error || 'No se confirmó el guardado' };
    }
  },
  {
    name: 'Consultar detalle de contacto',
    method: 'GET',
    endpoint: '/api/contacto/12345',
    okStatuses: [200],
    validate: ({ json }) => {
      if (json?.success && json?.mensaje) {
        return { ok: true, message: `Mensaje ID ${json.mensaje.id}` };
      }
      return { ok: false, message: 'No se devolvió el mensaje simulado' };
    }
  },
  {
    name: 'Actualizar perfil (simulación)',
    method: 'POST',
    endpoint: '/api/perfil',
    body: {
      nombre: 'Usuario QA',
      nombrePerfil: 'Perfil QA',
      celular: '3123456789',
      correo: 'perfil.qa@bisonte.test',
      ciudad: 'Cali',
      direccionRecogida: 'Calle 10 #20-30',
      detalleDireccion: 'Interior 202',
      recomendaciones: 'Ninguna',
      tipoDocumento: 'CC',
      numeroDocumento: '11223344'
    },
    okStatuses: [200],
    validate: ({ json }) => {
      if (json?.success && json?.perfil?.id) {
        return { ok: true, message: `Perfil simulado ${json.perfil.id}` };
      }
      return { ok: false, message: json?.error || 'Perfil no retornado' };
    }
  },
  {
    name: 'Consultar remitente por ID',
    method: 'GET',
    endpoint: '/api/remitente?id=42',
    okStatuses: [200],
    validate: ({ json }) => {
      if (json?.success && json?.remitente) {
        return { ok: true, message: `Remitente ${json.remitente.id}` };
      }
      return { ok: false, message: 'Respuesta sin remitente' };
    }
  },
  {
    name: 'Crear remitente',
    method: 'POST',
    endpoint: '/api/remitente',
    body: {
      nombre: 'Remitente Automatizado',
      ciudad: 'Bogotá',
      celular: '3112223344',
      direccion: 'Av Siempre Viva 742',
      documento: '99887766',
      email: 'remitente.auto@bisonte.test'
    },
    okStatuses: [201],
    validate: ({ json }) => {
      if (json?.success && json?.remitente?.id) {
        return { ok: true, message: `ID simulado ${json.remitente.id}` };
      }
      return { ok: false, message: json?.error || 'Remitente no confirmado' };
    }
  },
  {
    name: 'Listar destinatarios',
    method: 'GET',
    endpoint: '/api/destinatario',
    okStatuses: [200],
    validate: ({ json }) => {
      if (json?.success && Array.isArray(json.destinatarios)) {
        return { ok: true, message: `Total ${json.destinatarios.length}` };
      }
      return { ok: false, message: 'Sin array de destinatarios' };
    }
  },
  {
    name: 'Crear destinatario',
    method: 'POST',
    endpoint: '/api/destinatario',
    body: {
      nombre: 'Destinatario Automatizado',
      ciudad: 'Medellín',
      telefono: '3055556677',
      direccion: 'Transversal 25 #6-66',
      documento: '44556677',
      email: 'destinatario.auto@bisonte.test'
    },
    okStatuses: [201],
    validate: ({ json }) => {
      if (json?.success && json?.destinatario?.id) {
        return { ok: true, message: `ID simulado ${json.destinatario.id}` };
      }
      return { ok: false, message: json?.error || 'Destinatario no confirmado' };
    }
  },
  {
    name: 'Verificar sesión sin autenticación',
    method: 'POST',
    endpoint: '/api/auth/verify-session',
    body: {
      sessionId: '999999',
      lastActivity: now - 5 * 60 * 1000
    },
    okStatuses: [],
    warningStatuses: [401, 423],
    validate: ({ json }) => {
      if (json?.code) {
        return { ok: true, warn: true, message: json.code };
      }
      return { ok: false, message: 'Respuesta inesperada' };
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
      // Intentaremos con el siguiente candidato
    }
  }

  console.log('❌ No se pudo contactar al servidor en ninguno de los puertos habituales (3000/3001).');
  console.log('   Asegúrate de ejecutar "npm run dev" antes de correr este script.');
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
        'User-Agent': 'Bisonte-Form-Flow-Test/1.0'
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
      // Algunos endpoints pueden no retornar JSON
    }

    let category = 'fail';
    let message = `${response.status} ${response.statusText || ''}`.trim();

    if (test.okStatuses?.includes(response.status)) {
      category = 'ok';
    } else if (test.warningStatuses?.includes(response.status)) {
      category = 'warn';
    }

    if (test.validate && json !== null) {
      try {
        const result = await test.validate({ response, json });
        if (result) {
          if (result.ok === false) {
            category = result.warn ? 'warn' : 'fail';
          } else if (result.ok === true && category === 'fail') {
            category = result.warn ? 'warn' : 'ok';
          }
          if (result.message) {
            message += ` → ${result.message}`;
          }
        }
      } catch (validationError) {
        category = 'fail';
        message += ` → Error de validación: ${validationError.message}`;
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
  console.log('🧪 INICIO PRUEBAS DE FORMULARIOS Y RECUPERACIÓN');
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
    console.log('\n🎉 Flujos verificados sin errores críticos.');
    process.exit(0);
  } else {
    console.log('\n⚠️ Revisa las APIs con fallos listadas arriba.');
    process.exit(1);
  }
})();
