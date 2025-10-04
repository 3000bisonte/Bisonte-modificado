#!/usr/bin/env node

/**
 * 🔍 TEST DIRECTO DE LOGIN SIN REGISTRO
 * Usa credenciales existentes para evitar rate limiting
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

// Cookie storage para tracking
const cookieStore = new Map();

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
  
  if (cookieInfo.name) {
    cookieStore.set(cookieInfo.name, cookieInfo);
  }
  
  return cookieInfo;
}

function storeCookiesAdvanced(response, source) {
  let cookiesProcessed = 0;
  
  if (response.headers.raw && typeof response.headers.raw === 'function') {
    const setCookieHeaders = response.headers.raw()['set-cookie'] || [];
    setCookieHeaders.forEach(cookieString => {
      const info = analyzeCookieDetails(cookieString, source);
      cookiesProcessed++;
      console.log(`   🍪 [${info.name}] = ${info.value?.substring(0, 30)}...`);
      
      // Detectar cookies de sesión
      if (info.name.includes('session') || info.name.includes('next-auth.session-token')) {
        console.log(`      🎯 ¡COOKIE DE SESIÓN DETECTADA!`);
      }
    });
  }
  
  return cookiesProcessed;
}

async function fetchWithDebug(url, init = {}, description = '') {
  const requestId = Date.now().toString().slice(-4);
  
  console.log(`\n🌐 [${requestId}] ${description}`);
  console.log(`   URL: ${url}`);
  console.log(`   Method: ${init.method || 'GET'}`);
  
  // Preparar cookies
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
    
    // Mostrar headers importantes
    const location = response.headers.get('location');
    if (location) {
      console.log(`   📍 Redirect: ${location}`);
    }
    
    // Procesar cookies
    const cookiesReceived = storeCookiesAdvanced(response, `${requestId} ${description}`);
    
    return { response, cookiesReceived };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    throw error;
  }
}

async function testDirectLogin() {
  console.log('🔐 TEST DIRECTO DE LOGIN CON CREDENCIALES EXISTENTES');
  console.log('==================================================\n');
  
  // Paso 1: Obtener CSRF
  const { response: csrfResponse } = await fetchWithDebug(
    `${BASE_URL}/api/auth/csrf`, 
    {}, 
    'Obtener CSRF token'
  );
  
  const csrfData = await csrfResponse.json();
  const csrfToken = csrfData.csrfToken;
  
  if (!csrfToken) {
    console.log('❌ No se pudo obtener CSRF token');
    return false;
  }
  
  console.log(`✅ CSRF token obtenido: ${csrfToken.substring(0, 20)}...`);
  
  // Paso 2: Intentar login con usuario que probablemente existe
  // Usar el email del usuario ID 108 que sabemos que fue creado en tests anteriores
  console.log('\n🎯 PROBANDO LOGIN DIRECTO:');
  
  const loginData = new URLSearchParams();
  loginData.append('email', 'advanced-test+1727746837995@bisonteapp.com'); // Usuario del test anterior
  loginData.append('password', 'AdvancedTest123!@#');
  loginData.append('csrfToken', csrfToken);
  loginData.append('callbackUrl', `${BASE_URL}/home`);
  loginData.append('json', 'true');
  
  console.log('📝 Datos de login preparados');
  
  const { response: loginResponse, cookiesReceived } = await fetchWithDebug(
    `${BASE_URL}/api/auth/callback/credentials`,
    {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: loginData,
      redirect: 'manual'
    },
    '🚨 LOGIN CRÍTICO CON DEBUG'
  );
  
  const loginText = await loginResponse.text();
  console.log(`\n📄 Response completa del login:\n${loginText}`);
  
  // Paso 3: Analizar el resultado
  console.log('\n🔍 ANÁLISIS POST-LOGIN:');
  
  // Buscar cookies de sesión
  const sessionCookies = Array.from(cookieStore.values()).filter(info => 
    info.name.includes('session') || 
    info.name.includes('next-auth.session-token') ||
    info.name.includes('__Secure-next-auth.session-token')
  );
  
  console.log(`📊 Cookies de sesión encontradas: ${sessionCookies.length}`);
  
  if (sessionCookies.length > 0) {
    console.log('🎉 ¡COOKIES DE SESIÓN ENCONTRADAS!');
    sessionCookies.forEach(cookie => {
      console.log(`   🎯 ${cookie.name}: ${cookie.value?.substring(0, 50)}...`);
    });
    
    // Verificar sesión
    const { response: sessionResponse } = await fetchWithDebug(
      `${BASE_URL}/api/auth/session`,
      {},
      'Verificar sesión activa'
    );
    
    const sessionText = await sessionResponse.text();
    console.log(`\n📋 Estado de sesión: ${sessionText}`);
    
    try {
      const sessionData = JSON.parse(sessionText);
      if (sessionData.user) {
        console.log('✅ ¡LOGIN EXITOSO! Usuario autenticado:');
        console.log(`   ID: ${sessionData.user.id}`);
        console.log(`   Email: ${sessionData.user.email}`);
        console.log(`   Nombre: ${sessionData.user.name}`);
        return true;
      }
    } catch (e) {
      console.log('❌ Error parseando sesión');
    }
  } else {
    console.log('❌ NO SE CREARON COOKIES DE SESIÓN');
    
    // Mostrar qué cookies SÍ tenemos
    console.log('\n🍪 Cookies disponibles:');
    Array.from(cookieStore.entries()).forEach(([name, info]) => {
      console.log(`   - ${name}: ${info.value?.substring(0, 30)}...`);
      console.log(`     Fuente: ${info.source}`);
      console.log(`     Attributes: ${JSON.stringify(info.attributes)}`);
    });
    
    // Verificar si el login al menos redireccionó correctamente
    if (loginResponse.status === 302 || loginResponse.status === 307) {
      const location = loginResponse.headers.get('location');
      console.log(`\n🔄 Login redireccionó a: ${location}`);
      
      if (location?.includes('/home') || location?.includes('callbackUrl')) {
        console.log('✅ Redirection parece correcta, pero sin cookies de sesión');
        console.log('🚨 PROBLEMA: NextAuth no está estableciendo cookies de sesión');
      }
    }
  }
  
  return false;
}

async function main() {
  await initFetch();
  
  console.log(`🚀 Iniciando test directo para: ${BASE_URL}\n`);
  
  const success = await testDirectLogin();
  
  console.log('\n📊 RESULTADO FINAL:');
  console.log('==================');
  
  if (success) {
    console.log('🎉 ¡PROBLEMA RESUELTO! El login funciona correctamente');
  } else {
    console.log('❌ PROBLEMA PERSISTE: El login no establece sesiones válidas');
    console.log('\n🔥 PRÓXIMA ACCIÓN:');
    console.log('1. 📱 Ve a Vercel Dashboard → Functions → View Function Logs');
    console.log('2. 🔍 Busca logs de `/api/auth/callback/credentials` con NEXTAUTH_DEBUG');
    console.log('3. 📋 Revisa si hay errores en los callbacks jwt() o session()');
    console.log('4. 🔧 Verifica que NEXTAUTH_SECRET sea válido en Vercel');
  }
}

main().catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});