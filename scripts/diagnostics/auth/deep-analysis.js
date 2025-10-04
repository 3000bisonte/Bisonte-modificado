#!/usr/bin/env node

/**
 * 🔍 ANÁLISIS PROFUNDO DEL FLUJO DE CREDENTIALS NextAuth
 * Identifica exactamente donde falla el proceso de autenticación
 */

const BASE_URL = process.argv[2] || 'https://bisonteapp.com';

console.log('🔍 Análisis Profundo del Flujo de Credentials');
console.log(`   Base URL: ${BASE_URL}`);
console.log('   Fecha:', new Date().toISOString());

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

// Cookie storage detallado
const cookieStore = new Map();
let requestCount = 0;

function storeCookies(response, requestInfo) {
  let cookiesFound = 0;
  
  // Compatibilidad con diferentes implementaciones de fetch
  if (response.headers.raw && typeof response.headers.raw === 'function') {
    const setCookieHeaders = response.headers.raw()['set-cookie'] || [];
    setCookieHeaders.forEach(cookieString => processCookie(cookieString, requestInfo));
    cookiesFound = setCookieHeaders.length;
  } else {
    // Fallback para fetch nativo
    response.headers.forEach((value, name) => {
      if (name.toLowerCase() === 'set-cookie') {
        processCookie(value, requestInfo);
        cookiesFound++;
      }
    });
  }
  
  if (cookiesFound === 0) {
    console.log(`   🍪 No cookies en respuesta de: ${requestInfo}`);
  }
}

function processCookie(cookieString, requestInfo) {
  const [nameValue] = cookieString.split(';');
  const [name, value] = nameValue.split('=');
  if (name && value !== undefined) {
    const trimmedName = name.trim();
    const trimmedValue = value.trim();
    cookieStore.set(trimmedName, trimmedValue);
    
    // Analizar tipo de cookie
    let cookieType = 'unknown';
    if (trimmedName.includes('csrf')) cookieType = 'CSRF';
    else if (trimmedName.includes('session')) cookieType = 'SESSION';
    else if (trimmedName.includes('callback')) cookieType = 'CALLBACK';
    else if (trimmedName.includes('nonce')) cookieType = 'NONCE';
    else if (trimmedName.includes('next-auth')) cookieType = 'NEXTAUTH';
    
    console.log(`   🍪 [${cookieType}] ${trimmedName} = ${trimmedValue.substring(0, 30)}${trimmedValue.length > 30 ? '...' : ''}`);
    console.log(`      ↳ Para: ${requestInfo}`);
    
    // Analizar atributos de la cookie
    const attributes = cookieString.split(';').slice(1).map(attr => attr.trim());
    if (attributes.length > 0) {
      console.log(`      ↳ Atributos: ${attributes.join(', ')}`);
    }
  }
}

function buildCookieHeader() {
  const cookies = Array.from(cookieStore.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
  return cookies || '';
}

async function fetchWithDebug(url, init = {}, description = '') {
  requestCount++;
  const requestId = `REQ${requestCount.toString().padStart(2, '0')}`;
  
  console.log(`\n🌐 ${requestId}: ${description || 'Request'}`);
  console.log(`   URL: ${url}`);
  console.log(`   Method: ${init.method || 'GET'}`);
  
  const headers = new Headers(init.headers || {});
  const cookieHeader = buildCookieHeader();
  
  if (cookieHeader) {
    headers.set('Cookie', cookieHeader);
    console.log(`   🍪 Cookies enviadas: ${cookieHeader.length} caracteres`);
    
    // Mostrar cookies importantes
    const importantCookies = Array.from(cookieStore.keys()).filter(name => 
      name.includes('csrf') || name.includes('session') || name.includes('next-auth')
    );
    if (importantCookies.length > 0) {
      console.log(`   🔑 Cookies críticas: ${importantCookies.join(', ')}`);
    }
  } else {
    console.log(`   🍪 No hay cookies para enviar`);
  }
  
  if (init.body && init.method === 'POST') {
    if (typeof init.body === 'string' && init.body.startsWith('{')) {
      console.log(`   📄 Body (JSON): ${init.body.substring(0, 100)}${init.body.length > 100 ? '...' : ''}`);
    } else {
      console.log(`   📄 Body (Form): ${init.body.toString().substring(0, 100)}${init.body.toString().length > 100 ? '...' : ''}`);
    }
  }

  try {
    const response = await fetch(url, {
      ...init,
      headers,
    });

    console.log(`   📨 Response: ${response.status} ${response.statusText}`);
    
    // Analizar headers importantes
    const contentType = response.headers.get('content-type');
    const location = response.headers.get('location');
    const cacheControl = response.headers.get('cache-control');
    
    if (contentType) console.log(`   📋 Content-Type: ${contentType}`);
    if (location) console.log(`   📍 Location: ${location}`);
    if (cacheControl) console.log(`   💾 Cache-Control: ${cacheControl}`);
    
    storeCookies(response, `${requestId} ${description}`);
    return response;
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    throw error;
  }
}

async function step1_checkProviders() {
  console.log('\n🔧 PASO 1: Verificando configuración de NextAuth...');
  
  try {
    const response = await fetchWithDebug(`${BASE_URL}/api/auth/providers`, {}, 'Obtener proveedores');
    const providers = await response.json();
    
    console.log('✅ Proveedores disponibles:', Object.keys(providers));
    
    if (providers.credentials) {
      console.log('✅ Proveedor de credentials configurado:');
      console.log(`   - ID: ${providers.credentials.id}`);
      console.log(`   - Name: ${providers.credentials.name}`);
      console.log(`   - Type: ${providers.credentials.type}`);
    } else {
      console.log('❌ Proveedor de credentials NO encontrado');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error verificando proveedores:', error.message);
    return false;
  }
}

async function step2_getCSRFToken() {
  console.log('\n🛡️ PASO 2: Obteniendo CSRF token...');
  
  try {
    const response = await fetchWithDebug(`${BASE_URL}/api/auth/csrf`, {}, 'Obtener CSRF token');
    const data = await response.json();
    
    if (data.csrfToken) {
      console.log('✅ CSRF token obtenido exitosamente');
      console.log(`   Token: ${data.csrfToken.substring(0, 20)}...`);
      return data.csrfToken;
    } else {
      console.log('❌ No se pudo obtener CSRF token');
      console.log('   Response:', JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error) {
    console.log('❌ Error obteniendo CSRF:', error.message);
    return null;
  }
}

async function step3_registerUser() {
  console.log('\n📝 PASO 3: Registrando usuario de prueba...');
  
  const testEmail = `deep-test+${Date.now()}@bisonteapp.com`;
  const testPassword = 'DeepTest123!@#';
  
  console.log(`   Email: ${testEmail}`);
  console.log(`   Password: ${testPassword}`);
  
  try {
    const response = await fetchWithDebug(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Deep Test User',
        celular: '+573001234567',
        ciudad: 'Bogotá',
        email: testEmail,
        password: testPassword,
      }),
    }, 'Registrar usuario');
    
    const responseText = await response.text();
    console.log(`   📊 Status: ${response.status}`);
    console.log(`   📄 Response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        if (data.user && data.user.id) {
          console.log('✅ Usuario registrado exitosamente');
          console.log(`   User ID: ${data.user.id}`);
          return { email: testEmail, password: testPassword, userId: data.user.id };
        }
      } catch (parseError) {
        console.log('⚠️ Respuesta no es JSON válido, pero status OK');
      }
      return { email: testEmail, password: testPassword };
    } else {
      console.log('❌ Registro falló');
      return null;
    }
  } catch (error) {
    console.log('❌ Error en registro:', error.message);
    return null;
  }
}

async function step4_attemptCredentialsLogin(credentials, csrfToken) {
  console.log('\n🔐 PASO 4: Intentando login con credentials...');
  
  if (!credentials) {
    console.log('❌ No hay credenciales para probar');
    return false;
  }
  
  console.log(`   Email: ${credentials.email}`);
  console.log(`   Password: [${credentials.password.length} caracteres]`);
  console.log(`   CSRF: ${csrfToken ? 'Disponible' : 'No disponible'}`);
  
  // Preparar datos del formulario
  const formData = new URLSearchParams();
  formData.append('email', credentials.email);
  formData.append('password', credentials.password);
  formData.append('csrfToken', csrfToken || '');
  formData.append('callbackUrl', `${BASE_URL}/home`);
  formData.append('json', 'true');
  
  console.log('\n   📝 Form Data preparado:');
  console.log(`      email: ${credentials.email}`);
  console.log(`      password: [HIDDEN]`);
  console.log(`      csrfToken: ${csrfToken ? 'Presente' : 'Ausente'}`);
  console.log(`      callbackUrl: ${BASE_URL}/home`);
  console.log(`      json: true`);
  
  try {
    const response = await fetchWithDebug(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData,
      redirect: 'manual' // No seguir redirects automáticamente
    }, 'Login con credentials');
    
    console.log(`\n   📊 Análisis de respuesta de login:`);
    console.log(`      Status: ${response.status} ${response.statusText}`);
    
    // Analizar el tipo de respuesta
    let responseAnalysis = '';
    if (response.status >= 200 && response.status < 300) {
      responseAnalysis = 'SUCCESS - Login procesado';
    } else if (response.status >= 300 && response.status < 400) {
      responseAnalysis = 'REDIRECT - NextAuth redirigiendo';
    } else if (response.status >= 400 && response.status < 500) {
      responseAnalysis = 'CLIENT_ERROR - Problema con la request';
    } else if (response.status >= 500) {
      responseAnalysis = 'SERVER_ERROR - Error interno del servidor';
    }
    console.log(`      Análisis: ${responseAnalysis}`);
    
    // Verificar redirección
    const location = response.headers.get('location');
    if (location) {
      console.log(`      📍 Redirige a: ${location}`);
      
      // Analizar el tipo de redirección
      if (location.includes('/api/auth/error')) {
        console.log('      ❌ PROBLEMA: Redirigiendo a página de error');
        const url = new URL(location, BASE_URL);
        const errorParam = url.searchParams.get('error');
        if (errorParam) {
          console.log(`      🚨 Error específico: ${errorParam}`);
        }
      } else if (location.includes('/home') || location.includes('/dashboard')) {
        console.log('      ✅ ÉXITO: Redirigiendo a página protegida');
      } else {
        console.log('      ⚠️ INCIERTO: Redirección a ubicación inesperada');
      }
    }
    
    // Leer el body de la respuesta
    const responseText = await response.text();
    console.log(`      📄 Body length: ${responseText.length} caracteres`);
    
    if (responseText.length > 0) {
      console.log(`      📄 Body preview: ${responseText.substring(0, 150)}${responseText.length > 150 ? '...' : ''}`);
      
      // Intentar parsear como JSON
      try {
        const jsonResponse = JSON.parse(responseText);
        if (jsonResponse.error) {
          console.log(`      🚨 Error en JSON: ${jsonResponse.error}`);
        }
        if (jsonResponse.url) {
          console.log(`      📍 URL en JSON: ${jsonResponse.url}`);
        }
      } catch (e) {
        // No es JSON, ignorar
      }
    }
    
    // Verificar cookies de sesión establecidas
    console.log('\n   🍪 Análisis de cookies post-login:');
    const sessionCookies = Array.from(cookieStore.keys()).filter(name => 
      name.includes('session') || name.includes('next-auth.session-token') || name.includes('__Secure-next-auth.session-token')
    );
    
    if (sessionCookies.length > 0) {
      console.log(`      ✅ Cookies de sesión encontradas: ${sessionCookies.length}`);
      sessionCookies.forEach(cookieName => {
        const cookieValue = cookieStore.get(cookieName);
        console.log(`      🔑 ${cookieName}: ${cookieValue.substring(0, 30)}...`);
      });
    } else {
      console.log(`      ❌ NO se encontraron cookies de sesión`);
      console.log(`      📋 Cookies actuales:`);
      Array.from(cookieStore.keys()).forEach(name => {
        console.log(`         - ${name}`);
      });
    }
    
    return {
      success: response.status < 400,
      status: response.status,
      location: location,
      hasSessionCookies: sessionCookies.length > 0,
      responseText: responseText
    };
    
  } catch (error) {
    console.log('❌ Error durante login:', error.message);
    return { success: false, error: error.message };
  }
}

async function step5_verifySession() {
  console.log('\n✅ PASO 5: Verificando sesión establecida...');
  
  try {
    const response = await fetchWithDebug(`${BASE_URL}/api/auth/session`, {}, 'Verificar sesión');
    const sessionText = await response.text();
    
    console.log(`   📊 Status: ${response.status}`);
    console.log(`   📄 Response length: ${sessionText.length} caracteres`);
    
    if (sessionText && sessionText.length > 2) {
      console.log(`   📄 Session data: ${sessionText.substring(0, 200)}${sessionText.length > 200 ? '...' : ''}`);
      
      try {
        const sessionData = JSON.parse(sessionText);
        
        if (sessionData && sessionData.user) {
          console.log('✅ SESIÓN VÁLIDA ENCONTRADA:');
          console.log(`   👤 User ID: ${sessionData.user.id || 'N/A'}`);
          console.log(`   📧 Email: ${sessionData.user.email || 'N/A'}`);
          console.log(`   👤 Name: ${sessionData.user.name || 'N/A'}`);
          console.log(`   🔑 Role: ${sessionData.user.role || 'N/A'}`);
          
          if (sessionData.expires) {
            console.log(`   ⏰ Expires: ${sessionData.expires}`);
          }
          
          return true;
        } else {
          console.log('❌ SESIÓN VACÍA O INVÁLIDA:');
          console.log('   Estructura:', Object.keys(sessionData));
          return false;
        }
      } catch (parseError) {
        console.log('❌ Error parseando sesión:', parseError.message);
        return false;
      }
    } else {
      console.log('❌ RESPUESTA VACÍA - No hay sesión');
      return false;
    }
  } catch (error) {
    console.log('❌ Error verificando sesión:', error.message);
    return false;
  }
}

async function step6_analyzeAuthFlow() {
  console.log('\n🔍 PASO 6: Análisis del flujo completo...');
  
  console.log('\n📋 RESUMEN DE COOKIES:');
  if (cookieStore.size === 0) {
    console.log('   ❌ No hay cookies almacenadas');
  } else {
    Array.from(cookieStore.entries()).forEach(([name, value]) => {
      let type = '🍪';
      if (name.includes('csrf')) type = '🛡️';
      else if (name.includes('session')) type = '🔑';
      else if (name.includes('callback')) type = '📞';
      
      console.log(`   ${type} ${name}: ${value.substring(0, 40)}${value.length > 40 ? '...' : ''}`);
    });
  }
  
  console.log('\n🔬 DIAGNÓSTICO TÉCNICO:');
  
  // Verificar si las cookies tienen el formato correcto
  const nextAuthCookies = Array.from(cookieStore.keys()).filter(name => name.includes('next-auth'));
  if (nextAuthCookies.length === 0) {
    console.log('   ❌ No se encontraron cookies de NextAuth');
    console.log('   💡 Posible causa: NextAuth no está funcionando correctamente');
  } else {
    console.log(`   ✅ Se encontraron ${nextAuthCookies.length} cookies de NextAuth`);
  }
  
  // Verificar dominios de cookies (esto requeriría análisis más profundo)
  console.log('\n💡 POSIBLES CAUSAS DEL PROBLEMA:');
  console.log('   1. La función authorize() en NextAuth está fallando silenciosamente');
  console.log('   2. Hay un problema con la configuración de JWT/Session');
  console.log('   3. Las cookies se están creando pero con dominio incorrecto');
  console.log('   4. Hay un error en los callbacks de NextAuth');
  console.log('   5. La base de datos no está respondiendo correctamente');
  
  console.log('\n🔧 PRÓXIMOS PASOS RECOMENDADOS:');
  console.log('   1. Activar NEXTAUTH_DEBUG=true en producción temporalmente');
  console.log('   2. Revisar logs del servidor durante el proceso de login');
  console.log('   3. Verificar que la función authorize() retorne el objeto usuario correcto');
  console.log('   4. Confirmar que los callbacks jwt() y session() funcionen');
  console.log('   5. Validar conectividad con la base de datos');
}

async function main() {
  console.log('\n🚀 Iniciando análisis profundo del flujo de credentials...\n');
  
  await initFetch();
  
  const providersOK = await step1_checkProviders();
  if (!providersOK) {
    console.log('\n💥 ANÁLISIS DETENIDO: Problemas con configuración básica de NextAuth');
    return;
  }
  
  const csrfToken = await step2_getCSRFToken();
  
  const credentials = await step3_registerUser();
  
  const loginResult = await step4_attemptCredentialsLogin(credentials, csrfToken);
  
  const sessionValid = await step5_verifySession();
  
  await step6_analyzeAuthFlow();
  
  console.log('\n📊 RESULTADO FINAL:');
  console.log('================');
  
  if (sessionValid) {
    console.log('🎉 ¡LOGIN EXITOSO! El flujo está funcionando correctamente.');
  } else {
    console.log('❌ LOGIN FALLÓ. El problema está en el flujo de autenticación.');
    
    if (loginResult && loginResult.success) {
      console.log('   → El endpoint de login responde OK, pero no se crea sesión');
      console.log('   → Problema probable: Callbacks de NextAuth o configuración JWT');
    } else {
      console.log('   → El endpoint de login está fallando');
      console.log('   → Problema probable: Función authorize() o validación de credenciales');
    }
  }
  
  console.log('\n🔧 Para continuar el diagnóstico, revisa:');
  console.log('   - src/lib/auth.js (función authorize)');
  console.log('   - Callbacks jwt() y session()');
  console.log('   - Variables de entorno NEXTAUTH_*');
  console.log('   - Logs del servidor en tiempo real');
}

main().catch(error => {
  console.error('💥 Error fatal en análisis:', error);
  process.exit(1);
});