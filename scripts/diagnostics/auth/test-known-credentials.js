#!/usr/bin/env node

/**
 * 🔍 TEST CON CREDENCIALES CONOCIDAS VÁLIDAS
 * Usar un email que sabemos que existe y funciona
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

function storeCookiesAdvanced(response, source) {
  if (response.headers.raw && typeof response.headers.raw === 'function') {
    const setCookieHeaders = response.headers.raw()['set-cookie'] || [];
    setCookieHeaders.forEach(cookieString => {
      console.log(`   🍪 Raw cookie: ${cookieString}`);
      
      const parts = cookieString.split(';').map(p => p.trim());
      const [nameValue] = parts;
      const [name, value] = nameValue.split('=');
      
      if (name?.trim()) {
        cookieStore.set(name.trim(), value?.trim() || '');
        
        // Análisis detallado para cookies de sesión
        if (name.includes('session') || name.includes('next-auth.session-token')) {
          console.log(`   🎯 ¡COOKIE DE SESIÓN!: ${name.trim()}`);
          console.log(`   🔐 Valor: ${value?.substring(0, 50)}...`);
          
          // Analizar atributos
          parts.slice(1).forEach(part => {
            if (part.toLowerCase().includes('samesite')) {
              console.log(`   🛡️ SameSite: ${part}`);
            }
            if (part.toLowerCase().includes('secure')) {
              console.log(`   🔒 Secure: true`);
            }
          });
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
    console.log(`   📤 Cookies enviadas: ${cookiesToSend.length} chars`);
  }
  
  const response = await fetch(url, {
    ...init,
    headers,
  });
  
  console.log(`   📨 Status: ${response.status} ${response.statusText}`);
  
  storeCookiesAdvanced(response, description);
  
  return response;
}

async function testWithKnownCredentials() {
  console.log('🔐 TEST CON CREDENCIALES ADMINISTRATIVAS CONOCIDAS');
  console.log('=================================================\n');
  
  // Usar el email administrativo que sabemos que existe
  const adminEmail = '3000bisonte@gmail.com';
  const adminPassword = 'bisonte_admin_2024'; // Contraseña que probablemente existe
  
  // Paso 1: Obtener CSRF
  const csrfResponse = await fetchWithCookies(
    `${BASE_URL}/api/auth/csrf`, 
    {}, 
    'Obtener CSRF'
  );
  
  const csrfData = await csrfResponse.json();
  const csrfToken = csrfData.csrfToken;
  
  console.log(`✅ CSRF: ${csrfToken}`);
  
  // Paso 2: Intentar con credenciales admin
  console.log(`\n🔑 Intentando con admin: ${adminEmail}`);
  
  const loginData = new URLSearchParams();
  loginData.append('email', adminEmail);
  loginData.append('password', adminPassword);
  loginData.append('csrfToken', csrfToken);
  loginData.append('callbackUrl', `${BASE_URL}/home`);
  loginData.append('json', 'true');
  
  console.log(`📝 Datos enviados: ${loginData.toString()}`);
  
  const loginResponse = await fetchWithCookies(
    `${BASE_URL}/api/auth/callback/credentials/`, // CON SLASH
    {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: loginData,
      redirect: 'manual'
    },
    'LOGIN ADMIN CON SLASH'
  );
  
  const loginText = await loginResponse.text();
  console.log(`\n📄 Response completa: ${loginText}`);
  
  // Analizar la respuesta
  try {
    const loginJson = JSON.parse(loginText);
    if (loginJson.url) {
      console.log(`\n📍 NextAuth redirect URL: ${loginJson.url}`);
      
      if (loginJson.url.includes('/signin')) {
        console.log('❌ CREDENCIALES RECHAZADAS - Redirige a signin');
        console.log('   Posibles causas:');
        console.log('   1. 🔐 Password incorrecto');
        console.log('   2. 📧 Email no existe');
        console.log('   3. ⚙️ Error en función authorize()');
        console.log('   4. 🔒 Cuenta bloqueada');
      } else if (loginJson.url.includes('/home') || loginJson.url.includes('callbackUrl')) {
        console.log('✅ ¡LOGIN EXITOSO! Redirige al destino correcto');
      }
    }
  } catch (e) {
    console.log('⚠️ Response no es JSON válido');
  }
  
  // Paso 3: Verificar sesión
  const sessionResponse = await fetchWithCookies(
    `${BASE_URL}/api/auth/session`,
    {},
    'Verificar sesión admin'
  );
  
  const sessionText = await sessionResponse.text();
  console.log(`\n📋 Sesión: ${sessionText}`);
  
  try {
    const sessionData = JSON.parse(sessionText);
    if (sessionData.user) {
      console.log('\n🎉 ¡ADMIN AUTENTICADO!');
      console.log(`   👤 ${sessionData.user.name}`);
      console.log(`   📧 ${sessionData.user.email}`);
      console.log(`   🔐 Role: ${sessionData.user.role}`);
      return true;
    }
  } catch (e) {
    console.log('❌ No hay sesión válida para admin');
  }
  
  // Si admin falla, probar con usuario recién creado
  console.log('\n🔄 Probando con usuario recién creado...');
  
  const newUserEmail = `debug-${Date.now()}@bisonteapp.com`;
  const newUserPassword = 'Debug123!@#';
  
  // Crear usuario nuevo
  const createResponse = await fetchWithCookies(
    `${BASE_URL}/api/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Debug User',
        celular: '+573001234567',
        ciudad: 'Bogotá', 
        email: newUserEmail,
        password: newUserPassword,
      }),
    },
    'Crear usuario debug'
  );
  
  if (createResponse.ok) {
    console.log('✅ Usuario debug creado');
    
    // Login inmediato con usuario recién creado
    const freshLoginData = new URLSearchParams();
    freshLoginData.append('email', newUserEmail);
    freshLoginData.append('password', newUserPassword);
    freshLoginData.append('csrfToken', csrfToken);
    freshLoginData.append('callbackUrl', `${BASE_URL}/home`);
    freshLoginData.append('json', 'true');
    
    const freshLoginResponse = await fetchWithCookies(
      `${BASE_URL}/api/auth/callback/credentials/`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: freshLoginData,
        redirect: 'manual'
      },
      'LOGIN USUARIO FRESCO'
    );
    
    const freshLoginText = await freshLoginResponse.text();
    console.log(`\n📄 Login usuario fresco: ${freshLoginText}`);
    
    // Verificar sesión del usuario fresco
    const freshSessionResponse = await fetchWithCookies(
      `${BASE_URL}/api/auth/session`,
      {},
      'Verificar sesión usuario fresco'
    );
    
    const freshSessionText = await freshSessionResponse.text();
    console.log(`\n📋 Sesión usuario fresco: ${freshSessionText}`);
    
    try {
      const freshSessionData = JSON.parse(freshSessionText);
      if (freshSessionData.user) {
        console.log('\n🎉 ¡USUARIO FRESCO AUTENTICADO!');
        console.log(`   👤 ${freshSessionData.user.name}`);
        console.log(`   📧 ${freshSessionData.user.email}`);
        return true;
      }
    } catch (e) {
      console.log('❌ Usuario fresco tampoco tiene sesión');
    }
  } else {
    console.log('❌ Error creando usuario debug');
  }
  
  return false;
}

async function main() {
  await initFetch();
  
  console.log(`🚀 Test con credenciales conocidas: ${BASE_URL}\n`);
  
  const success = await testWithKnownCredentials();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 DIAGNÓSTICO FINAL');
  console.log('='.repeat(60));
  
  if (success) {
    console.log('🎉 ¡AUTENTICACIÓN FUNCIONANDO!');
  } else {
    console.log('❌ PROBLEMA PERSISTE');
    console.log('\n🔍 El problema está en:');
    console.log('1. 🔐 Función authorize() rechaza credenciales válidas');
    console.log('2. 🍪 Cookies de sesión no se establecen después de authorize()');
    console.log('3. ⚙️ Error en callbacks jwt() o session()');
    console.log('4. 🔧 NEXTAUTH_SECRET inválido o no coincide');
    
    console.log('\n🎯 SIGUIENTE PASO CRÍTICO:');
    console.log('📱 Ir a Vercel Dashboard → Functions → Logs');
    console.log('🔍 Buscar logs de NextAuth con NEXTAUTH_DEBUG=true');
    console.log('📋 Ver errores específicos en authorize() function');
  }
}

main().catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});