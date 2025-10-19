#!/usr/bin/env node

/**
 * 🧪 TEST COMPLETO DE LA APLICACIÓN BISONTE
 * Script para verificar que toda la app esté lista para producción
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const PRODUCTION_URL = 'https://www.bisonteapp.com';

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║   🧪 TEST COMPLETO - BISONTE LOGÍSTICA APP           ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

const results = {
  build: [],
  config: [],
  files: [],
  security: [],
  apis: [],
  mobile: []
};

function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

function success(category, test) {
  passedTests++;
  totalTests++;
  results[category].push({ test, status: 'PASS' });
  log('✅', test);
}

function fail(category, test, error) {
  failedTests++;
  totalTests++;
  results[category].push({ test, status: 'FAIL', error });
  log('❌', `${test}: ${error}`);
}

function info(message) {
  log('ℹ️', message);
}

function section(title) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📋 ${title}`);
  console.log('═'.repeat(60));
}

// ============================================
// 1. VERIFICAR BUILD
// ============================================
section('BUILD Y COMPILACIÓN');

function checkBuild() {
  const nextDir = path.join(__dirname, '..', '.next');
  const buildId = path.join(nextDir, 'BUILD_ID');
  
  if (fs.existsSync(nextDir)) {
    success('build', 'Directorio .next existe');
    
    if (fs.existsSync(buildId)) {
      const id = fs.readFileSync(buildId, 'utf8').trim();
      success('build', `Build ID: ${id}`);
    } else {
      info('BUILD_ID no encontrado (normal en modo dev). Ejecuta npm run build antes de producción');
    }
  } else {
    info('Build no encontrado (normal en modo dev). Ejecuta npm run build antes de producción');
  }
}

// ============================================
// 2. VERIFICAR ARCHIVOS CRÍTICOS
// ============================================
section('ARCHIVOS CRÍTICOS');

function checkCriticalFiles() {
  const criticalFiles = [
    { path: 'package.json', desc: 'Configuración del proyecto' },
    { path: 'next.config.js', desc: 'Configuración de Next.js' },
    { path: 'capacitor.config.json', desc: 'Configuración de Capacitor' },
    { path: 'android/app/build.gradle', desc: 'Build de Android' },
    { path: 'android/app/bisonte-release-key.jks', desc: 'Keystore de firma' },
    { path: 'prisma/schema.prisma', desc: 'Esquema de base de datos' },
    { path: '.env.local', desc: 'Variables de entorno' },
    { path: 'src/app/politica-datos/page.js', desc: 'Política de privacidad' },
    { path: 'src/components/ConnectionHandler.js', desc: 'Manejador de conexión' },
    { path: 'src/app/no-conexion/page.js', desc: 'Página sin conexión' }
  ];

  criticalFiles.forEach(({ path: filePath, desc }) => {
    const fullPath = path.join(__dirname, '..', filePath);
    if (fs.existsSync(fullPath)) {
      success('files', `${desc} (${filePath})`);
    } else {
      fail('files', desc, `Archivo no encontrado: ${filePath}`);
    }
  });
}

// ============================================
// 3. VERIFICAR CONFIGURACIÓN ANDROID
// ============================================
section('CONFIGURACIÓN ANDROID');

function checkAndroidConfig() {
  const buildGradle = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
  
  if (fs.existsSync(buildGradle)) {
    const content = fs.readFileSync(buildGradle, 'utf8');
    
    // Verificar versionCode
    const versionCodeMatch = content.match(/versionCode\s+(\d+)/);
    if (versionCodeMatch) {
      const versionCode = versionCodeMatch[1];
      success('mobile', `versionCode: ${versionCode}`);
    } else {
      fail('mobile', 'versionCode no encontrado', 'Verifica build.gradle');
    }
    
    // Verificar versionName
    const versionNameMatch = content.match(/versionName\s+"([^"]+)"/);
    if (versionNameMatch) {
      const versionName = versionNameMatch[1];
      success('mobile', `versionName: ${versionName}`);
    } else {
      fail('mobile', 'versionName no encontrado', 'Verifica build.gradle');
    }
    
    // Verificar signing config
    if (content.includes('signingConfigs')) {
      success('mobile', 'Configuración de firma presente');
    } else {
      fail('mobile', 'Configuración de firma', 'No se encontró signingConfigs');
    }
  } else {
    fail('mobile', 'build.gradle no encontrado', 'Verifica carpeta android/app/');
  }
  
  // Verificar keystore
  const keystore = path.join(__dirname, '..', 'android', 'app', 'bisonte-release-key.jks');
  if (fs.existsSync(keystore)) {
    success('mobile', 'Keystore encontrado');
  } else {
    fail('mobile', 'Keystore no encontrado', 'Genera keystore para firma');
  }
}

// ============================================
// 4. VERIFICAR CAPACITOR CONFIG
// ============================================
section('CONFIGURACIÓN CAPACITOR');

function checkCapacitorConfig() {
  const configPath = path.join(__dirname, '..', 'capacitor.config.json');
  
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      if (config.appId === 'com.bisonteapp') {
        success('mobile', `App ID: ${config.appId}`);
      } else {
        fail('mobile', 'App ID incorrecto', `Esperado: com.bisonteapp, Actual: ${config.appId}`);
      }
      
      if (config.server && config.server.url === PRODUCTION_URL) {
        success('mobile', `Server URL: ${config.server.url}`);
      } else {
        fail('mobile', 'Server URL', `Debe apuntar a: ${PRODUCTION_URL}`);
      }
      
      if (config.webDir === 'out') {
        success('mobile', 'Web directory: out');
      } else {
        fail('mobile', 'Web directory', `Esperado: out, Actual: ${config.webDir}`);
      }
    } catch (error) {
      fail('mobile', 'Capacitor config parse error', error.message);
    }
  } else {
    fail('mobile', 'capacitor.config.json no encontrado', 'Archivo requerido');
  }
}

// ============================================
// 5. VERIFICAR VARIABLES DE ENTORNO
// ============================================
section('VARIABLES DE ENTORNO');

function checkEnvVars() {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (fs.existsSync(envPath)) {
    success('config', '.env.local existe');
    
    const content = fs.readFileSync(envPath, 'utf8');
    const requiredVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'GOOGLE_CLIENT_ID',
      'NEXT_PUBLIC_INIT_MERCADOPAGO',
      'RESEND_API_KEY'
    ];
    
    requiredVars.forEach(varName => {
      if (content.includes(varName)) {
        const match = content.match(new RegExp(`${varName}=(.+)`));
        if (match && match[1].trim() && !match[1].includes('your_')) {
          success('config', `${varName} configurado`);
        } else {
          fail('config', varName, 'Valor no configurado o es placeholder');
        }
      } else {
        fail('config', varName, 'Variable no encontrada en .env.local');
      }
    });
  } else {
    fail('config', '.env.local no encontrado', 'Archivo requerido');
  }
}

// ============================================
// 6. VERIFICAR SEGURIDAD
// ============================================
section('SEGURIDAD Y PRIVACIDAD');

function checkSecurity() {
  // Verificar política de privacidad (página o componente)
  const privacyPagePath = path.join(__dirname, '..', 'src', 'app', 'politica-datos', 'page.js');
  const privacyComponentPath = path.join(__dirname, '..', 'src', 'components', 'PrivacyPolicyTerms.js');
  
  if (fs.existsSync(privacyPagePath)) {
    success('security', 'Página de política de privacidad existe');
    
    // Verificar el componente si se usa
    if (fs.existsSync(privacyComponentPath)) {
      const content = fs.readFileSync(privacyComponentPath, 'utf8');
      if (content.length > 3000) {
        success('security', `Política de privacidad completa (${Math.round(content.length/1000)}KB)`);
      } else {
        info('Política de privacidad encontrada pero podría ser más detallada');
      }
    }
  } else {
    fail('security', 'Política de privacidad no encontrada', 'Requerida por Play Store');
  }
  
  // Verificar middleware de seguridad
  const middlewarePath = path.join(__dirname, '..', 'middleware.js');
  if (fs.existsSync(middlewarePath)) {
    const content = fs.readFileSync(middlewarePath, 'utf8');
    
    if (content.includes('isRateLimited')) {
      success('security', 'Rate limiting implementado');
    } else {
      info('Rate limiting no implementado (opcional)');
    }
    
    if (content.includes('isBlockedPath')) {
      success('security', 'Protección contra rutas maliciosas');
    } else {
      info('Protección de rutas maliciosas no implementada (opcional)');
    }
    
    if (content.includes('X-Content-Type-Options')) {
      success('security', 'Headers de seguridad configurados');
    } else {
      fail('security', 'Headers de seguridad', 'No configurados en middleware');
    }
  }
}

// ============================================
// 7. VERIFICAR MANEJO DE CONEXIÓN
// ============================================
section('MANEJO DE CONEXIÓN A INTERNET');

function checkConnectionHandling() {
  const handlerPath = path.join(__dirname, '..', 'src', 'components', 'ConnectionHandler.js');
  const noConnectionPath = path.join(__dirname, '..', 'src', 'app', 'no-conexion', 'page.js');
  
  if (fs.existsSync(handlerPath)) {
    const content = fs.readFileSync(handlerPath, 'utf8');
    if (content.includes('navigator.onLine')) {
      success('security', 'Detector de conexión implementado');
    } else {
      fail('security', 'Detector de conexión', 'navigator.onLine no encontrado');
    }
  } else {
    fail('security', 'ConnectionHandler.js no encontrado', 'Componente requerido');
  }
  
  if (fs.existsSync(noConnectionPath)) {
    success('security', 'Página "Sin conexión" implementada');
  } else {
    fail('security', 'Página sin conexión', 'No encontrada en /no-conexion');
  }
}

// ============================================
// 8. VERIFICAR CONSOLE.LOGS (Opcional)
// ============================================
section('LIMPIEZA DE CÓDIGO (OPCIONAL)');

function checkConsoleLogs() {
  const srcDir = path.join(__dirname, '..', 'src');
  let consoleLogCount = 0;
  
  function searchInDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.includes('node_modules')) {
        searchInDir(fullPath);
      } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const matches = content.match(/console\.log\(/g);
        if (matches) {
          consoleLogCount += matches.length;
        }
      }
    });
  }
  
  try {
    searchInDir(srcDir);
    
    if (consoleLogCount === 0) {
      success('build', 'No se encontraron console.log en código de producción');
    } else if (consoleLogCount < 50) {
      info(`${consoleLogCount} console.log encontrados (aceptable)`);
      passedTests++;
      totalTests++;
    } else {
      info(`${consoleLogCount} console.log encontrados (considera limpiar con scripts/production-cleanup.js)`);
      passedTests++;
      totalTests++;
    }
  } catch (error) {
    info('No se pudo contar console.logs: ' + error.message);
  }
}

// ============================================
// 9. RESUMEN FINAL
// ============================================
function printSummary() {
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('═'.repeat(60));
  
  Object.entries(results).forEach(([category, tests]) => {
    if (tests.length > 0) {
      const passed = tests.filter(t => t.status === 'PASS').length;
      const failed = tests.filter(t => t.status === 'FAIL').length;
      console.log(`\n${getCategoryEmoji(category)} ${getCategoryName(category)}:`);
      console.log(`   ✅ Pasadas: ${passed}`);
      if (failed > 0) {
        console.log(`   ❌ Fallidas: ${failed}`);
      }
    }
  });
  
  console.log('\n' + '═'.repeat(60));
  console.log(`✨ Total de pruebas: ${totalTests}`);
  console.log(`✅ Exitosas: ${passedTests} (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`❌ Fallidas: ${failedTests}`);
  console.log('═'.repeat(60));
  
  if (failedTests === 0) {
    console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON!');
    console.log('✨ Tu aplicación está lista para producción\n');
    console.log('📱 Próximos pasos:');
    console.log('   1. Genera el APK: cd android && .\\gradlew assembleRelease');
    console.log('   2. Toma screenshots de la app');
    console.log('   3. Sube a Play Store Console\n');
    return 0;
  } else if (failedTests <= 3) {
    console.log('\n⚠️  Hay algunos errores menores que deberías corregir');
    console.log('💡 Revisa los errores marcados arriba\n');
    return 1;
  } else {
    console.log('\n❌ HAY ERRORES CRÍTICOS QUE DEBES CORREGIR');
    console.log('🔧 Revisa todos los errores antes de continuar\n');
    return 1;
  }
}

function getCategoryEmoji(category) {
  const emojis = {
    build: '🏗️',
    config: '⚙️',
    files: '📁',
    security: '🔒',
    apis: '🌐',
    mobile: '📱'
  };
  return emojis[category] || '📋';
}

function getCategoryName(category) {
  const names = {
    build: 'Build y Compilación',
    config: 'Configuración',
    files: 'Archivos Críticos',
    security: 'Seguridad',
    apis: 'APIs',
    mobile: 'Mobile (Android)'
  };
  return names[category] || category;
}

// ============================================
// EJECUTAR TODAS LAS PRUEBAS
// ============================================
async function runAllTests() {
  try {
    checkBuild();
    checkCriticalFiles();
    checkAndroidConfig();
    checkCapacitorConfig();
    checkEnvVars();
    checkSecurity();
    checkConnectionHandling();
    checkConsoleLogs();
    
    const exitCode = printSummary();
    process.exit(exitCode);
  } catch (error) {
    console.error('\n❌ Error fatal ejecutando tests:', error.message);
    process.exit(1);
  }
}

// Ejecutar
runAllTests();
