#!/usr/bin/env node
/**
 * Script de Testing Completo para Producción
 * Valida todos los componentes críticos de la app
 */

const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores
const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const log = {
  info: (msg) => console.log(`${c.blue}ℹ${c.reset} ${msg}`),
  success: (msg) => console.log(`${c.green}✓${c.reset} ${msg}`),
  error: (msg) => console.log(`${c.red}✗${c.reset} ${msg}`),
  warning: (msg) => console.log(`${c.yellow}⚠${c.reset} ${msg}`),
  title: (msg) => console.log(`\n${c.bold}${c.cyan}${msg}${c.reset}\n`),
};

// Configuración
const PRODUCTION_URL = 'https://www.bisonteapp.com';
const TESTS = [];
let passed = 0;
let failed = 0;

// Helper para hacer requests HTTPS
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
  });
}

// Helper para agregar tests
function addTest(name, fn) {
  TESTS.push({ name, fn });
}

// ========================================
// TESTS
// ========================================

// Test 1: Verificar que el sitio esté accesible
addTest('Sitio web accesible', async () => {
  try {
    const res = await httpsGet(PRODUCTION_URL);
    if (res.status === 200) {
      log.success(`Sitio responde con status 200`);
      return true;
    } else {
      log.error(`Sitio responde con status ${res.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Error al acceder al sitio: ${error.message}`);
    return false;
  }
});

// Test 2: Verificar API de health
addTest('API Health Check', async () => {
  try {
    const res = await httpsGet(`${PRODUCTION_URL}/api/health`);
    if (res.status === 200) {
      const data = JSON.parse(res.data);
      if (data.status === 'ok') {
        log.success(`API Health: OK (db: ${data.database || 'unknown'})`);
        return true;
      }
    }
    log.error(`API Health falló: ${res.status}`);
    return false;
  } catch (error) {
    log.error(`Error en API Health: ${error.message}`);
    return false;
  }
});

// Test 3: Verificar API de tarifas
addTest('API Tarifas', async () => {
  try {
    const res = await httpsGet(`${PRODUCTION_URL}/api/tarifas`);
    if (res.status === 200) {
      const data = JSON.parse(res.data);
      if (data.tarifas && Object.keys(data.tarifas).length > 0) {
        log.success(`API Tarifas funciona (${Object.keys(data.tarifas).length} tarifas)`);
        return true;
      }
    }
    log.error(`API Tarifas falló: ${res.status}`);
    return false;
  } catch (error) {
    log.error(`Error en API Tarifas: ${error.message}`);
    return false;
  }
});

// Test 4: Verificar configuración de AdMob
addTest('Configuración AdMob', async () => {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
      log.error('.env.local no encontrado');
      return false;
    }

    const content = fs.readFileSync(envPath, 'utf8');
    const hasAppId = /NEXT_PUBLIC_ADMOB_APP_ID=ca-app-pub-1352045169606160/.test(content);
    const hasRewardedId = /NEXT_PUBLIC_ADMOB_REWARDED_ID=ca-app-pub-1352045169606160/.test(content);
    const hasBannerId = /NEXT_PUBLIC_ADMOB_BANNER_ID=ca-app-pub-1352045169606160/.test(content);

    if (hasAppId && hasRewardedId && hasBannerId) {
      log.success('AdMob configurado con IDs reales');
      return true;
    } else {
      log.error('AdMob no está configurado correctamente');
      if (!hasAppId) log.warning('  - Falta NEXT_PUBLIC_ADMOB_APP_ID');
      if (!hasRewardedId) log.warning('  - Falta NEXT_PUBLIC_ADMOB_REWARDED_ID');
      if (!hasBannerId) log.warning('  - Falta NEXT_PUBLIC_ADMOB_BANNER_ID');
      return false;
    }
  } catch (error) {
    log.error(`Error verificando AdMob: ${error.message}`);
    return false;
  }
});

// Test 5: Verificar configuración de Mercado Pago
addTest('Configuración Mercado Pago', async () => {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    const content = fs.readFileSync(envPath, 'utf8');
    
    const hasAccessToken = /MP_ACCESS_TOKEN=APP-/.test(content) || /MP_ACCESS_TOKEN=TEST-/.test(content);
    const hasPublicKey = /MP_PUBLIC_KEY=APP_/.test(content) || /MP_PUBLIC_KEY=TEST-/.test(content);
    
    if (hasAccessToken && hasPublicKey) {
      log.success('Mercado Pago configurado');
      return true;
    } else {
      log.warning('Mercado Pago no configurado (opcional para testing)');
      return true; // No crítico para este test
    }
  } catch (error) {
    log.warning(`No se pudo verificar Mercado Pago: ${error.message}`);
    return true; // No crítico
  }
});

// Test 6: Verificar conexión a base de datos
addTest('Conexión a Base de Datos', async () => {
  try {
    const res = await httpsGet(`${PRODUCTION_URL}/api/dbcheck`);
    if (res.status === 200) {
      const data = JSON.parse(res.data);
      if (data.status === 'ok' || data.connected) {
        log.success(`Base de datos conectada`);
        return true;
      }
    }
    log.error(`Conexión a BD falló: ${res.status}`);
    return false;
  } catch (error) {
    log.error(`Error verificando BD: ${error.message}`);
    return false;
  }
});

// Test 7: Verificar autenticación (NextAuth)
addTest('NextAuth Configurado', async () => {
  try {
    const res = await httpsGet(`${PRODUCTION_URL}/api/auth/providers`);
    if (res.status === 200) {
      const data = JSON.parse(res.data);
      if (data.credentials || data.google) {
        log.success('NextAuth configurado con providers');
        return true;
      }
    }
    log.error(`NextAuth no responde correctamente`);
    return false;
  } catch (error) {
    log.error(`Error verificando NextAuth: ${error.message}`);
    return false;
  }
});

// Test 8: Verificar build de Android
addTest('Build de Android', async () => {
  try {
    const buildGradlePath = path.join(process.cwd(), 'android', 'app', 'build.gradle');
    if (!fs.existsSync(buildGradlePath)) {
      log.error('build.gradle no encontrado');
      return false;
    }

    const content = fs.readFileSync(buildGradlePath, 'utf8');
    const hasVersionCode = /versionCode\s+\d+/.test(content);
    const hasVersionName = /versionName\s+"[\d.]+/.test(content);
    const hasSigningConfig = /signingConfig signingConfigs\.release/.test(content);

    if (hasVersionCode && hasVersionName && hasSigningConfig) {
      log.success('Build de Android configurado correctamente');
      return true;
    } else {
      log.error('Build de Android tiene problemas de configuración');
      return false;
    }
  } catch (error) {
    log.error(`Error verificando build Android: ${error.message}`);
    return false;
  }
});

// Test 9: Verificar capacitor.config.json
addTest('Capacitor Config', async () => {
  try {
    const capacitorConfigPath = path.join(process.cwd(), 'capacitor.config.json');
    if (!fs.existsSync(capacitorConfigPath)) {
      log.error('capacitor.config.json no encontrado');
      return false;
    }

    const config = JSON.parse(fs.readFileSync(capacitorConfigPath, 'utf8'));
    
    if (config.server?.url === PRODUCTION_URL) {
      log.success(`Capacitor apunta a producción: ${PRODUCTION_URL}`);
      return true;
    } else {
      log.warning(`Capacitor apunta a: ${config.server?.url || 'no configurado'}`);
      return false;
    }
  } catch (error) {
    log.error(`Error verificando Capacitor: ${error.message}`);
    return false;
  }
});

// Test 10: Verificar archivos críticos
addTest('Archivos Críticos', async () => {
  const criticalFiles = [
    'package.json',
    'next.config.js',
    'capacitor.config.json',
    'android/app/build.gradle',
    'android/app/google-services.json',
    'src/lib/prisma.ts',
    'src/services/AdMobService.js',
    'src/config/admob.config.js',
  ];

  let allExist = true;
  for (const file of criticalFiles) {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
      log.error(`Archivo crítico faltante: ${file}`);
      allExist = false;
    }
  }

  if (allExist) {
    log.success('Todos los archivos críticos presentes');
    return true;
  }
  return false;
});

// ========================================
// EJECUTAR TESTS
// ========================================

async function runTests() {
  console.log(`${c.bold}${c.cyan}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('        TEST DE PRODUCCIÓN - BISONTE APP');
  console.log('═══════════════════════════════════════════════════════');
  console.log(c.reset);
  console.log(`Probando: ${PRODUCTION_URL}\n`);

  for (const test of TESTS) {
    log.title(`🧪 ${test.name}`);
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      log.error(`Test falló con error: ${error.message}`);
      failed++;
    }
  }

  // Resumen
  log.title('📊 RESUMEN DE TESTS');
  console.log(`Total: ${TESTS.length} tests`);
  console.log(`${c.green}Pasaron: ${passed}${c.reset}`);
  console.log(`${c.red}Fallaron: ${failed}${c.reset}`);
  console.log(`Porcentaje: ${Math.round((passed / TESTS.length) * 100)}%\n`);

  if (failed === 0) {
    log.title('🎉 ¡TODOS LOS TESTS PASARON!');
    console.log(`${c.green}Tu app está lista para producción${c.reset}\n`);
  } else if (passed >= TESTS.length * 0.8) {
    log.title('✅ La mayoría de tests pasaron');
    console.log('Revisa los errores arriba y corrígelos\n');
  } else {
    log.title('❌ MUCHOS TESTS FALLARON');
    console.log(`${c.red}Corrige los errores antes de continuar${c.reset}\n`);
  }

  // Próximos pasos
  if (failed > 0) {
    log.title('📝 PRÓXIMOS PASOS');
    console.log('1. Corrige los errores listados arriba');
    console.log('2. Vuelve a ejecutar este script: node scripts/test-production.js');
    console.log('3. Cuando todos los tests pasen, continúa con:');
    console.log('   → node scripts/test-admob-config.js (verificar AdMob)');
    console.log('   → npm run build (crear build de producción)');
    console.log('   → cd android && ./gradlew assembleRelease (compilar APK)');
    console.log('');
  } else {
    log.title('🚀 TODO LISTO');
    console.log('Siguiente paso: Verificar AdMob');
    console.log(`${c.cyan}node scripts/test-admob-config.js${c.reset}\n`);
  }

  process.exit(failed === 0 ? 0 : 1);
}

runTests().catch((error) => {
  console.error('Error ejecutando tests:', error);
  process.exit(1);
});
