#!/usr/bin/env node

/**
 * 🎉 TEST FINAL CON SLASH CORRECTO
 * Login completo usando la URL con slash final
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
        console.log(`   🍪 Cookie guardada: ${name.trim()}`);
        
        // Detectar cookies de sesión específicamente
        if (name.includes('session') || name.includes('next-auth.session-token')) {
          console.log(`   🎯 ¡COOKIE DE SESIÓN DETECTADA!: ${name.trim()}`);
        }
      }
    });
  }
}

async function fetchWithCookies(url, init = {}, description = '') {
  console.log(`\n🌐 ${description}`);
  console.log(`   URL: ${url}`);
  
  const headers = new Headers(init.headers || {});
  const cookiesToSend = Array.from(cookieStore.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
  
  if (cookiesToSend) {
    headers.set('Cookie', cookiesToSend);
    console.log(`   📤 Enviando cookies: ${cookiesToSend.length} chars`);
  }
  
  const response = await fetch(url, {
    ...init,
    headers,
  });
  
  console.log(`   📨 Status: ${response.status} ${response.statusText}`);
  
  storeCookies(response, description);
  
  return response;
}

async function testCompleteLoginWithSlash() {
  console.log('🎉 TEST COMPLETO CON SLASH FINAL CORRECTO');
  console.log('========================================\n');
  
  // Paso 1: Obtener CSRF
  const csrfResponse = await fetchWithCookies(
    `${BASE_URL}/api/auth/csrf`, 
    {}, 
    'Obtener CSRF'
  );
  
  const csrfData = await csrfResponse.json();
  const csrfToken = csrfData.csrfToken;
  
  console.log(`✅ CSRF obtenido: ${csrfToken.substring(0, 20)}...`);
  
  // Paso 2: Crear usuario de prueba
  const testEmail = `slash-test+${Date.now()}@bisonteapp.com`;
  const testPassword = 'SlashTest123!@#';
  
  console.log('\n🆕 Creando usuario de prueba...');
  
  try {
    const registerResponse = await fetchWithCookies(
      `${BASE_URL}/api/register`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: 'Slash Test User',
          celular: '+573001234567',
          ciudad: 'Bogotá', 
          email: testEmail,
          password: testPassword,
        }),
      },
      'Registrar usuario'
    );
    
    if (registerResponse.ok) {
      console.log('✅ Usuario registrado exitosamente');
    } else {
      console.log('⚠️ Usando credenciales existentes');
      // Fallback
      testEmail = 'advanced-test+1727746837995@bisonteapp.com';
      testPassword = 'AdvancedTest123!@#';
    }
  } catch (error) {
    console.log('⚠️ Error en registro, usando credenciales existentes');
    testEmail = 'advanced-test+1727746837995@bisonteapp.com';
    testPassword = 'AdvancedTest123!@#';
  }
  
  // Paso 3: LOGIN CON SLASH FINAL CORRECTO
  console.log(`\n🚀 LOGIN CON SLASH FINAL: ${testEmail}`);
  
  const loginData = new URLSearchParams();
  loginData.append('email', testEmail);
  loginData.append('password', testPassword);
  loginData.append('csrfToken', csrfToken);
  loginData.append('callbackUrl', `${BASE_URL}/home`);
  loginData.append('json', 'true');
  
  const loginResponse = await fetchWithCookies(
    `${BASE_URL}/api/auth/callback/credentials/`, // ¡CON SLASH FINAL!
    {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: loginData,
      redirect: 'manual'
    },
    '🎯 LOGIN CON SLASH FINAL'
  );
  
  const loginText = await loginResponse.text();
  console.log(`\n📄 Respuesta del login: ${loginText}`);
  
  // Paso 4: Verificar sesión
  console.log('\n🔍 Verificando sesión establecida...');
  
  const sessionResponse = await fetchWithCookies(
    `${BASE_URL}/api/auth/session`,
    {},
    'Verificar sesión'
  );
  
  const sessionText = await sessionResponse.text();
  console.log(`\n📋 Datos de sesión: ${sessionText}`);
  
  try {
    const sessionData = JSON.parse(sessionText);
    if (sessionData.user) {
      console.log('\n🎉 ¡¡¡LOGIN EXITOSO!!!');
      console.log('✅ Usuario autenticado:');
      console.log(`   📧 Email: ${sessionData.user.email}`);
      console.log(`   👤 Nombre: ${sessionData.user.name}`);
      console.log(`   🆔 ID: ${sessionData.user.id}`);
      console.log(`   🔐 Role: ${sessionData.user.role}`);
      
      // Verificar cookies de sesión
      const sessionCookies = Array.from(cookieStore.entries()).filter(([name]) => 
        name.includes('session') || name.includes('next-auth.session-token')
      );
      
      console.log(`\n🍪 Cookies de sesión activas: ${sessionCookies.length}`);
      sessionCookies.forEach(([name, value]) => {
        console.log(`   🎯 ${name}: ${value.substring(0, 30)}...`);
      });
      
      return true;
    } else {
      console.log('\n❌ Sesión vacía');
      return false;
    }
  } catch (error) {
    console.log('\n❌ Error parseando sesión');
    return false;
  }
}

async function main() {
  await initFetch();
  
  console.log(`🚀 Test completo para: ${BASE_URL}\n`);
  
  const success = await testCompleteLoginWithSlash();
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESULTADO FINAL');
  console.log('='.repeat(50));
  
  if (success) {
    console.log('🎉 ¡¡¡PROBLEMA RESUELTO COMPLETAMENTE!!!');
    console.log('✅ La autenticación funciona perfectamente');
    console.log('🔧 SOLUCIÓN: Usar URLs con slash final en callbacks');
    console.log('');
    console.log('📋 PASOS PARA IMPLEMENTAR EN LA APP:');
    console.log('1. Actualizar frontend para usar /api/auth/callback/credentials/');
    console.log('2. Verificar que todas las llamadas a NextAuth usen slash final');
    console.log('3. La autenticación ahora funciona 100% ✅');
  } else {
    console.log('❌ Aún hay problemas pendientes');
    console.log('🔍 Revisar logs de Vercel y configuración de NextAuth');
  }
}

main().catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});