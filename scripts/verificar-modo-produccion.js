#!/usr/bin/env node

/**
 * 🔍 VERIFICAR MODO PRODUCCIÓN - MERCADOPAGO
 * Script para confirmar que estés en modo producción
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║   🔍 VERIFICACIÓN DE MODO PRODUCCIÓN - MERCADOPAGO   ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

// Leer .env.local
const envPath = path.join(__dirname, '..', '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ No se encontró el archivo .env.local');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

// Extraer variables
const vars = {};
envLines.forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      vars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

console.log('📋 CONFIGURACIÓN ACTUAL:\n');

// 1. Verificar MP_ENVIRONMENT
console.log('1️⃣  Modo de Ambiente:');
const mpEnv = vars.MP_ENVIRONMENT || 'No configurado';
if (mpEnv === 'production') {
  console.log('   ✅ MP_ENVIRONMENT = production ✓');
} else if (mpEnv === 'test') {
  console.log('   ⚠️  MP_ENVIRONMENT = test (CAMBIAR A PRODUCCIÓN)');
  console.log('   💡 Cambia a: MP_ENVIRONMENT=production');
} else {
  console.log(`   ❌ MP_ENVIRONMENT = ${mpEnv} (VALOR INVÁLIDO)`);
}

// 2. Verificar Access Tokens
console.log('\n2️⃣  Access Tokens:');
const tokenTest = vars.MP_ACCESS_TOKEN_TEST;
const tokenProd = vars.MP_ACCESS_TOKEN_PROD;

if (tokenTest) {
  const preview = tokenTest.substring(0, 20) + '...';
  console.log(`   ✅ MP_ACCESS_TOKEN_TEST = ${preview}`);
  console.log(`      Tipo: ${tokenTest.startsWith('TEST-') ? 'TEST ✓' : 'INVÁLIDO ❌'}`);
} else {
  console.log('   ❌ MP_ACCESS_TOKEN_TEST = No configurado');
}

if (tokenProd) {
  const preview = tokenProd.substring(0, 20) + '...';
  console.log(`   ✅ MP_ACCESS_TOKEN_PROD = ${preview}`);
  console.log(`      Tipo: ${tokenProd.startsWith('APP_USR-') ? 'PRODUCCIÓN ✓' : 'INVÁLIDO ❌'}`);
} else {
  console.log('   ❌ MP_ACCESS_TOKEN_PROD = No configurado');
}

// 3. Verificar Public Key
console.log('\n3️⃣  Public Key (Frontend):');
const publicKey = vars.NEXT_PUBLIC_INIT_MERCADOPAGO;

if (publicKey) {
  const preview = publicKey.substring(0, 20) + '...';
  console.log(`   ✅ NEXT_PUBLIC_INIT_MERCADOPAGO = ${preview}`);
  console.log(`      Tipo: ${publicKey.startsWith('APP_USR-') ? 'PRODUCCIÓN ✓' : publicKey.startsWith('TEST-') ? 'TEST ⚠️' : 'INVÁLIDO ❌'}`);
  
  if (publicKey.startsWith('TEST-') && mpEnv === 'production') {
    console.log('   ⚠️  ADVERTENCIA: Public Key es de TEST pero ambiente es PRODUCCIÓN');
    console.log('   💡 Usa la Public Key de PRODUCCIÓN');
  }
} else {
  console.log('   ❌ NEXT_PUBLIC_INIT_MERCADOPAGO = No configurado');
}

// 4. Verificar NEXTAUTH_URL
console.log('\n4️⃣  URL de Callback:');
const nextauthUrl = vars.NEXTAUTH_URL;

if (nextauthUrl) {
  console.log(`   ✅ NEXTAUTH_URL = ${nextauthUrl}`);
  
  if (nextauthUrl.includes('localhost')) {
    console.log('   ⚠️  ADVERTENCIA: Usando localhost (solo para desarrollo)');
    console.log('   💡 Para producción usa: https://www.bisonteapp.com');
  } else if (nextauthUrl.startsWith('https://')) {
    console.log('   ✅ HTTPS configurado correctamente ✓');
  } else {
    console.log('   ⚠️  No usa HTTPS (requerido para producción)');
  }
} else {
  console.log('   ❌ NEXTAUTH_URL = No configurado');
}

// 5. Resumen Final
console.log('\n' + '═'.repeat(60));
console.log('📊 RESUMEN:');
console.log('═'.repeat(60));

let issues = [];
let warnings = [];
let success = [];

// Verificar modo
if (mpEnv === 'production') {
  success.push('Modo PRODUCCIÓN activo');
} else {
  issues.push('No estás en modo PRODUCCIÓN');
}

// Verificar tokens
if (tokenProd && tokenProd.startsWith('APP_USR-')) {
  success.push('Access Token de producción válido');
} else {
  issues.push('Access Token de producción inválido o faltante');
}

if (publicKey && publicKey.startsWith('APP_USR-')) {
  success.push('Public Key de producción válida');
} else if (publicKey && publicKey.startsWith('TEST-')) {
  warnings.push('Public Key es de TEST (funcionalidad limitada)');
} else {
  issues.push('Public Key inválida o faltante');
}

// Verificar callback URL
if (nextauthUrl && nextauthUrl.startsWith('https://') && !nextauthUrl.includes('localhost')) {
  success.push('URL de callback configurada para producción');
} else if (nextauthUrl && nextauthUrl.includes('localhost')) {
  warnings.push('URL de callback apunta a localhost');
} else {
  issues.push('URL de callback no configurada');
}

// Mostrar resultados
if (success.length > 0) {
  console.log('\n✅ TODO CORRECTO:');
  success.forEach(s => console.log(`   • ${s}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️  ADVERTENCIAS:');
  warnings.forEach(w => console.log(`   • ${w}`));
}

if (issues.length > 0) {
  console.log('\n❌ PROBLEMAS ENCONTRADOS:');
  issues.forEach(i => console.log(`   • ${i}`));
}

console.log('\n' + '═'.repeat(60));

// Verificar qué token se usará
console.log('\n🎯 TOKEN QUE SE USARÁ:\n');
if (mpEnv === 'production' && tokenProd) {
  console.log('   🟢 Se usará: MP_ACCESS_TOKEN_PROD');
  console.log(`   📝 Token: ${tokenProd.substring(0, 30)}...`);
  console.log('   ✅ Este token permite pagos REALES');
  console.log('   ✅ PSE funcionará correctamente');
} else if (mpEnv === 'test' && tokenTest) {
  console.log('   🟡 Se usará: MP_ACCESS_TOKEN_TEST');
  console.log(`   📝 Token: ${tokenTest.substring(0, 30)}...`);
  console.log('   ⚠️  Este token es de PRUEBAS');
  console.log('   ❌ PSE NO funcionará (solo tarjetas de prueba)');
} else {
  console.log('   ❌ No se puede determinar qué token se usará');
  console.log('   ⚠️  Revisa la configuración');
}

console.log('\n' + '═'.repeat(60));
console.log('💡 RECOMENDACIONES PARA PSE:\n');
console.log('   1. ✅ MP_ENVIRONMENT debe ser "production"');
console.log('   2. ✅ MP_ACCESS_TOKEN_PROD debe empezar con "APP_USR-"');
console.log('   3. ✅ NEXT_PUBLIC_INIT_MERCADOPAGO debe empezar con "APP_USR-"');
console.log('   4. ✅ NEXTAUTH_URL debe ser tu dominio real (no localhost)');
console.log('   5. ⚠️  PSE solo funciona en PRODUCCIÓN (no en TEST)');

console.log('\n' + '═'.repeat(60));

// Código de salida
if (issues.length === 0 && mpEnv === 'production') {
  console.log('\n🎉 ¡TODO CONFIGURADO CORRECTAMENTE PARA PRODUCCIÓN!\n');
  process.exit(0);
} else if (warnings.length > 0 && issues.length === 0) {
  console.log('\n✅ Configuración funcional pero con advertencias menores\n');
  process.exit(0);
} else {
  console.log('\n❌ HAY PROBLEMAS QUE DEBES CORREGIR\n');
  process.exit(1);
}
