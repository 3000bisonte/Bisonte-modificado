#!/usr/bin/env node

/**
 * 🔍 ANÁLISIS PROFUNDO DE CONFIGURACIÓN DE NEXTAUTH
 * Examina configuración de cookies, JWT y session en producción
 */

const BASE_URL = process.argv[2] || 'https://www.bisonteapp.com';

console.log('🔍 Análisis Profundo de Configuración NextAuth');
console.log('============================================\n');

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

// Cookie storage avanzado para análisis detallado
const cookieStore = new Map();
const cookieHistory = [];

function analyzeCookieDetails(cookieString, source) {
  const parts = cookieString.split(';').map(p => p.trim());
  const [nameValue] = parts;
  const [name, value] = nameValue.split('=');
  
  const attributes = {};
  parts.slice(1).forEach(part => {
    if (part.includes('=')) {
      const [key, val] = part.split('=');
      attributes[key.toLowerCase()] = val;
    } else {
      attributes[part.toLowerCase()] = true;
    }
  });
  
  const cookieInfo = {
    name: name?.trim(),
    value: value?.trim(),
    attributes,
    source,
    timestamp: new Date().toISOString()
  };
  
  cookieHistory.push(cookieInfo);
  
  if (cookieInfo.name) {
    cookieStore.set(cookieInfo.name, cookieInfo);
  }
  
  return cookieInfo;
}

function storeCookiesAdvanced(response, source) {
  let cookiesProcessed = 0;
  
  // Procesar cookies de diferentes formas para máxima compatibilidad
  if (response.headers.raw && typeof response.headers.raw === 'function') {
    const setCookieHeaders = response.headers.raw()['set-cookie'] || [];
    setCookieHeaders.forEach(cookieString => {
      const info = analyzeCookieDetails(cookieString, source);
      cookiesProcessed++;
      console.log(`   🍪 [${info.name}] = ${info.value?.substring(0, 30)}...`);
      
      // Análisis de atributos críticos
      const criticalAttrs = [];
      if (info.attributes.secure) criticalAttrs.push('Secure');
      if (info.attributes.httponly) criticalAttrs.push('HttpOnly');
      if (info.attributes.samesite) criticalAttrs.push(`SameSite=${info.attributes.samesite}`);
      if (info.attributes.domain) criticalAttrs.push(`Domain=${info.attributes.domain}`);
      if (info.attributes.path) criticalAttrs.push(`Path=${info.attributes.path}`);
      
      if (criticalAttrs.length > 0) {
        console.log(`      ↳ Atributos: ${criticalAttrs.join(', ')}`);
      }
      
      // Detectar problemas específicos
      if (info.name.includes('session') || info.name.includes('next-auth.session-token')) {
        console.log(`      🎯 COOKIE DE SESIÓN DETECTADA!`);
      }
    });
  } else {
    // Fallback para fetch nativo
    response.headers.forEach((value, name) => {
      if (name.toLowerCase() === 'set-cookie') {
        const info = analyzeCookieDetails(value, source);
        cookiesProcessed++;
        console.log(`   🍪 [${info.name}] = ${info.value?.substring(0, 30)}...`);
      }
    });
  }
  
  if (cookiesProcessed === 0) {
    console.log(`   ❌ No se recibieron cookies de: ${source}`);
  }
  
  return cookiesProcessed;
}

async function fetchWithAdvancedDebug(url, init = {}, description = '') {
  const requestId = Date.now().toString().slice(-4);
  
  console.log(`\n🌐 [${requestId}] ${description}`);
  console.log(`   URL: ${url}`);
  console.log(`   Method: ${init.method || 'GET'}`);
  
  // Preparar cookies para enviar
  const headers = new Headers(init.headers || {});
  const cookiesToSend = Array.from(cookieStore.values())
    .map(info => `${info.name}=${info.value}`)
    .join('; ');
  
  if (cookiesToSend) {
    headers.set('Cookie', cookiesToSend);
    console.log(`   📤 Enviando cookies: ${cookiesToSend.length} caracteres`);
  }
  
  try {
    const response = await fetch(url, {
      ...init,
      headers,
    });
    
    console.log(`   📨 Response: ${response.status} ${response.statusText}`);
    
    // Analizar headers de respuesta
    const location = response.headers.get('location');
    if (location) {
      console.log(`   📍 Redirect: ${location}`);
    }
    
    // Procesar cookies recibidas
    const cookiesReceived = storeCookiesAdvanced(response, `${requestId} ${description}`);
    
    return { response, cookiesReceived };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    throw error;
  }
}

async function testCompleteAuthFlow() {
  console.log('🔐 TEST COMPLETO DEL FLUJO DE AUTENTICACIÓN');
  console.log('==========================================\n');
  
  // Paso 1: Obtener CSRF
  const { response: csrfResponse } = await fetchWithAdvancedDebug(
    `${BASE_URL}/api/auth/csrf`, 
    {}, 
    'Obtener CSRF token'
  );
  
  const csrfData = await csrfResponse.json();
  const csrfToken = csrfData.csrfToken;
  
  if (!csrfToken) {
    console.log('❌ No se pudo obtener CSRF token');
    return;
  }
  
  // Paso 2: Registrar usuario
  const testEmail = `advanced-test+${Date.now()}@bisonteapp.com`;
  const testPassword = 'AdvancedTest123!@#';
  
  const { response: registerResponse } = await fetchWithAdvancedDebug(
    `${BASE_URL}/api/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Advanced Test User',
        celular: '+573001234567',
        ciudad: 'Bogotá', 
        email: testEmail,
        password: testPassword,
      }),
    },
    'Registrar usuario'
  );
  
  const registerText = await registerResponse.text();
  if (!registerResponse.ok) {
    console.log('❌ Registro falló:', registerText.substring(0, 200));
    return;
  }
  
  console.log('✅ Usuario registrado exitosamente');
  
  // Paso 3: Login con análisis detallado
  console.log('\n🎯 ANÁLISIS CRÍTICO DEL LOGIN:');
  
  const loginData = new URLSearchParams();
  loginData.append('email', testEmail);
  loginData.append('password', testPassword);
  loginData.append('csrfToken', csrfToken);
  loginData.append('callbackUrl', `${BASE_URL}/home`);
  loginData.append('json', 'true');
  
  const { response: loginResponse, cookiesReceived } = await fetchWithAdvancedDebug(
    `${BASE_URL}/api/auth/callback/credentials`,
    {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: loginData,
      redirect: 'manual'
    },
    'LOGIN CRÍTICO'
  );
  
  const loginText = await loginResponse.text();
  console.log(`   📄 Response body: ${loginText}`);
  
  // Análisis específico de cookies de sesión
  console.log('\n🔍 ANÁLISIS DE COOKIES POST-LOGIN:');
  const sessionCookies = Array.from(cookieStore.values()).filter(info => 
    info.name.includes('session') || 
    info.name.includes('next-auth.session-token') ||
    info.name.includes('__Secure-next-auth.session-token') ||
    info.name.includes('__Host-next-auth.session-token')
  );
  
  console.log(`   📊 Cookies de sesión encontradas: ${sessionCookies.length}`);
  
  if (sessionCookies.length > 0) {
    sessionCookies.forEach(cookie => {
      console.log(`   🎯 ${cookie.name}:`);
      console.log(`      Value: ${cookie.value?.substring(0, 50)}...`);
      console.log(`      Attributes:`, cookie.attributes);
    });
  } else {
    console.log('   ❌ NO SE ENCONTRARON COOKIES DE SESIÓN');
    console.log('   🔍 Cookies disponibles:');
    Array.from(cookieStore.keys()).forEach(name => {
      console.log(`      - ${name}`);
    });
  }
  
  // Paso 4: Verificar sesión
  const { response: sessionResponse } = await fetchWithAdvancedDebug(
    `${BASE_URL}/api/auth/session`,
    {},
    'Verificar sesión'
  );
  
  const sessionText = await sessionResponse.text();
  console.log(`\n📋 Respuesta de sesión: ${sessionText}`);
  
  try {
    const sessionData = JSON.parse(sessionText);
    if (sessionData.user) {
      console.log('✅ ¡SESIÓN VÁLIDA ENCONTRADA!');
      console.log('   Usuario:', sessionData.user);
      return true;
    } else {
      console.log('❌ Sesión vacía o inválida');
      return false;
    }
  } catch (error) {
    console.log('❌ Error parseando respuesta de sesión');
    return false;
  }
}

async function analyzeNextAuthConfiguration() {
  console.log('\n🔧 ANÁLISIS DE CONFIGURACIÓN DE NEXTAUTH');
  console.log('======================================\n');
  
  console.log('📋 Historial completo de cookies:');
  cookieHistory.forEach((cookie, index) => {
    console.log(`${index + 1}. [${cookie.timestamp}] ${cookie.name} desde ${cookie.source}`);
    if (cookie.attributes.domain) {
      console.log(`   Domain: ${cookie.attributes.domain}`);
    }
    if (cookie.attributes.secure) {
      console.log(`   🔒 Secure: true`);
    }
    if (cookie.attributes.samesite) {
      console.log(`   🛡️ SameSite: ${cookie.attributes.samesite}`);
    }
  });
  
  console.log('\n🚨 POSIBLES PROBLEMAS IDENTIFICADOS:');
  
  // Verificar configuración de cookies
  const nextAuthCookies = cookieHistory.filter(c => c.name.includes('next-auth'));
  
  if (nextAuthCookies.length === 0) {
    console.log('❌ CRÍTICO: No se encontraron cookies de NextAuth');
    console.log('   → NextAuth no está funcionando en absoluto');
  } else {
    console.log(`✅ Se encontraron ${nextAuthCookies.length} cookies de NextAuth`);
    
    // Verificar cookies de sesión específicamente
    const sessionCookies = nextAuthCookies.filter(c => c.name.includes('session'));
    if (sessionCookies.length === 0) {
      console.log('❌ CRÍTICO: No se encontraron cookies de sesión');
      console.log('   → El login no está estableciendo la sesión');
      console.log('   → Problema en authorize() o callbacks JWT/Session');
    }
  }
  
  console.log('\n💡 PRÓXIMOS PASOS DE DEBUG:');
  console.log('===========================');
  console.log('1. 🔍 Revisar logs de Vercel durante el login');
  console.log('2. 🔧 Activar NEXTAUTH_DEBUG=true temporalmente');
  console.log('3. 🔍 Verificar que JWT_SECRET sea válido');
  console.log('4. 🔍 Comprobar callbacks jwt() y session() en src/lib/auth.js');
}

async function main() {
  await initFetch();
  
  console.log(`🚀 Iniciando análisis profundo para: ${BASE_URL}\n`);
  
  const sessionWorking = await testCompleteAuthFlow();
  await analyzeNextAuthConfiguration();
  
  console.log('\n📊 RESULTADO FINAL:');
  console.log('==================');
  
  if (sessionWorking) {
    console.log('🎉 ¡PROBLEMA RESUELTO! La autenticación funciona correctamente');
  } else {
    console.log('❌ PROBLEMA PERSISTE: NextAuth no está estableciendo sesiones');
    console.log('\n🎯 ACCIÓN INMEDIATA REQUERIDA:');
    console.log('1. Activar NEXTAUTH_DEBUG=true en Vercel');
    console.log('2. Revisar logs de Functions en Vercel Dashboard');
    console.log('3. Verificar callbacks en src/lib/auth.js');
    console.log('4. Considerar regenerar NEXTAUTH_SECRET');
  }
}

main().catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});