#!/usr/bin/env node

/**
 * 🔍 ANÁLISIS ESPECÍFICO DE ERROR 401
 * Diagnóstico detallado del fallo de credenciales
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

// Cookie storage
const cookieStore = new Map();

function storeCookies(response, source) {
  if (response.headers.raw && typeof response.headers.raw === 'function') {
    const setCookieHeaders = response.headers.raw()['set-cookie'] || [];
    setCookieHeaders.forEach(cookieString => {
      const [nameValue] = cookieString.split(';');
      const [name, value] = nameValue.split('=');
      if (name?.trim()) {
        cookieStore.set(name.trim(), value?.trim() || '');
        console.log(`   🍪 Guardado: ${name.trim()}`);
      }
    });
  }
}

async function fetchWithCookies(url, init = {}, description = '') {
  console.log(`\n🌐 ${description}`);
  console.log(`   URL: ${url}`);
  console.log(`   Method: ${init.method || 'GET'}`);
  
  const headers = new Headers(init.headers || {});
  const cookiesToSend = Array.from(cookieStore.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
  
  if (cookiesToSend) {
    headers.set('Cookie', cookiesToSend);
    console.log(`   📤 Cookies: ${cookiesToSend}`);
  }
  
  try {
    const response = await fetch(url, {
      ...init,
      headers,
    });
    
    console.log(`   📨 Response: ${response.status} ${response.statusText}`);
    
    storeCookies(response, description);
    
    return response;
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    throw error;
  }
}

async function test401Analysis() {
  console.log('🔍 ANÁLISIS ESPECÍFICO DEL ERROR 401');
  console.log('===================================\n');
  
  // Paso 1: Obtener CSRF
  const csrfResponse = await fetchWithCookies(
    `${BASE_URL}/api/auth/csrf`, 
    {}, 
    'Obtener CSRF token'
  );
  
  const csrfData = await csrfResponse.json();
  const csrfToken = csrfData.csrfToken;
  
  console.log(`✅ CSRF: ${csrfToken.substring(0, 20)}...`);
  
  // Paso 2: Crear usuario de prueba rápido
  console.log('\n🔄 Intentando crear usuario de prueba...');
  const testEmail = `test-401+${Date.now()}@bisonteapp.com`;
  const testPassword = 'Test401Password123!';
  
  try {
    const registerResponse = await fetchWithCookies(
      `${BASE_URL}/api/register`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: 'Test 401 User',
          celular: '+573001234567',
          ciudad: 'Bogotá', 
          email: testEmail,
          password: testPassword,
        }),
      },
      'Registrar usuario de prueba'
    );
    
    if (registerResponse.ok) {
      console.log('✅ Usuario creado exitosamente');
    } else {
      console.log(`⚠️ Registro falló (${registerResponse.status}), usando credenciales existentes`);
      // Usar credenciales que sabemos que existen
      testEmail = 'advanced-test+1727746837995@bisonteapp.com';
      testPassword = 'AdvancedTest123!@#';
    }
  } catch (error) {
    console.log(`⚠️ Error en registro: ${error.message}`);
    // Fallback a credenciales conocidas
    testEmail = 'advanced-test+1727746837995@bisonteapp.com';
    testPassword = 'AdvancedTest123!@#';
  }
  
  // Paso 3: Analizar el login con diferentes variaciones
  console.log(`\n🎯 ANÁLISIS DEL LOGIN CON: ${testEmail}`);
  
  const loginVariations = [
    {
      name: 'Login estándar',
      data: {
        email: testEmail,
        password: testPassword,
        csrfToken: csrfToken,
        callbackUrl: `${BASE_URL}/home`,
        json: 'true'
      }
    },
    {
      name: 'Login sin callbackUrl',
      data: {
        email: testEmail,
        password: testPassword,
        csrfToken: csrfToken,
        json: 'true'
      }
    },
    {
      name: 'Login sin json flag',
      data: {
        email: testEmail,
        password: testPassword,
        csrfToken: csrfToken,
        callbackUrl: `${BASE_URL}/home`
      }
    }
  ];
  
  for (const variation of loginVariations) {
    console.log(`\n🧪 Probando: ${variation.name}`);
    
    const loginData = new URLSearchParams();
    Object.entries(variation.data).forEach(([key, value]) => {
      loginData.append(key, value);
    });
    
    console.log(`   📝 Data: ${loginData.toString()}`);
    
    const loginResponse = await fetchWithCookies(
      `${BASE_URL}/api/auth/callback/credentials`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: loginData,
        redirect: 'manual'
      },
      `LOGIN: ${variation.name}`
    );
    
    const loginText = await loginResponse.text();
    console.log(`   📄 Response: ${loginText.substring(0, 200)}...`);
    
    if (loginResponse.status === 401) {
      console.log('   ❌ 401 UNAUTHORIZED - Credenciales rechazadas');
    } else if (loginResponse.status === 302 || loginResponse.status === 307) {
      const location = loginResponse.headers.get('location');
      console.log(`   ✅ REDIRECT: ${location}`);
      
      if (location?.includes('/home')) {
        console.log('   🎉 ¡LOGIN EXITOSO!');
        break;
      }
    } else {
      console.log(`   ⚠️ Status inesperado: ${loginResponse.status}`);
    }
  }
  
  // Paso 4: Verificar si hay sesión establecida
  console.log('\n🔍 Verificando estado final de sesión...');
  
  const sessionResponse = await fetchWithCookies(
    `${BASE_URL}/api/auth/session`,
    {},
    'Verificar sesión'
  );
  
  const sessionText = await sessionResponse.text();
  console.log(`📋 Sesión: ${sessionText}`);
  
  try {
    const sessionData = JSON.parse(sessionText);
    if (sessionData.user) {
      console.log('🎉 ¡SESIÓN VÁLIDA ENCONTRADA!');
      return true;
    }
  } catch (e) {
    console.log('❌ No hay sesión válida');
  }
  
  return false;
}

async function main() {
  await initFetch();
  
  console.log(`🚀 Análisis 401 para: ${BASE_URL}\n`);
  
  const success = await test401Analysis();
  
  console.log('\n📊 DIAGNÓSTICO FINAL:');
  console.log('=====================');
  
  if (success) {
    console.log('🎉 ¡PROBLEMA RESUELTO! La autenticación funciona');
  } else {
    console.log('❌ PROBLEMA PERSISTE: Error 401 en credenciales');
    console.log('\n🔍 POSIBLES CAUSAS DEL 401:');
    console.log('1. 🔑 CSRF token inválido o malformado');
    console.log('2. 📧 Email no existe en la base de datos');
    console.log('3. 🔐 Password incorrecto');
    console.log('4. 🕐 Rate limiting activo');
    console.log('5. ⚙️ Error en función authorize() de NextAuth');
    
    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('1. Revisar logs de Vercel Functions (con NEXTAUTH_DEBUG=true)');
    console.log('2. Verificar que la base de datos esté accesible');
    console.log('3. Probar credenciales manualmente en la interfaz web');
  }
}

main().catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});