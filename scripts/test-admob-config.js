#!/usr/bin/env node
/**
 * Script para verificar configuración de AdMob en producción
 * Valida que los IDs sean reales y no de prueba
 */

const fs = require('fs');
const path = require('path');

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}\n`),
};

// IDs de prueba de Google (NO generan ingresos)
const GOOGLE_TEST_IDS = {
  APP: 'ca-app-pub-3940256099942544~3347511713',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
};

// IDs reales esperados (de tu cuenta AdMob)
const REAL_IDS = {
  APP: 'ca-app-pub-1352045169606160~5443732431',
  REWARDED: 'ca-app-pub-1352045169606160/7908962294',
  BANNER: 'ca-app-pub-1352045169606160/7029983134',
};

function readEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    log.error('No se encontró el archivo .env.local');
    return null;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};

  content.split('\n').forEach((line) => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      env[key] = value;
    }
  });

  return env;
}

function validateAdMobConfig(env) {
  log.title('🎯 VERIFICACIÓN DE CONFIGURACIÓN ADMOB');

  const appId = env.NEXT_PUBLIC_ADMOB_APP_ID || '';
  const rewardedId = env.NEXT_PUBLIC_ADMOB_REWARDED_ID || '';
  const bannerId = env.NEXT_PUBLIC_ADMOB_BANNER_ID || '';
  const nodeEnv = env.NODE_ENV || 'development';

  let errors = 0;
  let warnings = 0;

  // 1. Verificar que los IDs no estén vacíos
  log.info('1. Verificando que los IDs estén configurados...');
  if (!appId) {
    log.error('  NEXT_PUBLIC_ADMOB_APP_ID está vacío');
    errors++;
  } else {
    log.success(`  App ID: ${appId}`);
  }

  if (!rewardedId) {
    log.error('  NEXT_PUBLIC_ADMOB_REWARDED_ID está vacío');
    errors++;
  } else {
    log.success(`  Rewarded ID: ${rewardedId}`);
  }

  if (!bannerId) {
    log.error('  NEXT_PUBLIC_ADMOB_BANNER_ID está vacío');
    errors++;
  } else {
    log.success(`  Banner ID: ${bannerId}`);
  }

  // 2. Verificar que NO sean IDs de prueba
  log.info('\n2. Verificando que NO sean IDs de prueba...');
  if (appId === GOOGLE_TEST_IDS.APP) {
    log.error('  ❌ App ID es de PRUEBA - NO generará ingresos');
    log.warning(`     Cambia a: ${REAL_IDS.APP}`);
    errors++;
  } else if (appId === REAL_IDS.APP) {
    log.success('  ✓ App ID es REAL - generará ingresos');
  } else {
    log.warning(`  ⚠ App ID no reconocido: ${appId}`);
    warnings++;
  }

  if (rewardedId === GOOGLE_TEST_IDS.REWARDED) {
    log.error('  ❌ Rewarded ID es de PRUEBA - NO generará ingresos');
    log.warning(`     Cambia a: ${REAL_IDS.REWARDED}`);
    errors++;
  } else if (rewardedId === REAL_IDS.REWARDED) {
    log.success('  ✓ Rewarded ID es REAL - generará ingresos');
  } else {
    log.warning(`  ⚠ Rewarded ID no reconocido: ${rewardedId}`);
    warnings++;
  }

  if (bannerId === GOOGLE_TEST_IDS.BANNER) {
    log.error('  ❌ Banner ID es de PRUEBA - NO generará ingresos');
    log.warning(`     Cambia a: ${REAL_IDS.BANNER}`);
    errors++;
  } else if (bannerId === REAL_IDS.BANNER) {
    log.success('  ✓ Banner ID es REAL - generará ingresos');
  } else {
    log.warning(`  ⚠ Banner ID no reconocido: ${bannerId}`);
    warnings++;
  }

  // 3. Verificar formato de IDs
  log.info('\n3. Verificando formato de IDs...');
  const appIdPattern = /^ca-app-pub-\d+~\d+$/;
  const adUnitPattern = /^ca-app-pub-\d+\/\d+$/;

  if (!appIdPattern.test(appId)) {
    log.error('  App ID tiene formato inválido');
    errors++;
  } else {
    log.success('  Formato de App ID correcto');
  }

  if (!adUnitPattern.test(rewardedId)) {
    log.error('  Rewarded ID tiene formato inválido');
    errors++;
  } else {
    log.success('  Formato de Rewarded ID correcto');
  }

  if (!adUnitPattern.test(bannerId)) {
    log.error('  Banner ID tiene formato inválido');
    errors++;
  } else {
    log.success('  Formato de Banner ID correcto');
  }

  // 4. Verificar que el mismo publisher ID esté en todos
  log.info('\n4. Verificando consistencia de Publisher ID...');
  const extractPublisherId = (id) => {
    const match = id.match(/ca-app-pub-(\d+)/);
    return match ? match[1] : null;
  };

  const appPubId = extractPublisherId(appId);
  const rewardedPubId = extractPublisherId(rewardedId);
  const bannerPubId = extractPublisherId(bannerId);

  if (appPubId && rewardedPubId && bannerPubId) {
    if (appPubId === rewardedPubId && rewardedPubId === bannerPubId) {
      log.success(`  Todos los IDs usan el mismo Publisher: ${appPubId}`);
    } else {
      log.error('  Los IDs tienen diferentes Publisher IDs');
      log.error(`    App: ${appPubId}`);
      log.error(`    Rewarded: ${rewardedPubId}`);
      log.error(`    Banner: ${bannerPubId}`);
      errors++;
    }
  }

  // 5. Verificar NODE_ENV
  log.info('\n5. Verificando entorno...');
  log.info(`  NODE_ENV: ${nodeEnv}`);
  if (nodeEnv === 'production') {
    log.success('  Configurado para PRODUCCIÓN');
  } else {
    log.warning('  NO está en modo producción - los anuncios pueden ser de prueba');
    warnings++;
  }

  // Resumen
  log.title('📊 RESUMEN');
  console.log(`Errores: ${colors.red}${errors}${colors.reset}`);
  console.log(`Advertencias: ${colors.yellow}${warnings}${colors.reset}`);

  if (errors === 0 && warnings === 0) {
    log.title('🎉 ¡CONFIGURACIÓN PERFECTA!');
    console.log(`${colors.green}Tu app está lista para generar ingresos con AdMob${colors.reset}\n`);
    return true;
  } else if (errors === 0) {
    log.title('✅ Configuración válida con advertencias menores');
    console.log('Revisa las advertencias arriba\n');
    return true;
  } else {
    log.title('❌ SE ENCONTRARON ERRORES');
    console.log(`${colors.red}Corrige los errores arriba antes de continuar${colors.reset}\n`);
    return false;
  }
}

function checkVercelConfig() {
  log.title('🌐 VERIFICAR EN VERCEL');
  console.log('Para asegurarte de que los anuncios generen ingresos en producción:');
  console.log('');
  console.log('1. Ve a: https://vercel.com/3000bisonte/bisonte-app/settings/environment-variables');
  console.log('2. Verifica que estas variables tengan los IDs REALES:');
  console.log(`   ${colors.cyan}NEXT_PUBLIC_ADMOB_APP_ID${colors.reset}=${REAL_IDS.APP}`);
  console.log(`   ${colors.cyan}NEXT_PUBLIC_ADMOB_REWARDED_ID${colors.reset}=${REAL_IDS.REWARDED}`);
  console.log(`   ${colors.cyan}NEXT_PUBLIC_ADMOB_BANNER_ID${colors.reset}=${REAL_IDS.BANNER}`);
  console.log(`   ${colors.cyan}NODE_ENV${colors.reset}=production`);
  console.log('');
  console.log('3. Si están diferentes, actualízalas y redeploy la app');
  console.log('');
}

function showNextSteps() {
  log.title('📝 PRÓXIMOS PASOS');
  console.log('1. Verifica tu cuenta AdMob:');
  console.log('   → https://apps.admob.com/');
  console.log('');
  console.log('2. Configura método de pago:');
  console.log('   → https://apps.admob.com/#payments');
  console.log('');
  console.log('3. Revisa reportes de ingresos:');
  console.log('   → https://apps.admob.com/#reports');
  console.log('');
  console.log('4. Prueba los anuncios en la app:');
  console.log('   → Abre la app en Android');
  console.log('   → Ve a la pantalla de Resumen de Envío');
  console.log('   → Toca el botón "Ver anuncio para obtener descuento"');
  console.log('');
  console.log(`${colors.yellow}⚠ IMPORTANTE:${colors.reset} NO hagas click en tus propios anuncios frecuentemente`);
  console.log('   → Usa Test Device IDs para probar sin afectar estadísticas');
  console.log('');
}

// Ejecutar
function main() {
  console.log(`${colors.bold}${colors.cyan}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('     TEST DE CONFIGURACIÓN ADMOB - BISONTE APP');
  console.log('═══════════════════════════════════════════════════════');
  console.log(colors.reset);

  const env = readEnvFile();
  if (!env) {
    process.exit(1);
  }

  const isValid = validateAdMobConfig(env);
  checkVercelConfig();
  
  if (isValid) {
    showNextSteps();
  }

  process.exit(isValid ? 0 : 1);
}

main();
