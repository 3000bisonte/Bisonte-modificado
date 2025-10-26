#!/usr/bin/env node
/**
 * Script de verificación completa de configuración de AdMob
 * Verifica que todos los archivos y configuraciones estén correctos
 */

const fs = require('fs');
const path = require('path');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}═══ ${msg} ═══${colors.reset}\n`),
};

const rootDir = path.join(__dirname, '..');
let hasErrors = false;
let hasWarnings = false;

// IDs esperados (producción)
const EXPECTED_IDS = {
  APP: 'ca-app-pub-1352045169606160~5443732431',
  REWARDED: 'ca-app-pub-1352045169606160/7908962294',
  BANNER: 'ca-app-pub-1352045169606160/7029983134',
};

// IDs de prueba de Google (no deben usarse en producción)
const TEST_IDS = {
  APP: 'ca-app-pub-3940256099942544~3347511713',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
};

log.section('Verificación de Configuración de AdMob');

// 1. Verificar package.json
log.info('Verificando package.json...');
const packageJsonPath = path.join(rootDir, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  
  if (packageJson.dependencies && packageJson.dependencies['@capacitor-community/admob']) {
    const version = packageJson.dependencies['@capacitor-community/admob'];
    log.success(`Plugin @capacitor-community/admob instalado (${version})`);
  } else {
    log.error('Plugin @capacitor-community/admob NO encontrado en dependencies');
    hasErrors = true;
  }
} else {
  log.error('package.json no encontrado');
  hasErrors = true;
}

// 2. Verificar .env.production
log.info('Verificando .env.production...');
const envProdPath = path.join(rootDir, '.env.production');
if (fs.existsSync(envProdPath)) {
  const envContent = fs.readFileSync(envProdPath, 'utf-8');
  
  const checkEnvVar = (varName, expectedValue) => {
    const regex = new RegExp(`${varName}=(.+)`, 'i');
    const match = envContent.match(regex);
    
    if (match) {
      const value = match[1].trim();
      if (value === expectedValue) {
        log.success(`${varName} configurado correctamente`);
      } else if (value === TEST_IDS[varName.replace('NEXT_PUBLIC_ADMOB_', '').replace('_ID', '')]) {
        log.warning(`${varName} está usando ID de PRUEBA (debería ser ID real en producción)`);
        hasWarnings = true;
      } else if (value) {
        log.warning(`${varName} tiene valor diferente al esperado: ${value}`);
        hasWarnings = true;
      } else {
        log.error(`${varName} está vacío`);
        hasErrors = true;
      }
    } else {
      log.error(`${varName} no encontrado en .env.production`);
      hasErrors = true;
    }
  };
  
  checkEnvVar('NEXT_PUBLIC_ADMOB_APP_ID', EXPECTED_IDS.APP);
  checkEnvVar('NEXT_PUBLIC_ADMOB_REWARDED_ID', EXPECTED_IDS.REWARDED);
  checkEnvVar('NEXT_PUBLIC_ADMOB_BANNER_ID', EXPECTED_IDS.BANNER);
} else {
  log.error('.env.production no encontrado');
  hasErrors = true;
}

// 3. Verificar AndroidManifest.xml
log.info('Verificando AndroidManifest.xml...');
const manifestPath = path.join(rootDir, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
  const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
  
  if (manifestContent.includes('com.google.android.gms.ads.APPLICATION_ID')) {
    log.success('Meta-data de AdMob encontrado en AndroidManifest');
    
    if (manifestContent.includes('@string/admob_app_id')) {
      log.success('Referencia a admob_app_id en strings.xml configurada');
    } else {
      log.error('admob_app_id no referenciado correctamente');
      hasErrors = true;
    }
  } else {
    log.error('Meta-data de AdMob NO encontrado en AndroidManifest');
    hasErrors = true;
  }
} else {
  log.warning('AndroidManifest.xml no encontrado (normal si no has hecho build nativo aún)');
}

// 4. Verificar strings.xml
log.info('Verificando strings.xml...');
const stringsPath = path.join(rootDir, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml');
if (fs.existsSync(stringsPath)) {
  const stringsContent = fs.readFileSync(stringsPath, 'utf-8');
  
  const admobIdMatch = stringsContent.match(/<string name="admob_app_id">(.+)<\/string>/);
  if (admobIdMatch) {
    const admobId = admobIdMatch[1];
    
    if (admobId === EXPECTED_IDS.APP) {
      log.success(`admob_app_id configurado con ID REAL de producción`);
    } else if (admobId === TEST_IDS.APP) {
      log.error(`admob_app_id está usando ID de PRUEBA (${TEST_IDS.APP})`);
      log.error(`Debe cambiarse a: ${EXPECTED_IDS.APP}`);
      hasErrors = true;
    } else {
      log.warning(`admob_app_id tiene valor inesperado: ${admobId}`);
      hasWarnings = true;
    }
  } else {
    log.error('admob_app_id no encontrado en strings.xml');
    hasErrors = true;
  }
} else {
  log.warning('strings.xml no encontrado (normal si no has hecho build nativo aún)');
}

// 5. Verificar capacitor.build.gradle
log.info('Verificando capacitor.build.gradle...');
const capacitorBuildPath = path.join(rootDir, 'android', 'app', 'capacitor.build.gradle');
if (fs.existsSync(capacitorBuildPath)) {
  const buildContent = fs.readFileSync(capacitorBuildPath, 'utf-8');
  
  if (buildContent.includes('capacitor-community-admob')) {
    log.success('Plugin capacitor-community-admob incluido en build.gradle');
  } else {
    log.error('Plugin capacitor-community-admob NO incluido en build.gradle');
    hasErrors = true;
  }
} else {
  log.warning('capacitor.build.gradle no encontrado (se genera con capacitor sync)');
}

// 6. Verificar archivos de servicio
log.info('Verificando archivos de servicio...');
const servicePath = path.join(rootDir, 'src', 'services', 'AdMobService.js');
if (fs.existsSync(servicePath)) {
  log.success('AdMobService.js encontrado');
  
  const serviceContent = fs.readFileSync(servicePath, 'utf-8');
  if (serviceContent.includes('getDebugState')) {
    log.success('Método getDebugState() implementado');
  } else {
    log.warning('Método getDebugState() no encontrado (considerar agregar para debugging)');
    hasWarnings = true;
  }
  
  if (serviceContent.includes('forceReloadAd')) {
    log.success('Método forceReloadAd() implementado');
  } else {
    log.warning('Método forceReloadAd() no encontrado (considerar agregar para debugging)');
    hasWarnings = true;
  }
} else {
  log.error('AdMobService.js no encontrado');
  hasErrors = true;
}

// 7. Verificar configuración de AdMob
log.info('Verificando admob.config.js...');
const configPath = path.join(rootDir, 'src', 'config', 'admob.config.js');
if (fs.existsSync(configPath)) {
  log.success('admob.config.js encontrado');
  
  const configContent = fs.readFileSync(configPath, 'utf-8');
  
  // Verificar que tenga los IDs correctos
  Object.entries(EXPECTED_IDS).forEach(([key, value]) => {
    if (configContent.includes(value)) {
      log.success(`ID ${key} encontrado en configuración`);
    } else {
      log.warning(`ID ${key} (${value}) no encontrado en configuración`);
      hasWarnings = true;
    }
  });
} else {
  log.error('admob.config.js no encontrado');
  hasErrors = true;
}

// Resumen final
log.section('Resumen de Verificación');

if (hasErrors) {
  log.error('Se encontraron errores críticos que deben corregirse');
  log.info('\n📋 Pasos sugeridos:');
  log.info('1. Corregir los errores marcados arriba');
  log.info('2. Ejecutar: npm run build');
  log.info('3. Ejecutar: npx cap sync');
  log.info('4. Rebuild de la app nativa');
  process.exit(1);
} else if (hasWarnings) {
  log.warning('Verificación completada con advertencias');
  log.info('\n📋 Recomendaciones:');
  log.info('1. Revisar las advertencias marcadas');
  log.info('2. Si es ambiente de producción, usar IDs reales');
  log.info('3. Si es desarrollo, los IDs de prueba están bien');
  process.exit(0);
} else {
  log.success('¡Verificación completada exitosamente! ✨');
  log.info('\n✅ Todo está configurado correctamente');
  log.info('📱 Puedes proceder a hacer build de la app nativa');
  log.info('\n📋 Próximos pasos:');
  log.info('1. npm run build');
  log.info('2. npx cap sync');
  log.info('3. npx cap run android (o ios)');
  process.exit(0);
}
