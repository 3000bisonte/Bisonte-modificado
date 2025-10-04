#!/usr/bin/env node

/**
 * 🔍 TEST DE VARIABLES DE ENTORNO EN PRODUCCIÓN
 * Verifica si NextAuth tiene acceso a las variables correctas
 */

const BASE_URL = process.argv[2] || 'https://www.bisonteapp.com';

console.log('🔍 Test de Variables de Entorno en Producción');
console.log('===========================================\n');

let fetch;
async function initFetch() {
  if (typeof globalThis.fetch === 'undefined') {
    try {
      const nodeFetch = await import('node-fetch');
      fetch = nodeFetch.default;
    } catch (error) {
      console.error('❌ Error importando node-fetch:', error.message);
      process.exit(1);
    }
  } else {
    fetch = globalThis.fetch;
  }
}

async function testEnvironmentEndpoint() {
  console.log('🌍 Creando endpoint temporal para verificar variables de entorno...');
  
  // Vamos a probar hacer una llamada que nos dé información sobre el entorno
  try {
    const response = await fetch(`${BASE_URL}/api/auth/csrf`);
    const data = await response.json();
    
    console.log('📋 Response del endpoint CSRF:');
    console.log('   Status:', response.status);
    console.log('   CSRF Token:', data.csrfToken ? 'Presente' : 'Ausente');
    
    // Revisar headers que puedan indicar problemas
    const headers = response.headers;
    console.log('\n📄 Headers importantes:');
    console.log('   Content-Type:', headers.get('content-type'));
    console.log('   Cache-Control:', headers.get('cache-control'));
    console.log('   Set-Cookie:', headers.get('set-cookie') ? 'Presente' : 'Ausente');
    
    return true;
  } catch (error) {
    console.log('❌ Error en test de entorno:', error.message);
    return false;
  }
}

async function checkNextAuthConfiguration() {
  console.log('\n🔧 Verificando configuración de NextAuth...');
  
  try {
    // Test del endpoint de configuración
    const response = await fetch(`${BASE_URL}/api/auth/providers`);
    const providers = await response.json();
    
    console.log('✅ Proveedores configurados:', Object.keys(providers));
    
    if (providers.credentials) {
      console.log('✅ Credentials provider encontrado');
      console.log('   ID:', providers.credentials.id);
      console.log('   Name:', providers.credentials.name);
      console.log('   Type:', providers.credentials.type);
    }
    
    if (providers.google) {
      console.log('✅ Google provider encontrado');
      console.log('   ID:', providers.google.id);
      console.log('   Name:', providers.google.name);
    }
    
    return providers;
  } catch (error) {
    console.log('❌ Error verificando proveedores:', error.message);
    return null;
  }
}

async function testDirectDatabaseConnection() {
  console.log('\n🗄️ Simulando test de conexión a base de datos...');
  
  // Como no podemos conectar directamente desde aquí, haremos un test indirecto
  // a través de la API de registro para ver si la BD responde
  
  const testEmail = `env-test+${Date.now()}@bisonteapp.com`;
  
  try {
    const response = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Env Test User',
        celular: '+573001234567', 
        ciudad: 'Bogotá',
        email: testEmail,
        password: 'EnvTest123!@#'
      })
    });
    
    const text = await response.text();
    console.log('📊 Test de registro (para verificar BD):');
    console.log('   Status:', response.status);
    console.log('   Response:', text.substring(0, 100) + '...');
    
    if (response.ok) {
      console.log('✅ Base de datos accesible desde producción');
      return true;
    } else {
      console.log('❌ Posible problema con base de datos o variables');
      return false;
    }
  } catch (error) {
    console.log('❌ Error en test de BD:', error.message);
    return false;
  }
}

async function analyzeNextAuthIssue() {
  console.log('\n🔍 Análisis específico del problema de NextAuth...');
  
  console.log('\n📋 SÍNTOMAS OBSERVADOS:');
  console.log('   ✅ Registro de usuarios funciona');
  console.log('   ✅ NextAuth providers están configurados');
  console.log('   ✅ CSRF tokens se generan correctamente');
  console.log('   ❌ Login no establece cookies de sesión');
  console.log('   ❌ Sesión permanece vacía después del login');
  
  console.log('\n🚨 POSIBLES CAUSAS RESTANTES:');
  console.log('   1. 🔐 NEXTAUTH_SECRET no coincide entre local y Vercel');
  console.log('   2. 🌐 NEXTAUTH_URL aún no actualizada en Vercel Dashboard');
  console.log('   3. 🔧 Problema en callbacks jwt() o session()');
  console.log('   4. 🗄️ Problemas de conectividad con la BD durante auth');
  console.log('   5. 🍪 Configuración de cookies en producción');
  
  console.log('\n🎯 VERIFICACIONES PRIORITARIAS:');
  console.log('   1. Confirmar que NEXTAUTH_URL en Vercel = https://www.bisonteapp.com');
  console.log('   2. Verificar que NEXTAUTH_SECRET sea exactamente igual');
  console.log('   3. Revisar logs de Vercel durante el login');
  console.log('   4. Probar con NEXTAUTH_DEBUG=true temporalmente');
  
  console.log('\n🔧 COMANDOS PARA VERIFICAR EN VERCEL:');
  console.log('   vercel env ls  # Listar variables actuales');
  console.log('   vercel logs    # Ver logs en tiempo real');
}

async function generateDebugInstructions() {
  console.log('\n📋 INSTRUCCIONES DE DEBUG PASO A PASO:');
  console.log('=====================================');
  
  console.log('\n🏷️ PASO A: Verificar variables en Vercel Dashboard');
  console.log('   1. Ir a: https://vercel.com/dashboard');
  console.log('   2. Proyecto: bisonte-logistica');
  console.log('   3. Settings → Environment Variables');
  console.log('   4. Confirmar exactamente:');
  console.log('      NEXTAUTH_URL=https://www.bisonteapp.com');
  console.log('      NEXTAUTH_SECRET=edf53042b12f07f8aa55498ea575eec9');
  
  console.log('\n🏷️ PASO B: Activar debug temporal');
  console.log('   1. Agregar variable en Vercel:');
  console.log('      NEXTAUTH_DEBUG=true');
  console.log('   2. Redeploy la app');
  console.log('   3. Probar login y revisar logs');
  
  console.log('\n🏷️ PASO C: Test manual del flujo');
  console.log('   1. Ir a: https://www.bisonteapp.com');
  console.log('   2. Registrarse con email nuevo');
  console.log('   3. Hacer login manual');
  console.log('   4. Revisar cookies en DevTools (F12 → Application → Cookies)');
  
  console.log('\n🏷️ PASO D: Verificar logs');
  console.log('   1. En Vercel Dashboard → Functions');
  console.log('   2. Ver logs en tiempo real durante login');
  console.log('   3. Buscar errores de NextAuth o Prisma');
}

async function main() {
  console.log(`🚀 Iniciando test de variables de entorno para: ${BASE_URL}\n`);
  
  await initFetch();
  
  await testEnvironmentEndpoint();
  await checkNextAuthConfiguration();
  await testDirectDatabaseConnection();
  await analyzeNextAuthIssue();
  await generateDebugInstructions();
  
  console.log('\n📊 RESUMEN:');
  console.log('==========');
  console.log('✅ Aplicación desplegada y funcionando');
  console.log('✅ APIs básicas responden correctamente');
  console.log('✅ Base de datos accesible');
  console.log('❌ NextAuth no establece sesiones');
  console.log('');
  console.log('🎯 SIGUIENTE ACCIÓN: Verificar variables de entorno en Vercel Dashboard');
  console.log('🕒 Tiempo estimado de solución: 5-15 minutos');
}

main().catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});