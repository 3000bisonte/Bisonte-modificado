#!/usr/bin/env node

/**
 * 🔍 TEST DIRECTO CON SLASH FINAL
 * Probar directamente la URL con slash que aparece en el redirect
 */

const BASE_URL = process.argv[2] || 'https://www.bisonteapp.com';

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

async function testSlashEndpoint() {
  console.log('🔍 TEST DIRECTO CON SLASH FINAL');
  console.log('==============================\n');
  
  // Paso 1: Obtener CSRF
  const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfResponse.json();
  const csrfToken = csrfData.csrfToken;
  
  console.log(`✅ CSRF: ${csrfToken.substring(0, 20)}...`);
  
  // Paso 2: Probar con la URL que aparece en el redirect (CON slash final)
  const loginData = new URLSearchParams();
  loginData.append('email', 'test@bisonteapp.com');
  loginData.append('password', 'Test123!');
  loginData.append('csrfToken', csrfToken);
  loginData.append('json', 'true');
  
  console.log('\n🎯 PROBANDO CON SLASH FINAL:');
  console.log(`   URL: ${BASE_URL}/api/auth/callback/credentials/`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/callback/credentials/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: loginData,
      redirect: 'manual'
    });
    
    console.log(`   📨 Status: ${response.status} ${response.statusText}`);
    
    const location = response.headers.get('location');
    if (location) {
      console.log(`   📍 Redirect: ${location}`);
    }
    
    const text = await response.text();
    console.log(`   📄 Body: ${text.substring(0, 200)}...`);
    
    // Si funciona, seguir probando con credenciales reales
    if (response.status !== 308 && response.status !== 301) {
      console.log('\n✅ ¡EL ENDPOINT CON SLASH FUNCIONA!');
      console.log('   El problema está en la normalización de URLs');
      return true;
    } else {
      console.log('\n❌ El endpoint con slash también redireciona');
      return false;
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testOtherEndpoints() {
  console.log('\n🔍 VERIFICANDO OTROS ENDPOINTS DE NEXTAUTH:');
  
  const endpoints = [
    '/api/auth/providers',
    '/api/auth/session',
    '/api/auth/csrf'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      console.log(`   ${endpoint}: ${response.status} ${response.ok ? '✅' : '❌'}`);
      
      if (response.status === 308 || response.status === 301) {
        const location = response.headers.get('location');
        console.log(`     → Redirect: ${location}`);
      }
    } catch (error) {
      console.log(`   ${endpoint}: ❌ ${error.message}`);
    }
  }
}

async function main() {
  await initFetch();
  
  console.log(`🚀 Analizando redirects en: ${BASE_URL}\n`);
  
  const slashWorks = await testSlashEndpoint();
  await testOtherEndpoints();
  
  console.log('\n📊 DIAGNÓSTICO:');
  console.log('===============');
  
  if (slashWorks) {
    console.log('🎯 SOLUCIÓN: Usar URLs con slash final');
    console.log('   El problema es normalización de rutas');
  } else {
    console.log('🚨 PROBLEMA PROFUNDO: Todos los endpoints redireccionan');
    console.log('   Puede ser configuración de DNS/CDN externa a Vercel');
    console.log('\n🔍 VERIFICAR:');
    console.log('   1. Configuración de Cloudflare (si existe)');
    console.log('   2. Reglas de redirect del dominio');
    console.log('   3. Configuración de DNS');
  }
}

main().catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});