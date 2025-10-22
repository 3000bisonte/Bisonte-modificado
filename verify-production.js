// 🚀 SCRIPT DE VERIFICACIÓN PARA PRODUCCIÓN
// Verifica que toda la configuración esté lista para deploy en bisonteapp.com

const fs = require('fs');
const path = require('path');

console.log('🚀 VERIFICACIÓN DE PRODUCCIÓN - BISONTE APP');
console.log('=' .repeat(60));

let allChecksPass = true;
let warningCount = 0;

function checkPassed(message) {
  console.log(`✅ ${message}`);
}

function checkFailed(message) {
  console.log(`❌ ${message}`);
  allChecksPass = false;
}

function checkWarning(message) {
  console.log(`⚠️  ${message}`);
  warningCount++;
}

// Leer archivo .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  checkFailed('Archivo .env.local no encontrado');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

// Parsear variables de entorno
envContent.split('\n').forEach(line => {
  const cleanLine = line.trim();
  if (cleanLine && !cleanLine.startsWith('#')) {
    const [key, ...valueParts] = cleanLine.split('=');
    if (key && valueParts.length) {
      envVars[key] = valueParts.join('=').replace(/^['"]|['"]$/g, '');
    }
  }
});

console.log('\n📋 VERIFICANDO CONFIGURACIÓN BÁSICA...\n');

// 1. Verificar NODE_ENV
if (envVars.NODE_ENV === 'production') {
  checkPassed('NODE_ENV configurado para producción');
} else {
  checkFailed(`NODE_ENV debe ser 'production', encontrado: '${envVars.NODE_ENV}'`);
}

// 2. Verificar RUNTIME_ENV
if (envVars.RUNTIME_ENV === 'production') {
  checkPassed('RUNTIME_ENV configurado para producción');
} else {
  checkFailed(`RUNTIME_ENV debe ser 'production', encontrado: '${envVars.RUNTIME_ENV}'`);
}

console.log('\n💳 VERIFICANDO MERCADOPAGO...\n');

// 3. Verificar MercadoPago
if (envVars.MP_ENVIRONMENT === 'production') {
  checkPassed('MercadoPago configurado para producción');
} else {
  checkFailed(`MP_ENVIRONMENT debe ser 'production', encontrado: '${envVars.MP_ENVIRONMENT}'`);
}

// 4. Verificar credenciales de producción MercadoPago
if (envVars.NEXT_PUBLIC_INIT_MERCADOPAGO && envVars.NEXT_PUBLIC_INIT_MERCADOPAGO.startsWith('APP_USR-')) {
  checkPassed('Clave pública de MercadoPago para producción detectada');
} else {
  checkFailed('NEXT_PUBLIC_INIT_MERCADOPAGO debe usar clave de producción (APP_USR-)');
}

if (envVars.MP_ACCESS_TOKEN_PROD && envVars.MP_ACCESS_TOKEN_PROD.startsWith('APP_USR-')) {
  checkPassed('Token de acceso de MercadoPago para producción detectado');
} else {
  checkFailed('MP_ACCESS_TOKEN_PROD debe estar configurado (APP_USR-)');
}

console.log('\n🌐 VERIFICANDO URLs Y DOMINIO...\n');

// 5. Verificar URLs principales
const urlChecks = [
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_API_BASE_URL',
  'NEXT_PUBLIC_API_SERVER_URL',
  'NEXT_PUBLIC_URL_BRICK_STATUS_SCREEN',
  'NEXT_PUBLIC_API_URL',
  'FALLBACK_API_BASE_URL',
  'BASE_URL'
];

urlChecks.forEach(urlVar => {
  const url = envVars[urlVar];
  if (url && url.includes('bisonteapp.com')) {
    checkPassed(`${urlVar} configurado para producción`);
  } else {
    checkFailed(`${urlVar} debe apuntar a bisonteapp.com, encontrado: '${url}'`);
  }
});

// 6. Verificar CORS
if (envVars.ALLOWED_ORIGINS && envVars.ALLOWED_ORIGINS.includes('bisonteapp.com')) {
  checkPassed('ALLOWED_ORIGINS incluye el dominio de producción');
} else {
  checkFailed('ALLOWED_ORIGINS debe incluir bisonteapp.com');
}

console.log('\n🔐 VERIFICANDO AUTENTICACIÓN...\n');

// 7. Verificar Google OAuth
if (envVars.GOOGLE_CLIENT_ID && envVars.GOOGLE_CLIENT_SECRET) {
  checkPassed('Credenciales de Google OAuth configuradas');
  checkWarning('Recuerda agregar https://bisonteapp.com/api/auth/callback/google en Google Cloud Console');
} else {
  checkFailed('GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET deben estar configurados');
}

// 8. Verificar NextAuth
if (envVars.NEXTAUTH_SECRET && envVars.NEXTAUTH_SECRET !== 'replace_with_long_random_string') {
  checkPassed('NEXTAUTH_SECRET configurado con valor personalizado');
} else {
  checkFailed('NEXTAUTH_SECRET debe tener un valor seguro y único');
}

console.log('\n📧 VERIFICANDO EMAIL Y COMUNICACIONES...\n');

// 9. Verificar Resend
if (envVars.RESEND_API_KEY && envVars.RESEND_API_KEY.startsWith('re_')) {
  checkPassed('API Key de Resend configurada');
} else {
  checkWarning('RESEND_API_KEY debería estar configurada para emails');
}

if (envVars.EMAIL_FROM && envVars.EMAIL_FROM.includes('bisonteapp.com')) {
  checkPassed('EMAIL_FROM configurado con dominio de producción');
} else {
  checkWarning('EMAIL_FROM debería usar el dominio bisonteapp.com');
}

console.log('\n🗄️ VERIFICANDO BASE DE DATOS...\n');

// 10. Verificar base de datos
if (envVars.DATABASE_URL && envVars.DATABASE_URL.startsWith('postgresql://')) {
  checkPassed('DATABASE_URL configurada (PostgreSQL)');
} else {
  checkFailed('DATABASE_URL debe estar configurada');
}

console.log('\n📱 VERIFICANDO ADMOB...\n');

// 11. Verificar AdMob (opcional pero recomendado)
const admobVars = [
  'NEXT_PUBLIC_ADMOB_APP_ID',
  'NEXT_PUBLIC_ADMOB_REWARDED_ID',
  'NEXT_PUBLIC_ADMOB_BANNER_ID'
];

let admobConfigured = true;
admobVars.forEach(admobVar => {
  if (!envVars[admobVar] || envVars[admobVar] === '') {
    admobConfigured = false;
  }
});

if (admobConfigured) {
  checkPassed('Configuración de AdMob completa');
} else {
  checkWarning('Configuración de AdMob incompleta (opcional)');
}

console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN DE VERIFICACIÓN');
console.log('='.repeat(60));

if (allChecksPass && warningCount === 0) {
  console.log('🎉 ¡PERFECTO! Toda la configuración está lista para producción');
  console.log('');
  console.log('🚀 PRÓXIMOS PASOS:');
  console.log('   1. Sube el código a tu repositorio');
  console.log('   2. Despliega en tu plataforma (Vercel, Railway, etc.)');
  console.log('   3. Configura el dominio bisonteapp.com');
  console.log('   4. ¡Listo para producción!');
} else if (allChecksPass && warningCount > 0) {
  console.log(`✅ Configuración básica lista (${warningCount} advertencias)`);
  console.log('');
  console.log('⚠️  Revisa las advertencias arriba, pero puedes proceder con el deploy');
  console.log('');
  console.log('🚀 PRÓXIMOS PASOS:');
  console.log('   1. Opcionalmente resuelve las advertencias');
  console.log('   2. Sube el código a tu repositorio');
  console.log('   3. Despliega en tu plataforma');
  console.log('   4. Configura el dominio bisonteapp.com');
} else {
  console.log('❌ HAY ERRORES QUE DEBEN CORREGIRSE ANTES DEL DEPLOY');
  console.log('');
  console.log('🔧 ACCIONES REQUERIDAS:');
  console.log('   1. Corrige todos los errores marcados con ❌');
  console.log('   2. Ejecuta este script nuevamente');
  console.log('   3. Una vez que pase, procede con el deploy');
}

console.log('');
console.log('📚 DOCUMENTACIÓN ADICIONAL:');
console.log('   • MercadoPago: Credenciales deben ser de PRODUCCIÓN');
console.log('   • Google OAuth: Agrega redirect URI en Google Cloud Console');
console.log('   • Dominio: bisonteapp.com debe apuntar a tu hosting');

process.exit(allChecksPass ? 0 : 1);