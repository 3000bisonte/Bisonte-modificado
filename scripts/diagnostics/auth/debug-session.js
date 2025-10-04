#!/usr/bin/env node

/**
 * 🔧 Debug específico para problemas de establecimiento de sesión
 * Identifica por qué NextAuth no está creando sesiones correctamente
 */

const BASE_URL = process.argv[2] || process.env.BASE_URL || 'https://bisonteapp.com';

console.log('🔍 Debug de Sesión NextAuth - Bisonte');
console.log(`   Base URL: ${BASE_URL}`);

// Importar fetch para Node.js
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

// Cookie storage para mantener sesión
const cookieStore = new Map();

function storeCookies(response) {
  // Compatibilidad con diferentes implementaciones de fetch
  let setCookieHeaders = [];
  
  if (response.headers.raw && typeof response.headers.raw === 'function') {
    setCookieHeaders = response.headers.raw()['set-cookie'] || [];
  } else {
    // Fallback para fetch nativo
    response.headers.forEach((value, name) => {
      if (name.toLowerCase() === 'set-cookie') {
        setCookieHeaders.push(value);
      }
    });
  }
  
  for (const cookieString of setCookieHeaders) {
    const [nameValue] = cookieString.split(';');
    const [name, value] = nameValue.split('=');
    if (name && value !== undefined) {
      cookieStore.set(name.trim(), value.trim());
      console.log(`🍪 Cookie almacenada: ${name.trim()} = ${value.trim().substring(0, 20)}${value.trim().length > 20 ? '...' : ''}`);
    }
  }
}

function buildCookieHeader() {
  const cookies = Array.from(cookieStore.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
  return cookies || '';
}

async function fetchWithSession(url, init = {}) {
  const headers = new Headers(init.headers || {});
  const cookieHeader = buildCookieHeader();
  if (cookieHeader) {
    headers.set('Cookie', cookieHeader);
  }

  console.log(`🌐 Solicitando: ${url}`);
  if (cookieHeader) {
    console.log(`🍪 Enviando cookies: ${cookieHeader.substring(0, 100)}${cookieHeader.length > 100 ? '...' : ''}`);
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  console.log(`📨 Respuesta: ${response.status} ${response.statusText}`);
  storeCookies(response);
  return response;
}

async function debugNextAuthConfiguration() {
  console.log('\n🔧 1. Verificando configuración de NextAuth...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/providers`);
    const providers = await response.json();
    console.log('✅ Proveedores configurados:', Object.keys(providers));
    
    if (providers.credentials) {
      console.log('✅ Proveedor de credenciales disponible');
    } else {
      console.log('❌ Proveedor de credenciales NO configurado');
    }
  } catch (error) {
    console.log('❌ Error obteniendo proveedores:', error.message);
  }
}

async function debugCSRFToken() {
  console.log('\n🛡️  2. Obteniendo CSRF token...');
  
  try {
    const response = await fetchWithSession(`${BASE_URL}/api/auth/csrf`);
    const data = await response.json();
    
    if (data.csrfToken) {
      console.log('✅ CSRF token obtenido');
      return data.csrfToken;
    } else {
      console.log('❌ No se pudo obtener CSRF token');
      return null;
    }
  } catch (error) {
    console.log('❌ Error obteniendo CSRF:', error.message);
    return null;
  }
}

async function debugCredentialsLogin(csrfToken) {
  console.log('\n🔐 3. Probando login con credenciales...');
  
  const testEmail = `test+${Date.now()}@bisonteapp.com`;
  const testPassword = 'TestPassword123!';
  
  // Primero registrar usuario
  console.log('   3a. Registrando usuario de prueba...');
  try {
    const registerResponse = await fetchWithSession(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Test Debug User',
        celular: '+573001234567',
        ciudad: 'Bogotá',
        email: testEmail,
        password: testPassword,
      }),
    });
    
    const registerText = await registerResponse.text();
    console.log(`   📊 Registro: ${registerResponse.status} - ${registerText.substring(0, 100)}`);
    
    if (!registerResponse.ok) {
      console.log('❌ Registro falló, no se puede continuar con login test');
      return;
    }
  } catch (error) {
    console.log('❌ Error en registro:', error.message);
    return;
  }
  
  // Ahora intentar login
  console.log('   3b. Intentando login...');
  try {
    const loginData = new URLSearchParams();
    loginData.append('email', testEmail);
    loginData.append('password', testPassword);
    loginData.append('csrfToken', csrfToken || '');
    loginData.append('callbackUrl', `${BASE_URL}/home`);
    loginData.append('json', 'true');
    
    const loginResponse = await fetchWithSession(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: loginData,
      redirect: 'manual' // No seguir redirects automáticamente
    });
    
    console.log(`   📊 Login response: ${loginResponse.status} ${loginResponse.statusText}`);
    
    // Verificar headers de redirección
    const location = loginResponse.headers.get('location');
    if (location) {
      console.log(`   📍 Redirige a: ${location}`);
    }
    
    // Verificar si se establecieron cookies de sesión
    const sessionCookies = Array.from(cookieStore.keys()).filter(name => 
      name.includes('next-auth') || name.includes('session')
    );
    
    if (sessionCookies.length > 0) {
      console.log('✅ Cookies de sesión establecidas:', sessionCookies);
    } else {
      console.log('❌ NO se establecieron cookies de sesión');
    }
    
    // Intentar obtener respuesta del login
    const loginText = await loginResponse.text();
    console.log(`   📄 Response body: ${loginText.substring(0, 200)}${loginText.length > 200 ? '...' : ''}`);
    
  } catch (error) {
    console.log('❌ Error en login:', error.message);
  }
}

async function debugSessionValidation() {
  console.log('\n✅ 4. Validando sesión establecida...');
  
  try {
    const sessionResponse = await fetchWithSession(`${BASE_URL}/api/auth/session`);
    const sessionData = await sessionResponse.text();
    
    console.log(`   📊 Session response: ${sessionResponse.status}`);
    console.log(`   📄 Session data: ${sessionData.substring(0, 200)}${sessionData.length > 200 ? '...' : ''}`);
    
    if (sessionData && sessionData !== '{}' && !sessionData.includes('"user":null')) {
      console.log('✅ Sesión válida detectada');
      try {
        const parsed = JSON.parse(sessionData);
        if (parsed.user) {
          console.log(`   👤 Usuario en sesión: ${parsed.user.email || parsed.user.name || 'N/A'}`);
        }
      } catch (e) {
        // Ignore parsing errors
      }
    } else {
      console.log('❌ No hay sesión activa o sesión vacía');
    }
    
  } catch (error) {
    console.log('❌ Error validando sesión:', error.message);
  }
}

async function debugEnvironmentVariables() {
  console.log('\n🌍 5. Verificando variables críticas de entorno...');
  
  // Estas son las variables críticas que NextAuth necesita
  const criticalVars = [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET', 
    'DATABASE_URL'
  ];
  
  console.log('   Variables esperadas en producción:');
  criticalVars.forEach(varName => {
    // No podemos acceder directamente a las env vars del servidor desde el cliente
    // pero podemos inferir problemas desde las respuestas
    console.log(`   - ${varName}: [Verificar en servidor]`);
  });
  
  console.log(`   - Base URL configurada: ${BASE_URL}`);
  
  // Verificar que el BASE_URL sea consistente con NEXTAUTH_URL
  try {
    const baseUrlObj = new URL(BASE_URL);
    console.log(`   - Protocolo: ${baseUrlObj.protocol} (debe ser https: en producción)`);
    console.log(`   - Dominio: ${baseUrlObj.hostname}`);
    console.log(`   - Puerto: ${baseUrlObj.port || 'default'}`);
  } catch (error) {
    console.log(`   ❌ URL base inválida: ${error.message}`);
  }
}

async function main() {
  console.log('\n🚀 Iniciando debug de sesión NextAuth...\n');
  
  await initFetch();
  
  await debugNextAuthConfiguration();
  const csrfToken = await debugCSRFToken();
  await debugCredentialsLogin(csrfToken);
  await debugSessionValidation();
  await debugEnvironmentVariables();
  
  console.log('\n📋 Debug completo');
  console.log('\n💡 Próximos pasos:');
  console.log('   1. Si NO se establecen cookies de sesión → revisar NEXTAUTH_URL');
  console.log('   2. Si login responde con error → revisar logs del servidor'); 
  console.log('   3. Si cookies se establecen pero sesión está vacía → revisar JWT callbacks');
  console.log('   4. Si protocolo es http: en producción → configurar HTTPS');
}

main().catch(error => {
  console.error('💥 Error fatal en debug:', error);
  process.exit(1);
});