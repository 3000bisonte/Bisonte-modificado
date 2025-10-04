#!/usr/bin/env node

/**
 * 🔍 TEST DIRECTO CON SLASH FINAL
 * Probar si el problema es la normalización de rutas
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

async function testSlashVariations() {
  console.log('🔍 TESTEAR VARIACIONES DE SLASH EN ENDPOINTS');
  console.log('=============================================\n');
  
  const endpoints = [
    '/api/auth/callback/credentials',     // Sin slash final
    '/api/auth/callback/credentials/',    // Con slash final
    '/api/auth/csrf',                     // Para comparación
    '/api/auth/session'                   // Para comparación
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n🌐 Probando: ${endpoint}`);
    
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: endpoint.includes('callback') ? 'POST' : 'GET',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: endpoint.includes('callback') ? 'test=true' : undefined,
        redirect: 'manual'
      });
      
      console.log(`   📨 Status: ${response.status} ${response.statusText}`);
      
      const location = response.headers.get('location');
      if (location) {
        console.log(`   📍 Redirect: ${location}`);
      }
      
      // Intentar leer body si no es redirect
      if (!location) {
        const text = await response.text();
        console.log(`   📄 Body: ${text.substring(0, 100)}...`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n🔧 DIAGNÓSTICO ADICIONAL:');
  
  // Test específico de NextAuth endpoints
  const nextAuthEndpoints = [
    '/api/auth/providers',
    '/api/auth/session', 
    '/api/auth/csrf'
  ];
  
  for (const endpoint of nextAuthEndpoints) {
    console.log(`\n🔍 NextAuth: ${endpoint}`);
    
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      console.log(`   📨 Status: ${response.status}`);
      
      if (response.ok) {
        const text = await response.text();
        console.log(`   ✅ Funciona: ${text.substring(0, 80)}...`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

async function main() {
  await initFetch();
  
  console.log(`🚀 Analizando endpoints en: ${BASE_URL}\n`);
  
  await testSlashVariations();
  
  console.log('\n📊 CONCLUSIONES:');
  console.log('================');
  console.log('Si todos los endpoints NextAuth funcionan EXCEPTO callback/credentials,');
  console.log('el problema está específicamente en el manejo de POST a esa ruta.');
  console.log('\n🔥 SOLUCIONES A PROBAR:');
  console.log('1. Verificar si Vercel tiene reglas de rewrite específicas');
  console.log('2. Revisar si hay middleware interfiriendo');
  console.log('3. Probar con diferentes Content-Type headers');
}

main().catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});